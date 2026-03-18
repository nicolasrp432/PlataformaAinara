# Leader Blueprint - Plataforma de Micro-Learning Premium

## Descripción General
Plataforma de formación y desarrollo personal con arquitectura de micro-learning, gamificación ética, y mentoría personalizada. Diseñada siguiendo principios de LX Design y carga cognitiva optimizada.

## URLs

### Producción (pendiente de deploy)
- **Cloudflare Pages**: *Por configurar*
- **GitHub**: https://github.com/nicolasrp432/PlataformaAinara

### Desarrollo (Sandbox)
- **URL Base**: https://3000-{sandbox-id}.sandbox.novita.ai
- **Health Check**: `/api/health`

## Usuarios de Prueba

| Usuario | Email | Contraseña | Rol | Acceso |
|---------|-------|------------|-----|--------|
| Admin | admin@leaderblueprint.com | Admin123! | admin | Elite |
| Usuario Demo | demo@leaderblueprint.com | User1234! | user | Free |
| Usuario Premium | premium@leaderblueprint.com | User1234! | user | Premium |

### 🔑 Cómo acceder sin desarrollar la verificación de correo (Supabase)

Puesto que el proyecto usa **Supabase Auth** para la autenticación, los registros de nuevos usuarios requieren por defecto confirmación por correo electrónico. Como aún no tienes desarrollada esa pantalla o flujo web, tienes dos formas sencillas de acceder inmediatamente:

**Opción 1: Crear el usuario manualmente en el Panel de Supabase (Recomendado)**
1. Entra a tu proyecto en Supabase (https://supabase.com/dashboard/project/_/auth/users).
2. Ve a la sección **Authentication** > **Users**.
3. Haz clic en **Add user** > **Create new user**.
4. Introduce el correo (ej. `admin@leaderblueprint.com`) y la contraseña (ej. `Admin123!`). 
   *(Al crear el usuario por esta vía desde el panel, su correo se auto-verifica automáticamente y podrás hacer Login en la plataforma inmediatamente).*

**Opción 2: Desactivar temporalmente la verificación de correos**
1. En Supabase, ve a **Authentication** > **Providers** > **Email**.
2. Apaga la opción **"Confirm email"** y dale a Guardar.
3. Ahora cualquier persona que se registre en la página de tu plataforma entrará directamente sin necesidad de validar correos.

## Arquitectura del Sistema

### Stack Tecnológico
- **Frontend & Backend**: Next.js 15 (App Router) + TypeScript
- **Base de Datos**: Supabase (PostgreSQL)
- **Estilos**: Tailwind CSS + Shadcn UI
- **Autenticación**: Supabase Auth

### Estructura del Proyecto
```
webapp/
├── src/
│   ├── index.tsx          # Punto de entrada y rutas principales
│   ├── renderer.tsx       # Template HTML base con estilos globales
│   ├── api/               # APIs REST
│   │   ├── auth.ts        # Autenticación (login, register, logout)
│   │   ├── users.ts       # Gestión de usuarios y perfiles
│   │   ├── content.ts     # Formaciones, módulos, lecciones
│   │   ├── mentorship.ts  # Sistema de mentoría
│   │   └── reflections.ts # Reflexiones y comunidad
│   ├── lib/
│   │   └── auth.ts        # Utilidades de autenticación y JWT
│   ├── middleware/
│   │   └── auth.ts        # Middleware de autenticación
│   ├── pages/             # Componentes de página
│   │   ├── Dashboard.tsx  # Panel principal
│   │   ├── Quest.tsx      # Reproductor de micro-learning
│   │   ├── Taberna.tsx    # Comunidad y reflexiones
│   │   ├── Library.tsx    # Biblioteca de formaciones
│   │   ├── Profile.tsx    # Perfil de usuario
│   │   └── Mentorship.tsx # Sistema de mentoría
│   ├── components/
│   │   └── Header.tsx     # Cabecera con navegación
│   └── types/
│       └── index.ts       # Tipos TypeScript
├── migrations/
│   ├── 0001_initial_schema.sql  # Esquema de base de datos
│   └── 0002_seed_data.sql       # Datos iniciales
├── wrangler.jsonc         # Configuración de Cloudflare
├── ecosystem.config.cjs   # Configuración de PM2
└── package.json           # Dependencias y scripts
```

## Páginas y Funcionalidades

### 1. Dashboard (`/`)
- Métricas de racha (días consecutivos)
- Nivel y XP cognitivo con barra de progreso
- Módulo recomendado (hero card)
- Grid de próximos insights
- Acceso rápido a La Taberna
- Widget de introspección diaria
- Información del mentor

### 2. Reproductor Micro-Learning (`/quest/:id`)
- Video player premium con controles personalizados
- Barra de progreso de la quest
- **Suite de Transformación**:
  - Alineación de Frecuencia 432Hz con visualizador
  - Herramienta del Crítico Interior
- Lista de lecciones con estados (completado, en progreso, bloqueado)
- Aide-Mémoire (checklist, resumen, descargas)

### 3. La Taberna - Comunidad (`/taberna`)
- Feed de reflexiones públicas
- Composer para compartir momentos
- Tabs: Todas, Mi Viaje, Resonados
- Sala de Meditación (participantes activos)
- Compañeros de Viaje (usuarios online)
- Badge de Espacio Seguro Certificado

### 4. Biblioteca (`/library`)
- Grid de formaciones (Quests)
- Filtros por categoría
- Estados: Completado, En Progreso, Nuevo
- Estadísticas de progreso

### 5. Perfil de Usuario (`/profile`)
- Edición de nombre y avatar
- Estadísticas: racha, XP, lecciones, reflexiones
- Cambio de contraseña
- Estado de acceso (Free/Premium)
- Actividad reciente
- Nivel y progreso a siguiente nivel
- Próximas sesiones de mentoría
- Cierre de sesión

### 6. Mentoría (`/mentorship`)
- Perfil de la mentora (Ainara Sterling)
- Especialidades y bio
- Calendario de disponibilidad interactivo
- Selección de fecha y hora
- Notas para la sesión
- Reserva de sesiones (requiere autenticación)
- Historial de sesiones (próximas y pasadas)
- Cancelación de sesiones
- Testimonios de alumnos

### 7. Autenticación
- Login (`/login`)
- Registro (`/register`)
- Validación de contraseñas (8+ caracteres, mayúscula, minúscula, número)

## API Endpoints

### Autenticación
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Registro de usuario | No |
| POST | `/api/auth/login` | Inicio de sesión | No |
| POST | `/api/auth/refresh` | Refrescar token | No |
| POST | `/api/auth/logout` | Cerrar sesión | Sí |
| GET | `/api/auth/me` | Usuario actual | Sí |

### Usuarios
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/users/profile` | Perfil completo | Sí |
| PUT | `/api/users/profile` | Actualizar perfil | Sí |
| PUT | `/api/users/password` | Cambiar contraseña | Sí |
| GET | `/api/users/progress` | Progreso detallado | Sí |
| GET | `/api/users/activity` | Historial de actividad | Sí |
| GET | `/api/users` | Listar usuarios (admin) | Admin |
| PUT | `/api/users/:id/access` | Gestionar acceso (admin) | Admin |

### Contenido
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/content/formations` | Listar formaciones | Opcional |
| GET | `/api/content/formations/:slug` | Detalle de formación | Opcional |
| GET | `/api/content/lessons/:id` | Detalle de lección | Sí |
| POST | `/api/content/lessons/:id/progress` | Actualizar progreso | Sí |
| POST | `/api/content/formations` | Crear formación (admin) | Admin |
| PUT | `/api/content/formations/:id` | Editar formación (admin) | Admin |
| POST | `/api/content/modules` | Crear módulo (admin) | Admin |
| POST | `/api/content/lessons` | Crear lección (admin) | Admin |

### Mentoría
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/mentorship/mentors` | Listar mentores | Opcional |
| GET | `/api/mentorship/mentors/:id` | Detalle de mentor | Opcional |
| GET | `/api/mentorship/mentors/:id/availability` | Disponibilidad | No |
| POST | `/api/mentorship/sessions` | Reservar sesión | Sí |
| GET | `/api/mentorship/sessions` | Mis sesiones | Sí |
| PUT | `/api/mentorship/sessions/:id/cancel` | Cancelar sesión | Sí |
| PUT | `/api/mentorship/sessions/:id/confirm` | Confirmar (admin) | Admin |
| POST | `/api/mentorship/mentors/:id/block` | Bloquear fecha (admin) | Admin |

### Reflexiones
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/reflections` | Listar reflexiones | Sí |
| GET | `/api/reflections/mine` | Mis reflexiones | Sí |
| POST | `/api/reflections` | Crear reflexión | Sí |
| PUT | `/api/reflections/:id` | Editar reflexión | Sí |
| DELETE | `/api/reflections/:id` | Eliminar reflexión | Sí |
| POST | `/api/reflections/:id/react` | Reaccionar | Sí |

### Utilidades
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/health` | Estado del sistema | No |

## Modelos de Datos

### Users
- id, email, password_hash, name, avatar_url
- role: user | admin | mentor
- status: active | inactive | suspended

### User Access
- access_type: free | paid | manual | trial
- starts_at, expires_at
- access_granted_by, access_reason

### Formations → Modules → Lessons
- Estructura jerárquica de contenido
- content_type: video | audio | text | quiz | exercise
- is_free_preview para contenido de muestra

### User Progress
- status: not_started | in_progress | completed
- progress_percent, last_position_seconds

### User Streaks
- current_streak, longest_streak
- total_xp, level

### Mentorship Sessions
- status: pending | confirmed | completed | cancelled | no_show
- meeting_link, notes, user_notes

### Reflections
- content, is_public
- Reactions: resonate | support

## Scripts de Desarrollo

```bash
# Desarrollo local
npm run build              # Compilar con Vite
pm2 start ecosystem.config.cjs  # Iniciar con PM2

# Base de datos
npm run db:migrate:local   # Aplicar migraciones (local)
npm run db:seed            # Cargar datos iniciales
npm run db:reset           # Reset completo de BD

# Despliegue
npm run deploy             # Deploy a Cloudflare Pages
npm run deploy:prod        # Deploy a producción
```

## Principios de Diseño

### Diseño Instruccional
- **Micro-módulos**: 5-15 minutos por lección
- **Carga cognitiva**: Regla de los 3 segundos en Dashboard
- **Modelo ADDIE**: Análisis → Diseño → Desarrollo → Implementación → Evaluación

### LX Design
- Formación de hábitos (66 días promedio)
- Fases: Iniciación → Aprendizaje → Estabilidad
- Gamificación compasiva (XP sin competencia)

### UI/UX
- Patrón de lectura en F
- Divulgación progresiva
- Mobile-first
- Tipografías terapéuticas (Playfair Display + Manrope)
- Paleta: Dorado #C5A059, Charcoal #2D2D2D, Ivory #FDFCFB

## Seguridad

- Autenticación JWT con refresh tokens
- Hashing SHA-256 para contraseñas
- Middleware de autorización por roles
- Validación de entradas
- CORS configurado

## Próximas Mejoras

- [ ] Sistema de pagos (Paddle/Lemon Squeezy)
- [ ] Integración de calendario externo
- [ ] Notificaciones push
- [ ] Meditaciones con audio real
- [ ] Analytics de comportamiento
- [ ] Panel de administración completo

## Estado del Proyecto

- **Plataforma**: ✅ Activa (desarrollo)
- **Frontend**: ✅ Completo
- **Backend API**: ✅ Completo
- **Base de Datos**: ✅ Configurada con D1
- **Autenticación**: ✅ JWT implementado
- **Deploy Cloudflare**: ⏳ Pendiente

---

**Tech Stack**: Hono + TypeScript + Cloudflare Workers/D1 + Tailwind CSS
**Última actualización**: 2026-01-16
