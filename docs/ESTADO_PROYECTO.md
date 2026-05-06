# Estado del Proyecto — Ainara Plataforma

> Última actualización: 2026-05-07  
> Prioridad actual: plataforma de usuario (sin landing, sin pagos, sin admin)

---

## ¿De qué trata?

**Ainara** es una plataforma de educación para el desarrollo personal y espiritual. El usuario se inscribe en **formaciones** (cursos), ve las **lecciones en video**, acumula **XP y sube de nivel**, comparte reflexiones en **La Taberna** (comunidad tipo foro), y accede a **mentoría** con Ainara.

La arquitectura es Next.js 15 App Router + Supabase (base de datos, auth, storage) + Cloudflare Stream (videos). El diseño sigue un sistema luxury-gold con Tailwind.

---

## Mapa de la plataforma

```
/dashboard        → Panel principal con stats, progreso, actividad reciente
/library          → Catálogo de formaciones con filtros
/formations/[slug]→ Detalle de formación + inscripción
/learn/[slug]/[lessonId] → Visor de lección (video, progreso, comentarios)
/quest            → Misiones y gamificación (XP, niveles)
/taberna          → Comunidad: publicar reflexiones, resonar (likes)
/mentorship       → Página de mentoría (UI lista, backend pendiente)
/profile          → Perfil de usuario, estadísticas, datos personales
```

---

## ✅ Lo que FUNCIONA

### Autenticación y autorización
- Login/registro con Supabase Auth
- Middleware protege rutas por rol (student / mentor / admin)
- Caché de roles en cookie (5 min) → sin DB query en cada request
- Redirección correcta a `/login?redirect=` con return URL

### Dashboard (`/dashboard`)
- Stats reales: racha, XP, lecciones completadas, formaciones completadas
- Sección "Continuar aprendiendo" con progreso por formación
- Actividad reciente: últimas 5 lecciones completadas
- Datos cargados en paralelo (sin N+1)

### Biblioteca (`/library`)
- Catálogo completo de formaciones publicadas
- Filtros: búsqueda por texto, dificultad, estado (todas / inscritas / completadas)
- Tarjetas con progreso, badges, thumbnails
- Lógica de progreso en 2 queries batched (sin N+1)

### Detalle de formación (`/formations/[slug]`)
- Información completa: descripción, módulos, lecciones
- Inscripción con optimistic update + **toast de éxito/error** ✓
- Progreso visual por lección (completadas/pendientes)
- Redirección a la siguiente lección pendiente

### Visor de lección (`/learn/[slug]/[lessonId]`)
- Layout de dos columnas: video + sidebar de curriculum
- VideoPlayer (Cloudflare Stream) con tracking de progreso
- Marcado de lección como completada + **toast con XP ganado** ✓
- Comentarios por lección (inserción en tabla `reflections`)
- Navegación anterior/siguiente lección
- **Error boundary** para capturar crashes ✓
- Verificación de enrollment antes de mostrar contenido

### Sistema XP y niveles
- `awardXP()` service: calcula nivel nuevo, racha de días, actualiza perfil
- `markLessonCompleted()` devuelve `{ xpEarned, leveledUp }` → se muestra en toast

### La Taberna (`/taberna`)
- Publicar reflexiones → formulario con feedback inline y **toast de éxito** ✓
- Resonar (like) con actualización optimista y rollback si falla
- Visualización con tiempo relativo en español
- Badge de admin para usuarios con rol especial

### Aventura / Quest (`/quest`)
- Misiones dinámicas basadas en datos reales del usuario
- "La Primera Sangre" (completar lección), "Voz del Pueblo" (publicar en taberna)
- XP y nivel mostrados con barra de progreso

### Mentoría (`/mentorship`)
- UI completa: tarjetas de mentor, especialidades, precios
- Fallback automático al perfil de Ainara si no hay mentores en DB

### Perfil (`/profile`)
- Edición de nombre, bio, datos de nacimiento, ciudad
- Stats: XP, nivel, racha, lecciones completadas
- Diseño con elemento astrológico (signo solar calculado)

### Infraestructura
- Error boundaries en `/`, `/learn/[slug]/[lessonId]`, `/formations/[slug]` ✓
- Loading skeletons en todas las rutas ✓
- Toast system (Sonner) instalado y funcionando ✓
- Schema unificado documentado en `scripts/004_unify_schema.sql` ✓
- `React.cache()` en todas las queries críticas (deduplicación automática)

---

## ❌ Lo que NO FUNCIONA / ROTO

### 1. Videos — BLOQUEANTE PRINCIPAL

**Error**: `Upload creation error: Authentication error` desde Cloudflare Stream  
**Causa**: El `CLOUDFLARE_API_TOKEN` en `.env.local` no tiene permisos de Stream o es incorrecto.

**Síntomas visibles al usuario**: El lesson viewer muestra "Video no disponible" en todas las lecciones donde `video_url` no esté configurada.

**Opciones de fix (ver Plan de Implementación):**
- Fix rápido: El VideoPlayer aceptará URLs de **YouTube, Vimeo y MP4 directo** además de Cloudflare Stream → cargar videos de YouTube/Vimeo en el admin mientras se resuelven las credenciales
- Fix definitivo: Generar token de API en Cloudflare con permiso `Stream:Edit`

---

### 2. `POST /api/progress` — 500 Intermitente

**Error en log**: `POST /api/progress 500`  
**Frecuencia**: ~50% de los POSTs fallan, los otros 200.

**Causa probable**: Condición de carrera. El VideoPlayer dispara `onProgress` continuamente y dos requests concurrentes intentan insertar el mismo `(user_id, lesson_id)` al mismo tiempo. El primero inserta, el segundo intenta `.select().single()` antes de que el primero confirme → duplicado o constraint violation.

**Fix**: Añadir `upsert` en vez de insert condicional, o debounce del callback de progreso.

---

### 3. `likes_count` en Reflections — Schema Mismatch

**Error**: Silencioso (no aparece en logs de Next.js pero la acción falla).  
**Causa**: `resonarReflection()` en `taberna/actions.ts` lee y actualiza `likes_count` pero este campo **no existe en el schema canónico** (`scripts/004_unify_schema.sql`).

**Fix**: Añadir `likes_count INTEGER DEFAULT 0` a la tabla `reflections` en Supabase.

---

### 4. `params` no awaited en admin routes — Next.js 15

**Error**: `Route "/api/admin/lessons/[id]" used params.id. params should be awaited`  
**Causa**: Next.js 15 requiere `await params` antes de usar sus propiedades.  
**Impacto**: Solo afecta al admin (no es prioridad ahora pero hay que corregirlo).

---

### 5. Thumbnail upload — Supabase bucket missing

**Error**: `Error al subir imagen a public_assets: Bucket not found`  
**Causa**: El bucket `public_assets` no ha sido creado en el proyecto Supabase.  
**Impacto**: Solo afecta al admin (no es prioridad ahora).

---

## ⚠️ Lo que está INCOMPLETO

| Sección | Estado | Notas |
|---------|--------|-------|
| Videos en lecciones | Sin contenido | Bloqueado por credenciales Cloudflare / sin URLs cargadas |
| Mentoría - booking | UI sin backend | Botón "Solicitar sesión" no hace nada |
| Quest - más misiones | Solo 3 hardcoded | No conectado a tablas de DB |
| Sidebar XP | No se actualiza sin refresh | Tras completar lección, el sidebar sigue mostrando XP viejo |
| Thumbnails de formaciones | Sin imágenes en mayoría | Bucket Supabase no creado |
| VideoPlayer - calidad | Básico | Sin controles de velocidad, calidad, subtítulos |
| Perfil - avatar upload | Sin implementar | Campo existe pero sin UI de subida |
| Notificaciones in-app | Sin implementar | Solo toasts, sin campana / historial |
| Email de bienvenida | Sin implementar | Sin trigger en Supabase |

---

## 🏗️ Plan de Implementación — Paso a Paso

> **Regla**: resolver bugs primero, luego completar features. Sin deuda técnica nueva.

---

### FASE A — Desbloquear Videos (Prioridad máxima, ~3h)

**El objetivo**: que el usuario pueda ver contenido de video en las lecciones HOY.

#### A1. Soporte multi-fuente en VideoPlayer

Modificar `components/video/video-player.tsx` para detectar el tipo de URL y renderizar el player correcto:

```
- URL contiene "youtube.com" o "youtu.be" → <iframe> YouTube embed
- URL contiene "vimeo.com" → <iframe> Vimeo embed  
- URL contiene "cloudflarestream.com" o "videodelivery.net" → player actual
- Cualquier .mp4 / .webm / .m3u8 → <video> HTML nativo
```

Esto permite al admin pegar **cualquier URL** en el campo `video_url` de la lección y que funcione sin backend adicional.

**Archivos a modificar**:
- `components/video/video-player.tsx` — lógica de detección + renders

---

#### A2. Cargar videos vía YouTube (inmediato, sin código)

Mientras se resuelve Cloudflare Stream:
1. Subir los videos de las formaciones a YouTube como **No listado** (unlisted)
2. En el admin (`/admin/content/lessons/[id]`), pegar la URL de YouTube en el campo `video_url`
3. Con el fix de A1, el visor los reproduce automáticamente

Esto **no requiere código nuevo** después de A1. Es operacional.

---

#### A3. Fix Cloudflare Stream credentials (si se quiere upload directo)

En el [dashboard de Cloudflare](https://dash.cloudflare.com/):
1. Ir a My Profile → API Tokens → Create Token
2. Usar template "Edit Cloudflare Stream" o crear custom con permisos:
   - `Stream:Edit` (read + write)
   - Scope: tu account ID
3. Copiar el token y actualizar `.env.local`:
   ```
   CLOUDFLARE_API_TOKEN=tu_nuevo_token_aqui
   ```
4. Reiniciar dev server

---

### FASE B — Bugs críticos de estabilidad (~2h)

#### B1. Fix api/progress 500 — Upsert atómico

**Problema**: condición de carrera entre requests concurrentes.

**Solución**: reemplazar el flujo check-then-insert/update por un `upsert` atómico de Supabase.

```typescript
// app/api/progress/route.ts — reemplazar toda la lógica POST por:
const upsertData: any = {
  user_id: user.id,
  lesson_id: lessonId,
}

if (typeof watchedSeconds === "number") {
  // Supabase no soporta MAX en upsert directo, usar RPC o lógica en JS
  upsertData.watched_seconds = watchedSeconds
}
if (isCompleted) {
  upsertData.is_completed = true
  upsertData.completed_at = now
  upsertData.status = "completed"
}

const { data, error } = await supabase
  .from("user_progress")
  .upsert(upsertData, { onConflict: "user_id,lesson_id" })
  .select()
  .single()
```

Además: en `lesson-viewer.tsx`, añadir **debounce de 2 segundos** al callback `onProgress` para no disparar 20 requests por segundo.

**Archivos a modificar**:
- `app/api/progress/route.ts`
- `app/(platform)/learn/[slug]/[lessonId]/lesson-viewer.tsx` — debounce en `saveProgress`

---

#### B2. Fix likes_count en Reflections

**En Supabase SQL Editor**, ejecutar:
```sql
ALTER TABLE reflections ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;
```

Este único cambio arregla el error silencioso en el botón de Resonar.

---

#### B3. Fix sidebar XP tras completar lección

**Problema**: al completar una lección, el toast muestra el XP ganado pero la sidebar sigue mostrando el XP viejo hasta que el usuario refresca.

**Solución**: en `lesson-viewer.tsx`, después del toast de lección completada, llamar a `router.refresh()` para que el Server Component del layout refetch el perfil con el XP actualizado.

```typescript
// En handleMarkComplete, después del toast:
toast.success(`¡Lección completada! +${result.xpEarned} XP`)
router.refresh() // ← añadir esto
```

**Archivos a modificar**:
- `app/(platform)/learn/[slug]/[lessonId]/lesson-viewer.tsx`

---

### FASE C — Solidez y UX completa (~3h)

#### C1. Validación de enrollment en progreso API

El `POST /api/progress` actualmente no verifica si el usuario está inscrito en la formación antes de guardar progreso. Un usuario podría hacer una llamada directa a la API.

**Fix**: añadir verificación de enrollment en la route de progreso.

```typescript
// En app/api/progress/route.ts antes de insertar:
const lessonWithFormation = await supabase
  .from("lessons")
  .select("module:modules(formation_id)")
  .eq("id", lessonId)
  .single()

const formationId = lessonWithFormation.data?.module?.formation_id
if (formationId) {
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", user.id)
    .eq("formation_id", formationId)
    .single()
  if (!enrollment) {
    return NextResponse.json({ error: "Not enrolled" }, { status: 403 })
  }
}
```

---

#### C2. VideoPlayer con debounce y controles mejorados

En `components/video/video-player.tsx`:
- Añadir debounce de 2s al callback de progreso (resuelve 500s junto con B1)
- Guardar posición al unmount del componente (para continuar donde se dejó)
- Controles: velocidad de reproducción (0.75x, 1x, 1.25x, 1.5x, 2x)

---

#### C3. Perfil — Avatar upload

Crear el flujo de subida de avatar:
1. Crear bucket `avatars` en Supabase Storage (público)
2. Añadir `<input type="file">` en `profile-form.tsx`
3. Subir a Supabase Storage, guardar URL en `profiles.avatar_url`
4. El sidebar ya usa `user.avatarUrl` → se actualiza automáticamente

**Archivos a modificar/crear**:
- `app/(platform)/profile/profile-form.tsx` — UI de upload
- `app/(platform)/profile/actions.ts` — acción de upload
- Supabase: crear bucket `avatars`

---

#### C4. Mentoría — Booking básico

Reemplazar el botón "Solicitar sesión" por un formulario simple:
- Input: nombre, email, mensaje
- Server action que inserta en tabla `mentorship_requests`
- Toast de confirmación

Crear tabla en Supabase:
```sql
CREATE TABLE mentorship_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  mentor_id UUID REFERENCES profiles(id),
  message TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

#### C5. Quest — Misiones desde DB

Actualmente las misiones están hardcoded. Para hacerlas dinámicas:
- Crear tabla `quests` en Supabase con tipo (`first_lesson`, `first_reflection`, etc.)
- La función `getQuestData` ya devuelve `hasCompletedLesson` y `hasReflection`
- El page component solo necesita leer desde DB en vez de array hardcoded

Esto es un refactor limpio de `app/(platform)/quest/page.tsx`.

---

### FASE D — Admin operativo para carga de contenido (~2h)

> Aunque el admin no es la prioridad para usuarios, **SÍ** es necesario para cargar las formaciones, módulos y lecciones. Sin admin funcional no hay contenido.

#### D1. Fix params await en api/admin routes

Todos los route handlers en `app/api/admin/` que usan `params.id` deben awaitar `params`:

```typescript
// Antes:
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { id } = params

// Después (Next.js 15):
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
```

**Archivos a modificar**:
- `app/api/admin/lessons/[id]/route.ts`
- Cualquier otro route en `app/api/admin/` que use params

---

#### D2. Crear bucket Supabase para thumbnails

En el dashboard de Supabase → Storage:
1. Crear bucket `public_assets` (público)
2. O renombrar la referencia en el código a un bucket existente

```typescript
// lib/services/storageService.ts — cambiar el bucket name si ya existe otro
const bucket = "public_assets" // asegurar que este existe en Supabase
```

---

#### D3. Flujo completo de creación de lección con video

Asegurar que el admin puede:
1. Crear formación → pegar thumbnail URL o subir imagen
2. Crear módulo dentro de la formación
3. Crear lección → pegar URL de YouTube/Vimeo en `video_url`
4. Publicar la formación (`is_published: true`)
5. El usuario ve la formación en la library y puede inscribirse

---

### FASE E — Pre-producción (~2h)

#### E1. Variables de entorno para producción

Crear `.env.production` con todas las variables necesarias:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_API_TOKEN
CLOUDFLARE_STREAM_SIGNING_KEY
CLOUDFLARE_STREAM_KEY_ID
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
```

Verificar que **ninguna** variable empieza con `NEXT_PUBLIC_` si contiene secretos.

---

#### E2. RLS Policies en Supabase

Verificar que todas las tablas tienen Row Level Security activado y políticas correctas:

```sql
-- Ejemplo de política segura para user_progress:
CREATE POLICY "users can manage own progress"
ON user_progress
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Los usuarios solo ven formaciones publicadas:
CREATE POLICY "published formations are public"
ON formations FOR SELECT
USING (is_published = true);
```

---

#### E3. Error monitoring básico

Añadir Sentry o similar para capturar errores de producción en tiempo real:
```bash
npm install @sentry/nextjs
```

Configurar en `sentry.server.config.ts` y `sentry.client.config.ts`.

Alternativa gratuita: Vercel Analytics (si se despliega en Vercel) — cero configuración.

---

#### E4. Optimización de imágenes

Asegurar que todas las imágenes usan el componente `<Image>` de Next.js:
- `app/(platform)/library/library-content.tsx` — thumbnails de formaciones
- `app/(platform)/formations/[slug]/formation-detail.tsx` — thumbnail principal

Añadir en `next.config.js`:
```javascript
images: {
  remotePatterns: [
    { protocol: "https", hostname: "*.supabase.co" },
    { protocol: "https", hostname: "*.cloudflarestream.com" },
    { protocol: "https", hostname: "img.youtube.com" },
  ]
}
```

---

## Orden de ejecución recomendado

```
A1 → A2 → B1 → B2 → B3 → D1 → D2 → D3 → A3 (opcional) → C2 → C3 → C1 → C4 → E1 → E2 → E3
```

En palabras:
1. **Hoy**: Soporte multi-fuente en VideoPlayer (A1) + cargar videos a YouTube (A2) → usuarios ya pueden ver contenido
2. **Mañana**: Fix api/progress 500 (B1) + fix likes_count (B2) + refresh XP sidebar (B3) → plataforma estable
3. **Esta semana**: Admin funcional (D1-D3) para cargar el resto del contenido
4. **Antes de lanzar**: RLS policies (E2) + variables de entorno (E1) + monitoring (E3)

---

## Checklist de lanzamiento

- [ ] Al menos 1 formación publicada con módulos y lecciones con video
- [ ] Videos reproduciendo correctamente en `/learn/[slug]/[lessonId]`
- [ ] Inscripción funcionando (toast de éxito)
- [ ] Progreso guardándose sin errores 500
- [ ] Lección completable con toast de XP
- [ ] Sidebar XP actualiza tras completar lección
- [ ] La Taberna: publicar + resonar sin errores
- [ ] Quest: misiones actualizando correctamente
- [ ] Perfil editable
- [ ] RLS policies activadas en todas las tablas
- [ ] `.env` de producción configurado correctamente
- [ ] Dominio propio configurado en Vercel/hosting
- [ ] Error monitoring activo
