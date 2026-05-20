# Plan: Sendero v2 — Notificaciones, Conexión entre usuarios, IA contextual y Limpieza visual

## Contexto

La plataforma **Sendero** (Next.js 15 + Supabase + Stripe) está en producción. NO podemos romper datos existentes; cada cambio debe ser **aditivo** (nuevas tablas/columnas con default, RLS desde el inicio, sin renombrar lo ya creado). El usuario pide cuatro frentes:

1. **Sistema de notificaciones completo** — el admin puede enviar mensajes a usuarios (uno, grupo o todos); el usuario los recibe in-app (campana ya stubbed en [platform-sidebar.tsx:307-321](components/layout/platform-sidebar.tsx#L307-L321)) y opcionalmente por email.
2. **Conexión entre usuarios** — ver perfil de otro usuario, mandarle mensaje directo, dejar comentarios en su perfil, o contactarlo por email vía la plataforma.
3. **IA contextual sobre las clases** — un asistente que responde preguntas usando como grounding las formaciones / módulos / lecciones / transcripts.
4. **Limpieza visual** — quitar el buscador global (Cmd+K) y reemplazar el logo de estrella (`Sparkles`) por un icono más impactante coherente con "Sendero" (sendero = camino/ruta).

Estado actual relevante (verificado en exploración):
- **NO existe** tabla de notificaciones, mensajes directos, conversaciones, ni nada de email.
- **SÍ existe** sistema de comentarios anidados (`reflections` + `reflection_reactions`, [scripts/008_comments_replies_reactions.sql](scripts/008_comments_replies_reactions.sql)) atados a lecciones, no a perfiles.
- Perfil es **solo-yo** ([app/(platform)/profile/page.tsx](app/(platform)/profile/page.tsx)); no hay ruta `[userId]`.
- Buscador en [components/layout/search-command.tsx](components/layout/search-command.tsx), montado en [components/layout/platform-sidebar.tsx:39](components/layout/platform-sidebar.tsx#L39) y abierto con Cmd+K (línea 91-100). API en [app/api/search/](app/api/search/).
- Logo: `Sparkles` (no `Star`) en [platform-sidebar.tsx:149](components/layout/platform-sidebar.tsx#L149), [admin-sidebar.tsx:113](components/layout/admin-sidebar.tsx#L113) y múltiples puntos del landing.
- Lecciones tienen columna `transcript` ya en el schema ([scripts/004_unify_schema.sql:35](scripts/004_unify_schema.sql#L35)) pero vacía en seeds — útil para grounding de IA.
- `SUPABASE_SERVICE_ROLE_KEY` aún **no expuesto** en `lib/supabase/`; hay que añadir cliente admin.
- Supabase Realtime ya se usa en un sitio ([taberna-feed.tsx:148](app/(platform)/taberna/taberna-feed.tsx#L148)) — patrón replicable para campana en vivo.

---

## Estrategia general

- **Fase 0** (atómica, ~1 día): limpieza visual — quitar buscador y cambiar logo. Bajo riesgo, libera UI antes de añadir más.
- **Fase 1** (~3-4 días): notificaciones in-app + email opcional, con panel admin para envío.
- **Fase 2** (~2-3 días): perfiles públicos + mensajería directa entre usuarios.
- **Fase 3** (~3-5 días): asistente IA contextual.

Todas las migraciones SQL nuevas van en `scripts/009_*.sql`, `010_*.sql`, etc., **nunca** modificando archivos previos. Todas las tablas nuevas nacen con RLS habilitado y políticas explícitas. Cada fase es desplegable de forma independiente detrás de un check de existencia (no rompe si la migración aún no corrió).

---

## Fase 0 — Limpieza visual (buscador + logo)

### 0.1 Quitar el buscador global

**Archivos a tocar:**
- [components/layout/platform-sidebar.tsx](components/layout/platform-sidebar.tsx) — eliminar:
  - Import `SearchCommand` (línea 39)
  - State `isSearchOpen` (línea 71)
  - `useEffect` de Cmd+K (líneas 91-100)
  - Botón "Buscar" en sidebar (~línea 106)
  - Render `<SearchCommand ... />` al final del componente
- [components/layout/search-command.tsx](components/layout/search-command.tsx) — borrar archivo completo.
- [app/api/search/](app/api/search/) — borrar carpeta completa.
- Buscar `SearchCommand` con grep para asegurar que no quedan referencias colgadas.

### 0.2 Reemplazar el logo (Sparkles → icono coherente con "Sendero")

**Decisión a confirmar con usuario** (ver preguntas finales): se propone un SVG custom inline (montaña + sendero ascendente estilizado) en un componente nuevo [components/ui/logo.tsx](components/ui/logo.tsx) reutilizable. Alternativa rápida: usar `Mountain` o `Compass` de lucide-react.

**Pasos:**
- Crear `components/ui/logo.tsx` exportando `<SenderoLogo className=... />` (SVG con paleta dorada coherente con el resto).
- Reemplazar `Sparkles` como **logo** (no como decoración de XP/CTA) en:
  - [components/layout/platform-sidebar.tsx:149](components/layout/platform-sidebar.tsx#L149)
  - [components/layout/admin-sidebar.tsx:113](components/layout/admin-sidebar.tsx#L113)
  - [app/_landing/landing-page.tsx:60](app/_landing/landing-page.tsx#L60) (header del landing)
- **No tocar** los `Sparkles` decorativos del landing (455, 579, 626, 667) ni los de register-modal ni carousel — esos son ornamento, no logo. Confirmar con usuario.
- Actualizar favicon en `app/` (si existe) con el nuevo símbolo.

### 0.3 Verificación Fase 0

- `npm run dev` y navegar sidebar plataforma + admin + landing. Cmd+K no debe abrir nada.
- `npm run build` debe pasar sin warnings de imports.
- `npm run lint`.

---

## Fase 1 — Sistema de notificaciones

### 1.1 Schema (script `009_notifications.sql`)

```sql
-- Tipos
CREATE TYPE notification_kind AS ENUM (
  'admin_announcement', 'comment_reply', 'mention',
  'new_message', 'mentorship_booked', 'system'
);
CREATE TYPE notification_channel AS ENUM ('in_app', 'email', 'both');

-- Tabla principal
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  kind notification_kind NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,                 -- ruta interna para CTA
  metadata JSONB DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES profiles(id)   -- admin que la generó (nullable para system)
);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, created_at DESC) WHERE read_at IS NULL;
CREATE INDEX idx_notifications_user_all    ON notifications(user_id, created_at DESC);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own"   ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users update own" ON notifications FOR UPDATE USING (auth.uid() = user_id);
-- INSERT solo via service role (server actions admin); sin policy de INSERT a clientes.

-- Tabla de "campañas" admin (auditoría + reenvío)
CREATE TABLE notification_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES profiles(id),
  audience JSONB NOT NULL,   -- { type: 'all'|'role'|'formation'|'user_ids', value: ... }
  channel notification_channel NOT NULL DEFAULT 'in_app',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link TEXT,
  recipient_count INT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE notification_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins all" ON notification_campaigns
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
```

### 1.2 Cliente Supabase admin

Crear [lib/supabase/admin.ts](lib/supabase/admin.ts):
```ts
import { createClient } from "@supabase/supabase-js";
export const supabaseAdmin = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
	{ auth: { persistSession: false } });
```
Documentar la nueva env var en `.env.example` (si existe, si no, comentarlo al usuario).

### 1.3 Servicio de notificaciones

[lib/services/notifications.ts](lib/services/notifications.ts):
- `createNotification(userId, kind, payload)` — inserta una.
- `createBulk(userIds[], kind, payload)` — inserta masivo (chunk 500).
- `markAsRead(notificationId)` y `markAllAsRead(userId)`.
- `listForUser(userId, { limit, cursor, onlyUnread })`.
- `sendAdminCampaign({ audience, channel, title, body, link, adminId })` — resuelve audiencia → IDs → inserta + opcionalmente envía email + registra en `notification_campaigns`.

Audiencias soportadas: `all`, `role: 'student'|'mentor'`, `formation: <id>` (todos los enrolled), `user_ids: [...]`.

### 1.4 Email (opcional según decisión usuario)

Si se elige email: añadir **Resend** (`resend` npm package, encaja con Vercel). Variable `RESEND_API_KEY`. Plantilla mínima en `lib/services/email-templates/notification.tsx` (React Email opcional, o HTML simple). Falla silenciosa con log si Resend no está configurado — la notificación in-app sigue creándose.

### 1.5 UI usuario — campana en sidebar

Reemplazar el stub deshabilitado de [platform-sidebar.tsx:307-321](components/layout/platform-sidebar.tsx#L307-L321) por un componente nuevo:
- [components/notifications/notifications-bell.tsx](components/notifications/notifications-bell.tsx) — botón con badge (contador no-leído).
- [components/notifications/notifications-panel.tsx](components/notifications/notifications-panel.tsx) — popover/sheet con lista, "marcar todo como leído", paginación.
- Suscripción Realtime a `postgres_changes` en `notifications` filtrado por `user_id=eq.<uid>` (patrón replicado de [taberna-feed.tsx:148](app/(platform)/taberna/taberna-feed.tsx#L148)).
- Click en notificación → marca leída + navega a `link`.

### 1.6 Admin — página enviar notificación

Nueva ruta [app/(admin)/admin/notifications/page.tsx](app/(admin)/admin/notifications/page.tsx) + entrada en [components/layout/admin-sidebar.tsx](components/layout/admin-sidebar.tsx).
- Formulario: título, cuerpo (textarea), link opcional, canal (in-app/email/ambos), selector de audiencia (radio: todos / por rol / por formación / usuarios específicos con búsqueda multiselect).
- Vista previa de count antes de enviar ("se enviará a 234 usuarios").
- Tab "Historial" listando `notification_campaigns` más recientes con su recipient_count.
- Server action [app/(admin)/admin/notifications/actions.ts](app/(admin)/admin/notifications/actions.ts) llamando a `sendAdminCampaign`, con `requireAdmin()` (helper que ya se usa en [app/api/admin/lessons/[id]/route.ts:12-69](app/api/admin/lessons/[id]/route.ts#L12-L69)).

### 1.7 Triggers automáticos (mínimos en esta fase)

- Al responder un comentario (`reflections.parent_id != null`): notificar al autor del padre — añadir lógica en el server action existente de `addCommentReply` en `app/(platform)/learn/[slug]/[lessonId]/actions.ts`.
- Al recibir mensaje directo (Fase 2): handler ahí mismo.

### 1.8 Verificación Fase 1

- Migrar `009_notifications.sql` en staging primero (si hay), sino directo en prod con backup previo confirmado.
- Admin envía notificación de prueba a sí mismo → la ve in-app en tiempo real.
- Admin envía a "todos" en entorno de prueba con 2-3 cuentas falsas → cada una recibe.
- Marcar como leídas funciona; contador baja.
- Si email habilitado: revisar inbox y spam.

---

## Fase 2 — Perfiles públicos + mensajería directa

### 2.1 Schema (script `010_messaging_profiles.sql`)

```sql
-- Visibilidad de perfil
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_visibility TEXT
  NOT NULL DEFAULT 'community' CHECK (profile_visibility IN ('private', 'community', 'public'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS allow_direct_messages BOOLEAN DEFAULT true;

-- Conversaciones
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  last_message_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE conversation_participants (
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ,
  PRIMARY KEY (conversation_id, user_id)
);
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_messages_conv ON messages(conversation_id, created_at DESC);

-- Comentarios en perfil (muro)
CREATE TABLE profile_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES profile_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS clave: solo participantes pueden leer mensajes y conversaciones
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_comments ENABLE ROW LEVEL SECURITY;
-- (políticas detalladas en el script — selección/inserción solo para participants)
```

### 2.2 Perfil público

- Nueva ruta [app/(platform)/u/[userId]/page.tsx](app/(platform)/u/[userId]/page.tsx) (uso `/u/...` para no chocar con `/profile` actual que sigue siendo self).
- Respeta `profile_visibility`:
  - `private` → 404 si no eres tú.
  - `community` → visible solo a logged-in.
  - `public` → visible siempre (futuro SEO).
- Muestra: avatar, nombre, bio, rol, level/XP (opcional según privacy), formaciones completadas, reflections públicas, muro de comentarios.
- CTAs: "Enviar mensaje", "Comentar en perfil", "Bloquear" (futuro).
- Añadir link al perfil de cada autor en componentes de comentarios existentes ([components/comments/comment-thread.tsx](components/comments/comment-thread.tsx)).

### 2.3 Mensajería directa

- Página [app/(platform)/messages/page.tsx](app/(platform)/messages/page.tsx) — lista de conversaciones.
- [app/(platform)/messages/[conversationId]/page.tsx](app/(platform)/messages/[conversationId]/page.tsx) — hilo individual con Realtime subscribe a `messages`.
- Server action `startConversation(otherUserId)` — busca conversación 1:1 existente o la crea.
- Trigger: cada mensaje nuevo genera notificación tipo `new_message` para el otro participante (reutiliza Fase 1).
- Respetar `allow_direct_messages` del destinatario.
- Añadir entrada "Mensajes" en sidebar plataforma con badge de no leídos.

### 2.4 Settings de privacidad

Extender [app/(platform)/profile/settings/](app/(platform)/profile/settings/) con toggles:
- Visibilidad del perfil (private/community/public)
- Permitir mensajes directos
- Email de notificación habilitado

### 2.5 Verificación Fase 2

- Dos cuentas de prueba: A visita `/u/<B>`, deja comentario, envía mensaje. B recibe notificación in-app + ve mensaje en `/messages`.
- Privacy: A pone perfil "private" → B obtiene 404.
- RLS: intento manual con SQL desde service role de leer mensaje ajeno debe fallar para cliente con anon key.

---

## Fase 3 — Asistente IA contextual sobre las clases

### 3.1 Decisión de arquitectura

**Recomendado**: Anthropic Claude API (`@anthropic-ai/sdk`) con:
- **Prompt caching** sobre el contexto de la formación/lección para abaratar uso repetido.
- **RAG ligero** sobre `lessons.transcript + description` + `formations.long_description` + `modules.title`. No requiere vector DB inicialmente — el catálogo es pequeño (lo confirmaremos contando filas) y cabe en el contexto cacheado.
- Si el catálogo crece (>200 lecciones con transcripts largos), añadir embeddings con `pgvector` en una iteración futura.

### 3.2 Schema (script `011_ai_assistant.sql`)

```sql
CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
  formation_id UUID REFERENCES formations(id) ON DELETE SET NULL,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  tokens_used INT,
  created_at TIMESTAMPTZ DEFAULT now()
);
-- RLS: solo dueño lee/escribe.
```

### 3.3 Endpoint streaming

[app/api/ai/chat/route.ts](app/api/ai/chat/route.ts):
- POST con `{ lessonId?, formationId?, conversationId?, message }`.
- Construye el system prompt con:
  - Identidad: "Eres el asistente de Sendero, formado en el contenido de la plataforma."
  - Contexto: si `lessonId`, incluye `lesson.title + description + transcript` + título de su módulo y formación. Si solo `formationId`, incluye descripción de la formación + lista de módulos/lecciones (títulos + descripciones cortas).
  - Reglas: cita lecciones por nombre, no inventa contenido fuera del catálogo, dirige al usuario a una lección concreta cuando aplique, responde en español.
- Marca el bloque de contexto como `cache_control: { type: 'ephemeral' }` (prompt caching ahorra ~90% en mensajes repetidos sobre la misma lección).
- Rate-limit por usuario reutilizando [lib/rate-limit.ts](lib/rate-limit.ts).
- Devuelve stream SSE.

### 3.4 UI

- Widget flotante o panel lateral disponible dentro de [app/(platform)/learn/[slug]/[lessonId]/](app/(platform)/learn/) — "Pregunta sobre esta lección". Contexto = lección actual.
- Página dedicada [app/(platform)/assistant/page.tsx](app/(platform)/assistant/page.tsx) con selector de formación/lección y historial de conversaciones del usuario.
- Componente reutilizable [components/ai/chat-panel.tsx](components/ai/chat-panel.tsx) con streaming (fetch + ReadableStream).

### 3.5 Costo y límites

- Env var: `ANTHROPIC_API_KEY`.
- Modelo: `claude-haiku-4-5-20251001` por defecto (rápido + barato), opción admin para escalar a Sonnet 4.6 para usuarios premium.
- Límite por usuario: 50 mensajes/día (config en `lib/rate-limit.ts`), 200 para usuarios con `subscription.status='active'`.
- Telemetría: registrar `tokens_used` para monitoreo de coste.

### 3.6 Verificación Fase 3

- Pregunta sobre una lección concreta — la respuesta cita el título de la lección y se ciñe al contenido.
- Pregunta fuera de tema (ej: "¿qué tiempo hace?") — el asistente declina educadamente.
- Streaming visible en UI.
- Segundo mensaje en la misma sesión hace cache hit (verificable en headers / response usage).
- Rate-limit funciona: 51º mensaje devuelve 429.

---

## Archivos críticos a tocar (resumen)

**Nuevos:**
- `scripts/009_notifications.sql`, `010_messaging_profiles.sql`, `011_ai_assistant.sql`
- `lib/supabase/admin.ts`
- `lib/services/notifications.ts`, `lib/services/messaging.ts`, `lib/services/ai-chat.ts`
- `lib/services/email-templates/*` (si Resend)
- `components/ui/logo.tsx`
- `components/notifications/notifications-bell.tsx`, `notifications-panel.tsx`
- `components/ai/chat-panel.tsx`
- `app/(admin)/admin/notifications/page.tsx` + `actions.ts`
- `app/(platform)/u/[userId]/page.tsx`
- `app/(platform)/messages/page.tsx`, `messages/[conversationId]/page.tsx`
- `app/(platform)/assistant/page.tsx`
- `app/api/ai/chat/route.ts`

**Modificados (aditivos):**
- `components/layout/platform-sidebar.tsx` (quitar buscador, sustituir logo, añadir campana real, añadir entrada Mensajes y Asistente)
- `components/layout/admin-sidebar.tsx` (sustituir logo, añadir entrada Notificaciones)
- `app/_landing/landing-page.tsx` (sustituir Sparkles de header — confirmar resto)
- `components/comments/comment-thread.tsx` (linkear nombres a `/u/[userId]`)
- `app/(platform)/learn/[slug]/[lessonId]/actions.ts` (disparar notificación en reply)
- `app/(platform)/profile/settings/` (toggles de privacidad)
- `package.json` (`@anthropic-ai/sdk`, opcional `resend`)
- `.env.example` (nuevas claves)

**Eliminados:**
- `components/layout/search-command.tsx`
- `app/api/search/` (carpeta completa)

---

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Migración rompe prod | Cada script SQL es idempotente (`IF NOT EXISTS`, `IF NOT EXISTS`) y aditivo. Backup de Supabase antes de aplicar. Aplicar primero en proyecto de staging si existe. |
| Service role key expuesto en cliente | `lib/supabase/admin.ts` solo se importa desde server actions y `/api/admin/*`. Nunca en componentes `"use client"`. Verificar con grep. |
| Spam de notificaciones a "todos" | UI admin con confirmación explícita ("vas a notificar a 234 usuarios") + log en `notification_campaigns`. |
| Coste IA descontrolado | Rate-limit por usuario + prompt caching + Haiku como default + métricas por conversación. |
| Mensajes filtrados a no-participantes | RLS exhaustivo + un test SQL manual con cliente anon antes de marcar fase verificada. |
| Romper UI al cambiar logo | Crear `<SenderoLogo />` y reemplazar en 3 sitios; verificar visualmente cada uno antes de merge. |

---

## Verificación end-to-end

Tras cada fase, antes de mergear:
1. `npm run build` y `npm run lint` limpios.
2. Smoke test manual con dos cuentas (admin + estudiante) en `npm run dev`.
3. Revisar Supabase logs por errores de RLS.
4. Para Fase 1+: enviar notificación de prueba a usuario interno antes de habilitar audience='all'.

---

## Decisiones cerradas con el usuario

1. **Notificaciones — canal**: Solo **in-app** en Fase 1. El campo `channel` en el schema se deja para forward-compat, pero NO se integra Resend ni se envía email. El admin solo elige audiencia y mensaje; el destinatario lo ve en la campana en tiempo real.
2. **Proveedor IA**: **Anthropic Claude** (`@anthropic-ai/sdk`). Default `claude-haiku-4-5-20251001` con prompt caching del contexto de la lección. Sonnet 4.6 reservado para usuarios `subscription.status='active'` mediante flag en runtime. Endpoint streaming SSE.
3. **Logo**: **SVG custom inline** — silueta de montaña con un sendero ascendente estilizado, paleta dorada coherente con la marca. Se implementa como `<SenderoLogo />` en [components/ui/logo.tsx](components/ui/logo.tsx). Se sustituye en sidebar plataforma, sidebar admin y header del landing. Los `Sparkles` decorativos del landing (no-logo) se mantienen.
4. **Alcance Fase 2**: **Completo** — perfil público en `/u/[userId]` con visibilidad configurable, mensajería directa con Realtime, muro de comentarios en perfil, y settings de privacidad en `/profile/settings`. Cada mensaje nuevo genera notificación in-app vía la infra de Fase 1.
