# Schema Audit — 2026-05-06

---

## 1. Schema declarado en SQL

### Estructura de archivos encontrada

**`scripts/`** — Schema de producción para Supabase (PostgreSQL):
- `001_create_profiles.sql` — Tabla `profiles` + RLS
- `002_profile_trigger.sql` — Trigger auto-create profile en signup
- `003a_create_tables.sql` — Tablas: `categories`, `formations`, `modules`, `lessons`, `user_progress`, `enrollments`
- `003b_enable_rls.sql` — Políticas RLS para todas las tablas
- `003c_indexes_triggers.sql` — Índices y triggers `updated_at`

**`migrations/`** — Schema alternativo en formato SQLite (NO es Supabase):
- `0001_initial_schema.sql` — Schema SQLite con `TEXT` PKs y `DATETIME`
- `0002_seed_data.sql` — Datos de ejemplo para SQLite

**`seed.sql`** (raíz) — Script híbrido: crea tablas IF NOT EXISTS + ALTER TABLE para añadir columnas a una base existente. **Es la fuente más reciente de verdad sobre qué columnas se añadieron post-creación.**

> ⚠️ Existen DOS sistemas de schema paralelos: el de `scripts/` (PostgreSQL/Supabase, el canónico) y el de `migrations/` (SQLite, probablemente obsoleto). Las columnas divergen en tipo y nombre.

---

### Tabla `profiles`

**Fuente: `scripts/001_create_profiles.sql`** (schema canónico)

| Columna | Tipo | Default | Nullable |
|---|---|---|---|
| id | UUID | — | NO (PK, REFERENCES auth.users) |
| full_name | TEXT | NULL | YES |
| avatar_url | TEXT | NULL | YES |
| role | TEXT | `'student'` | NO (CHECK: 'student', 'mentor', 'admin') |
| level | INTEGER | 1 | NO |
| xp | INTEGER | 0 | NO |
| streak_days | INTEGER | 0 | NO |
| last_activity_at | TIMESTAMPTZ | NOW() | NO |
| bio | TEXT | NULL | YES |
| spiritual_path | TEXT | NULL | YES |
| interests | TEXT[] | NULL | YES |
| created_at | TIMESTAMPTZ | NOW() | NO |
| updated_at | TIMESTAMPTZ | NOW() | NO |

**Fuente: `seed.sql`** (crea la tabla o añade columnas si no existen — definición alternativa):

| Columna | Tipo | Default | Nota |
|---|---|---|---|
| id | UUID | — | PK |
| full_name | TEXT | NULL | |
| avatar_url | TEXT | NULL | |
| role | TEXT | `'user'` | ⚠️ DEFAULT distinto: 'user' vs 'student' |
| level | INTEGER | 1 | Añadida via ALTER si no existe |
| xp | INTEGER | 0 | Añadida via ALTER si no existe |
| streak_days | INTEGER | 0 | Añadida via ALTER si no existe |
| **last_activity_date** | TIMESTAMPTZ | NOW() | ⚠️ Nombre DISTINTO: `last_activity_date` vs `last_activity_at` |
| created_at | TIMESTAMPTZ | NOW() | |

**Columnas en `scripts/001` que NO están en `seed.sql`**: `bio`, `spiritual_path`, `interests`, `updated_at`.

---

### Tabla `formations`

**Fuente: `scripts/003a_create_tables.sql`** (schema canónico)

| Columna | Tipo | Default | Nullable |
|---|---|---|---|
| id | UUID | gen_random_uuid() | NO (PK) |
| title | TEXT | — | NO |
| slug | TEXT | — | NO (UNIQUE) |
| description | TEXT | NULL | YES |
| long_description | TEXT | NULL | YES |
| thumbnail_url | TEXT | NULL | YES |
| trailer_url | TEXT | NULL | YES |
| category_id | UUID | NULL | YES (FK → categories) |
| difficulty | TEXT | `'beginner'` | NO (CHECK: beginner/intermediate/advanced) |
| **duration_hours** | INTEGER | 0 | NO |
| is_published | BOOLEAN | false | NO |
| is_featured | BOOLEAN | false | NO |
| is_premium | BOOLEAN | true | NO |
| price | DECIMAL(10,2) | 0 | NO |
| xp_reward | INTEGER | 100 | NO |
| order_index | INTEGER | 0 | NO |
| created_by | UUID | NULL | YES (FK → profiles) |
| created_at | TIMESTAMPTZ | NOW() | NO |
| updated_at | TIMESTAMPTZ | NOW() | NO |

**Fuente: `seed.sql`** (tabla alternativa / columnas añadidas):

| Columna | Tipo | Default | Nota |
|---|---|---|---|
| **duration_minutes** | INTEGER | 0 | ⚠️ Nombre DISTINTO: `duration_minutes` vs `duration_hours` |
| xp_reward | INTEGER | 500 | ⚠️ DEFAULT distinto: 500 vs 100 |
| is_premium | BOOLEAN | false | ⚠️ DEFAULT distinto: false vs true |

**Columnas en `seed.sql` que NO están en `scripts/003a`**: `duration_minutes`, `slug` UNIQUE en schema propio.  
**Columnas en `scripts/003a` que NO están en `seed.sql`**: `long_description`, `trailer_url`, `category_id`, `is_featured`, `price`, `order_index`, `created_by`.

---

### Tabla `modules`

**Fuente: `scripts/003a_create_tables.sql`**

| Columna | Tipo | Default | Nullable |
|---|---|---|---|
| id | UUID | gen_random_uuid() | NO (PK) |
| formation_id | UUID | — | NO (FK → formations) |
| title | TEXT | — | NO |
| description | TEXT | NULL | YES |
| order_index | INTEGER | 0 | NO |
| is_published | BOOLEAN | false | NO |
| xp_reward | INTEGER | 50 | NO |
| created_at | TIMESTAMPTZ | NOW() | NO |
| updated_at | TIMESTAMPTZ | NOW() | NO |

**Fuente: `seed.sql`** (schema alternativo):

| Columna | Tipo | Default | Nota |
|---|---|---|---|
| slug | TEXT | NULL | UNIQUE — columna extra no en `scripts/` |
| **sort_order** | INTEGER | 0 | ⚠️ Nombre DISTINTO: `sort_order` vs `order_index` |
| is_published | BOOLEAN | true | ⚠️ DEFAULT distinto: true vs false |

**Columnas en `seed.sql` que NO están en `scripts/003a`**: `slug`, `sort_order`.  
**Columnas en `scripts/003a` que NO están en `seed.sql`**: `order_index`, `xp_reward`, `updated_at`.

---

### Tabla `lessons`

**Fuente: `scripts/003a_create_tables.sql`**

| Columna | Tipo | Default | Nullable |
|---|---|---|---|
| id | UUID | gen_random_uuid() | NO (PK) |
| module_id | UUID | — | NO (FK → modules) |
| title | TEXT | — | NO |
| description | TEXT | NULL | YES |
| content | TEXT | NULL | YES |
| video_url | TEXT | NULL | YES |
| video_id | TEXT | NULL | YES |
| **video_duration** | INTEGER | 0 | NO |
| thumbnail_url | TEXT | NULL | YES |
| **lesson_type** | TEXT | `'video'` | NO (CHECK: video/text/quiz/exercise/meditation) |
| **order_index** | INTEGER | 0 | NO |
| is_published | BOOLEAN | false | NO |
| **is_preview** | BOOLEAN | false | NO |
| xp_reward | INTEGER | 25 | NO |
| created_at | TIMESTAMPTZ | NOW() | NO |
| updated_at | TIMESTAMPTZ | NOW() | NO |

**Fuente: `seed.sql`** (schema alternativo + columnas añadidas via ALTER):

| Columna | Tipo | Default | Nota |
|---|---|---|---|
| slug | TEXT | NULL | UNIQUE — no está en `scripts/` |
| video_url | TEXT | NULL | Añadida via ALTER si no existe |
| **duration_seconds** | INTEGER | 0 | ⚠️ Nombre DISTINTO: `duration_seconds` vs `video_duration` |
| **is_free** | BOOLEAN | false | ⚠️ Nombre DISTINTO: `is_free` vs `is_preview` |
| is_published | BOOLEAN | true | ⚠️ DEFAULT distinto: true vs false |
| **sort_order** | INTEGER | 0 | ⚠️ Nombre DISTINTO: `sort_order` vs `order_index` |
| xp_reward | INTEGER | 50 | Añadida via ALTER |
| resources | JSONB | `'[]'` | Añadida via ALTER — no en `scripts/` |

**Columnas en `migrations/0001` (SQLite, referencia)**:

| Columna | Nota |
|---|---|
| video_duration_seconds | Tercer nombre para duración de video |
| content_type | Cuarto nombre para tipo de contenido |
| is_free_preview | Tercer nombre para lección gratuita |

---

### Tabla `user_progress`

**Fuente: `scripts/003a_create_tables.sql`**

| Columna | Tipo | Default | Nullable |
|---|---|---|---|
| id | UUID | gen_random_uuid() | NO (PK) |
| user_id | UUID | — | NO (FK → profiles) |
| lesson_id | UUID | — | NO (FK → lessons) |
| formation_id | UUID | — | NO (FK → formations) |
| progress_percent | INTEGER | 0 | NO |
| is_completed | BOOLEAN | false | NO |
| completed_at | TIMESTAMPTZ | NULL | YES |
| last_position | INTEGER | 0 | NO |
| created_at | TIMESTAMPTZ | NOW() | NO |
| updated_at | TIMESTAMPTZ | NOW() | NO |
| UNIQUE(user_id, lesson_id) | — | — | — |

**Columnas añadidas via ALTER en `seed.sql`**:

| Columna | Tipo | Default |
|---|---|---|
| watched_seconds | INTEGER | 0 |
| status | TEXT | `'not_started'` |

**Columnas en `scripts/003a` que NO están en `seed.sql` base**: `formation_id`, `last_position`.  
**Columnas usadas en código que no están en `scripts/003a`**: `watched_seconds`, `status`, `started_at`.

---

### Tabla `enrollments`

**Fuente: `scripts/003a_create_tables.sql`**

| Columna | Tipo | Default | Nullable |
|---|---|---|---|
| id | UUID | gen_random_uuid() | NO (PK) |
| user_id | UUID | — | NO (FK → profiles) |
| formation_id | UUID | — | NO (FK → formations) |
| enrolled_at | TIMESTAMPTZ | NOW() | NO |
| completed_at | TIMESTAMPTZ | NULL | YES |
| progress_percent | INTEGER | 0 | NO |
| UNIQUE(user_id, formation_id) | — | — | — |

> ⚠️ `enrollments` NO tiene columna `status` en `scripts/003a`. El código en `app/api/enroll/route.ts` intenta escribir `status` (línea 56). Esto falla en runtime.

---

### Tabla `reflections`

**Fuente: `seed.sql`** (no aparece en `scripts/`)

| Columna | Tipo | Default | Nullable |
|---|---|---|---|
| id | UUID | uuid_generate_v4() | NO (PK) |
| user_id | UUID | — | NO (FK → profiles) |
| lesson_id | UUID | NULL | YES (FK → lessons; NULL = post de Taberna) |
| content | TEXT | — | NO |
| is_public | BOOLEAN | true | NO |
| likes_count | INTEGER | 0 | NO |
| created_at | TIMESTAMPTZ | NOW() | NO |

> `reflections` NO aparece en ningún archivo de `scripts/`. Solo existe en `seed.sql` y `migrations/0001_initial_schema.sql` (SQLite).

---

### Tabla `mentors`

**Fuente: `migrations/0001_initial_schema.sql`** (SQLite — NO está en `scripts/`)

| Columna | Tipo | Default | Nullable |
|---|---|---|---|
| id | TEXT | — | NO (PK) |
| user_id | TEXT | NULL | YES |
| name | TEXT | — | NO |
| title | TEXT | NULL | YES |
| bio | TEXT | NULL | YES |
| avatar_url | TEXT | NULL | YES |
| specialties | TEXT | NULL | YES (JSON array serializado) |
| session_price | REAL | NULL | YES |
| session_duration_minutes | INTEGER | 60 | NO |
| calendar_link | TEXT | NULL | YES |
| is_active | INTEGER | 1 | NO |
| created_at | DATETIME | CURRENT_TIMESTAMP | NO |
| updated_at | DATETIME | CURRENT_TIMESTAMP | NO |

> `mentors` solo existe en el schema SQLite. No hay equivalente PostgreSQL en `scripts/`. El código no hace referencia a esta tabla actualmente.

---

### Tabla `categories`

**Fuente: `scripts/003a_create_tables.sql`**

| Columna | Tipo | Default | Nullable |
|---|---|---|---|
| id | UUID | gen_random_uuid() | NO (PK) |
| name | TEXT | — | NO |
| slug | TEXT | — | NO (UNIQUE) |
| description | TEXT | NULL | YES |
| icon | TEXT | NULL | YES |
| color | TEXT | NULL | YES |
| created_at | TIMESTAMPTZ | NOW() | NO |

> `categories` no aparece en `seed.sql`. No tiene columna `updated_at`.

---

## 2. Schema esperado por el código

### Tabla `formations`

| Columna | Usos | Archivos | Tipo de uso |
|---|---|---|---|
| `duration_hours` | 6 | `app/(admin)/admin/content/formations/[id]/client-page.tsx` (L48, L120, L483, L485), `app/(admin)/admin/content/formations/client-page.tsx` (L53, L259), `lib/validations/content.ts` (L12) | Lectura + escritura en admin; validación Zod |
| `duration_minutes` | 3 | `migrations/0002_seed_data.sql`, `lib/data-access.ts` (L260), `seed.sql`, `types/index.ts` (L80) | Lectura en data-access; declarado en tipo Formation |
| `difficulty` | 5 | `lib/data-access.ts` (L259), `lib/validations/content.ts` (L11), `types/index.ts`, `scripts/003a_create_tables.sql` | Lectura + validación |
| `is_published` | 4 | `lib/data-access.ts` (L195), `app/api/enroll/route.ts` (L23, L31) | Lectura |
| `is_premium` | 3 | `app/api/enroll/route.ts` (L23), `lib/data-access.ts`, `lib/validations/content.ts` (L15) | Lectura + validación |
| `is_featured` | 1 | `lib/validations/content.ts` (L14) | Solo validación |
| `xp_reward` | 3 | `lib/validations/content.ts` (L17), `types/index.ts`, `seed.sql` | Validación + tipo |
| `order_index` | 2 | `lib/validations/content.ts` (L18), `lib/services/formationService.ts` | Validación |
| `sort_order` | 4 | `lib/data-access.ts` (L196, L330, L335), `types/index.ts` (L83) | Lectura; declarado en tipo Formation |
| `thumbnail_url` | 3 | `lib/data-access.ts` (L89), `app/(platform)/formations/[slug]/formation-detail.tsx` | Lectura |
| `long_description` | 1 | `lib/validations/content.ts` (L7) | Solo validación |
| `price` | 1 | `lib/validations/content.ts` (L16) | Solo validación |
| `category` / `category_id` | 0 | No encontrado en código de app/ | — |
| `estimated_duration` | 0 | No encontrado | — |

### Tabla `lessons`

| Columna | Usos | Archivos | Tipo de uso |
|---|---|---|---|
| `video_duration` | 8 | `app/(admin)/admin/content/modules/page.tsx` (L37, L71, L72, L85, L315, L316), `app/(admin)/admin/content/lessons/[id]/page.tsx` (L33, L46, L87, L138, L311, L440, L442), `app/(admin)/admin/content/formations/[id]/client-page.tsx` (L73) | Admin: lectura + escritura + UI |
| `duration_seconds` | 5 | `lib/data-access.ts` (L315, L404, L509), `app/(platform)/formations/[slug]/formation-detail.tsx` (L28, L441) | Lectura en platform |
| `video_duration_seconds` | 3 | `types/index.ts` (L119), `lib/api-client.ts` (L196), `migrations/0002_seed_data.sql` (L36) | Declarado en tipo Lesson; API client |
| `is_free` | 6 | `lib/data-access.ts` (L317, L404, L478), `app/(admin)/admin/content/modules/page.tsx` (L39, L71, L72, L85, L300), `app/(admin)/admin/content/lessons/[id]/page.tsx` (L35), `seed.sql` | Lectura + control de acceso |
| `is_preview` | 1 | `scripts/003a_create_tables.sql` (L77) | Solo definición SQL |
| `is_free_preview` | 4 | `types/index.ts` (L124, L416), `app/(admin)/admin/content/modules/page.tsx` (L71, L72, L85), `migrations/0001_initial_schema.sql` | Declarado en tipo Lesson; datos mock |
| `order_index` | 3 | `app/(admin)/admin/content/modules/page.tsx` (L40, L71, L72, L85), `lib/validations/content.ts`, `lib/services/formationService.ts` | Admin + validación |
| `sort_order` | 6 | `lib/data-access.ts` (L318, L335, L402, L404), `types/index.ts` (L123), `seed.sql` | Lectura en platform; tipo |
| `lesson_type` | 2 | `scripts/003a_create_tables.sql`, `migrations/0001_initial_schema.sql` | Solo SQL |
| `content_type` | 4 | `types/index.ts` (L111), `lib/api-client.ts`, `app/(admin)/admin/content/modules/page.tsx` (L71, L72, L85), `app/(admin)/admin/content/lessons/[id]/page.tsx` | Tipo + admin mock |
| `xp_reward` | 3 | `lib/validations/content.ts`, `app/(admin)/admin/content/modules/page.tsx` (L38, L71) | Admin + validación |
| `is_published` | 3 | `lib/data-access.ts`, `app/(admin)/admin/content/modules/page.tsx` | Lectura |
| `slug` | 4 | `seed.sql`, `types/index.ts` (L107), `lib/api-client.ts`, `migrations/` | Tipo + SQL |
| `module_id` | 3 | `app/(admin)/admin/content/modules/page.tsx`, `types/index.ts` | Tipo |

### Tabla `modules`

| Columna | Usos | Archivos | Tipo de uso |
|---|---|---|---|
| `order_index` | 2 | `lib/validations/content.ts` (L27), `lib/services/formationService.ts` | Validación |
| `sort_order` | 5 | `lib/data-access.ts` (L310, L330, L402), `types/index.ts` (L100), `lib/api-client.ts` (L159, L200) | Lectura + tipo |
| `is_published` | 2 | `lib/data-access.ts`, `types/index.ts` (L101) | Lectura + tipo |
| `xp_reward` | 1 | `lib/validations/content.ts` (L29) | Solo validación |

### Tabla `user_progress`

| Columna | Usos | Archivos | Tipo de uso |
|---|---|---|---|
| `is_completed` | 7 | `app/(platform)/learn/[slug]/[lessonId]/actions.ts` (L20, L28, L40), `lib/data-access.ts` (múltiples) | Lectura + escritura |
| `status` | 3 | `app/api/progress/route.ts` (L68, L69), `seed.sql` (ALTER) | Escritura |
| `completed_at` | 5 | `app/(platform)/learn/[slug]/[lessonId]/actions.ts` (L28, L41), `app/api/progress/route.ts` (L103, L132), `lib/data-access.ts` (L54) | Escritura |
| `watched_seconds` | 3 | `app/api/progress/route.ts` (L98, L126), `lib/data-access.ts` (L463) | Lectura + escritura |
| `progress_percent` | 4 | `app/api/progress/route.ts` (L42), `lib/data-access.ts`, `scripts/003a_create_tables.sql` | Lectura + escritura |
| `started_at` | 1 | `app/api/progress/route.ts` (L128) | Escritura |
| `updated_at` | 3 | Data-access (referencias implícitas) | Lectura |

### Tabla `enrollments`

| Columna | Usos | Archivos | Tipo de uso |
|---|---|---|---|
| `status` | 2 | `app/api/enroll/route.ts` (L56), `lib/data-access.ts` (L216) | Escritura + lectura |
| `enrolled_at` | 2 | `app/api/enroll/route.ts` (L57), `lib/data-access.ts` (L99) | Escritura + lectura |
| `completed_at` | 2 | `lib/data-access.ts` (L54, L98) | Lectura |
| `progress_percent` | 2 | `lib/data-access.ts` | Lectura |

### Tabla `profiles`

| Columna | Usos | Archivos | Tipo de uso |
|---|---|---|---|
| `xp` | 8 | `app/api/progress/route.ts` (L155, L186), `lib/data-access.ts` (L68), `app/(platform)/learn/[slug]/[lessonId]/actions.ts` (L51, L81) | Lectura + escritura |
| `level` | 6 | `lib/data-access.ts` (L70), `app/api/progress/route.ts` (L187), `app/(platform)/learn/[slug]/[lessonId]/actions.ts` (L82) | Lectura + escritura |
| `streak_days` | 7 | `lib/data-access.ts` (L69), `app/api/progress/route.ts` (L155, L188), `app/(platform)/learn/[slug]/[lessonId]/actions.ts` (L51, L57, L83) | Lectura + escritura |
| `last_activity_at` | 4 | `app/api/progress/route.ts` (L155, L166, L189) | Lectura + escritura |
| `last_activity_date` | 4 | `app/(platform)/learn/[slug]/[lessonId]/actions.ts` (L51, L58, L84), `seed.sql` | Lectura + escritura |
| `full_name` | 3 | `lib/data-access.ts` (L288), `app/(platform)/profile/actions.ts` (L24) | Lectura + escritura |
| `avatar_url` | 4 | `lib/data-access.ts` (L288, L469), `app/(platform)/profile/actions.ts` (L25) | Lectura + escritura |
| `birth_date` | 2 | `app/(platform)/profile/actions.ts` (L16, L26) | Lectura + escritura |
| `birth_time` | 2 | `app/(platform)/profile/actions.ts` (L17, L27) | Lectura + escritura |
| `birth_city` | 2 | `app/(platform)/profile/actions.ts` (L18, L28) | Lectura + escritura |
| `role` | 3 | `types/index.ts`, `lib/data-access.ts`, `scripts/001_create_profiles.sql` | Tipo + SQL |

> ⚠️ `birth_date`, `birth_time`, `birth_city` son usadas en `profile/actions.ts` pero no aparecen en NINGÚN script SQL de `scripts/`. Son columnas que el código espera pero que no están declaradas en el schema.

---

## 3. Inconsistencias detectadas

### `formations`: duration_hours vs duration_minutes

| Columna A | Veces usada | Columna B | Veces usada | Existe en SQL declarado (`scripts/`) | Recomendación |
|---|---|---|---|---|---|
| `duration_hours` | 7 (admin UI + validación) | `duration_minutes` | 4 (data-access + tipo TS + seed) | `duration_hours` SÍ (scripts/003a). `duration_minutes` NO en scripts/, SÍ en seed.sql | |

**Archivos con `duration_hours`**: `app/(admin)/admin/content/formations/[id]/client-page.tsx`, `app/(admin)/admin/content/formations/client-page.tsx`, `lib/validations/content.ts`  
**Archivos con `duration_minutes`**: `lib/data-access.ts`, `types/index.ts`, `seed.sql`, `migrations/`

---

### `formations`: order_index vs sort_order

| Columna A | Veces usada | Columna B | Veces usada | Existe en SQL declarado (`scripts/`) | Recomendación |
|---|---|---|---|---|---|
| `order_index` | 2 (validación) | `sort_order` | 4 (data-access + tipo TS) | `order_index` SÍ (scripts/003a). `sort_order` NO en scripts/ | |

---

### `lessons`: video_duration vs duration_seconds vs video_duration_seconds

| Columna A | Veces usada | Columna B | Veces usada | Columna C | Veces usada | Existe en SQL declarado | Recomendación |
|---|---|---|---|---|---|---|---|
| `video_duration` | 8 (admin) | `duration_seconds` | 5 (platform + data-access) | `video_duration_seconds` | 3 (tipo TS + api-client) | `video_duration` SÍ (scripts/003a). `duration_seconds` NO en scripts/, SÍ en seed.sql. `video_duration_seconds` solo en SQLite | |

---

### `lessons`: is_free vs is_preview vs is_free_preview

| Columna A | Veces usada | Columna B | Veces usada | Columna C | Veces usada | Existe en SQL declarado | Recomendación |
|---|---|---|---|---|---|---|---|
| `is_free` | 6 (data-access + admin) | `is_preview` | 1 (scripts/003a solo) | `is_free_preview` | 4 (tipo TS + admin mock) | `is_preview` SÍ (scripts/003a). `is_free` NO en scripts/, SÍ en seed.sql. `is_free_preview` solo en SQLite + tipo TS | |

---

### `lessons`: order_index vs sort_order

| Columna A | Veces usada | Columna B | Veces usada | Existe en SQL declarado | Recomendación |
|---|---|---|---|---|---|
| `order_index` | 3 (admin + validación) | `sort_order` | 6 (data-access + tipo TS + seed) | `order_index` SÍ (scripts/003a). `sort_order` NO en scripts/, SÍ en seed.sql | |

---

### `lessons`: lesson_type vs content_type

| Columna A | Veces usada | Columna B | Veces usada | Existe en SQL declarado | Recomendación |
|---|---|---|---|---|---|
| `lesson_type` | 2 (solo SQL) | `content_type` | 4 (tipo TS + admin) | `lesson_type` SÍ (scripts/003a). `content_type` NO en scripts/ | |

---

### `modules`: order_index vs sort_order

| Columna A | Veces usada | Columna B | Veces usada | Existe en SQL declarado | Recomendación |
|---|---|---|---|---|---|
| `order_index` | 2 (validación) | `sort_order` | 5 (data-access + tipo TS + api-client) | `order_index` SÍ (scripts/003a). `sort_order` NO en scripts/, SÍ en seed.sql | |

---

### `profiles`: last_activity_at vs last_activity_date

| Columna A | Veces usada | Columna B | Veces usada | Existe en SQL declarado | Recomendación |
|---|---|---|---|---|---|
| `last_activity_at` | 4 (`app/api/progress/route.ts`) | `last_activity_date` | 4 (`actions.ts` + seed) | `last_activity_at` SÍ (scripts/001). `last_activity_date` NO en scripts/001, SÍ en seed.sql como TIMESTAMPTZ | |

---

### `enrollments`: status (columna faltante en SQL)

| Columna | Veces usada | Existe en SQL declarado | Nota |
|---|---|---|---|
| `status` | 2 | **NO** — no aparece en `scripts/003a_create_tables.sql` | El código escribe `status` en `app/api/enroll/route.ts:56` y lee en `lib/data-access.ts:216`, pero la columna no está en el DDL |

---

### `profiles`: birth_date, birth_time, birth_city (columnas faltantes en SQL)

| Columna | Veces usada | Existe en SQL declarado | Nota |
|---|---|---|---|
| `birth_date` | 2 | **NO** — en ningún script | `app/(platform)/profile/actions.ts` las lee y escribe |
| `birth_time` | 2 | **NO** — en ningún script | Igual |
| `birth_city` | 2 | **NO** — en ningún script | Igual |

---

### `user_progress`: started_at, watched_seconds, status (columnas faltantes en scripts/)

| Columna | Veces usada | Existe en `scripts/003a` | En `seed.sql` ALTER |
|---|---|---|---|
| `watched_seconds` | 3 | **NO** | SÍ, añadida via ALTER |
| `status` | 3 | **NO** | SÍ, añadida via ALTER |
| `started_at` | 1 | **NO** | **NO** — no está en ningún script |

---

## 4. RLS

| Tabla | RLS Habilitado | Políticas declaradas en `scripts/` |
|---|---|---|
| `profiles` | ✅ `scripts/001_create_profiles.sql` | SELECT (own), SELECT (public/true), INSERT (own), UPDATE (own), DELETE (own) |
| `categories` | ✅ `scripts/003b_enable_rls.sql` | SELECT (public/true), ALL (admin) |
| `formations` | ✅ `scripts/003b_enable_rls.sql` | SELECT (published OR admin), ALL (admin) |
| `modules` | ✅ `scripts/003b_enable_rls.sql` | SELECT (enrolled OR admin), ALL (admin) |
| `lessons` | ✅ `scripts/003b_enable_rls.sql` | SELECT (enrolled OR admin), ALL (admin) |
| `user_progress` | ✅ `scripts/003b_enable_rls.sql` | SELECT (own), INSERT (own), UPDATE (own), DELETE (own) |
| `enrollments` | ✅ `scripts/003b_enable_rls.sql` | SELECT (own), INSERT (own), UPDATE (own) |
| `reflections` | ⚠️ Solo en `seed.sql` | Habilitado en seed.sql, no en `scripts/` |
| `mentors` | ❌ No hay script PostgreSQL | Solo en SQLite migration, sin RLS |
| `categories` | ✅ | Pero no hay política RLS para reflections en scripts/ |

> **Nota sobre `lessons` RLS**: La política `lessons_select_enrolled` solo permite acceso a lecciones si el usuario está matriculado. Sin embargo, el código en `lib/data-access.ts:478` tiene lógica para lecciones `is_free` que el usuario no matriculado puede ver. Esta lógica es correcta a nivel de app pero no está reflejada en la política RLS — un usuario no matriculado recibirá error 403 de Supabase aunque la lección sea `is_free = true`.

---

## 5. Funciones faltantes en data-access

Archivo: `lib/data-access.ts`

**Funciones exportadas (11 total):**
```
getAuthUser         — línea 10
getUserProfile      — línea 23
getDashboardData    — línea 35
getFormationsInProgress — línea 77
getRecentActivity   — línea 157
getLibraryFormations — línea 180
getCategories       — línea 272
getReflections      — línea 283
getFormationBySlug  — línea 298
getLessonPageData   — línea 392
getQuestData        — línea 548
```

**Comparación con la lista esperada:**

| Función | Estado | Nota |
|---|---|---|
| `getAuthUser` | ✅ existe | línea 10 |
| `getUserProfile` | ✅ existe | línea 23 |
| `getDashboardData` | ✅ existe | línea 35 |
| `getFormationsInProgress` | ✅ existe | línea 77 |
| `getRecentActivity` | ✅ existe | línea 157 |
| `getFormationBySlug` | ✅ existe | línea 298 |
| `getLibraryFormations` | ✅ existe | línea 180 |
| `getCategories` | ✅ existe | línea 272 |
| `getLessonPageData` | ✅ existe | línea 392 |
| `getQuestData` | ✅ existe | línea 548 |
| `getReflections` | ✅ existe | línea 283 |
| `getEnrollmentStatus` | ❌ no existe | Lógica inline en `app/api/enroll/route.ts` y dentro de `getFormationBySlug`/`getLessonPageData` |
| `getUserWatchedLesson` | ❌ no existe | No encontrado en ningún archivo |

---

## 6. Lugares donde se otorga XP

Se detectaron **2 rutas de código independientes** que otorgan XP al completar una lección:

### Ruta 1: `app/api/progress/route.ts`

```
Línea 106: await awardXP(supabase, user.id, 50)  — cuando is_completed pasa a true (primera vez)
Línea 134: await awardXP(supabase, user.id, 50)  — cuando progress_percent llega a 100
```

La función `awardXP` está definida en el mismo archivo (línea 151):
- Lee: `xp, level, streak_days, last_activity_at`
- Calcula: `newXP = currentXP + 50`, `newLevel = Math.floor(newXP / 500) + 1`
- Lógica de streak basada en `last_activity_at` (fecha con hora)
- Escribe: `xp`, `level`, `streak_days`, `last_activity_at`

> ⚠️ POSIBLE DOBLE AWARD: hay **dos llamadas** a `awardXP` en el mismo handler de la misma ruta (líneas 106 y 134), una condicionada a `is_completed` y otra a `progress_percent === 100`. Si ambas condiciones se cumplen simultáneamente, se otorgan **100 XP** en lugar de 50.

---

### Ruta 2: `app/(platform)/learn/[slug]/[lessonId]/actions.ts`

```
Línea 81: update({ xp: newXp, level: newLevel, streak_days: newStreak, last_activity_date: ... })
```

Esta es una Server Action independiente de la Ruta 1:
- Lee: `xp, level, streak_days, last_activity_date` (columna diferente: `last_activity_date` vs `last_activity_at`)
- Calcula: `newXp = (profile.xp || 0) + 50`, nivel sube si `newXp >= newLevel * 500`
- Lógica de streak basada en `last_activity_date` (solo fecha, sin hora)
- Escribe: `xp`, `level`, `streak_days`, `last_activity_date`

> ⚠️ DUPLICACIÓN CRÍTICA: Si ambas rutas se ejecutan para el mismo evento de completar una lección, el usuario recibe **+100 XP** (50 de cada ruta). Además:
> - Las fórmulas de nivel son ligeramente distintas (`Math.floor(xp/500)+1` vs `if xp >= level*500`)
> - Una usa `last_activity_at` (TIMESTAMPTZ), la otra `last_activity_date` (columna que puede no existir en la BD según qué script se aplicó)

---

### Columnas `xp_reward` declaradas pero no usadas

Las columnas `xp_reward` en `formations` (DEFAULT 100-500), `modules` (DEFAULT 50), y `lessons` (DEFAULT 25-50) están declaradas en el schema pero el código **ignora** estos valores. Siempre hardcodea **50 XP** por lección.

---

## 7. Tipos TypeScript actuales

Archivo: `types/index.ts`

### `Formation`
```typescript
interface Formation {
  id: string                    // requerido
  title: string                 // requerido
  slug: string                  // requerido
  description?: string          // opcional
  short_description?: string    // opcional (no está en SQL)
  thumbnail_url?: string | null // opcional
  trailer_url?: string | null   // opcional
  level: ContentLevel           // requerido — alias de "difficulty", tipo: "beginner"|"intermediate"|"advanced"
  duration_minutes: number      // requerido ⚠️ conflicto: SQL tiene duration_hours
  is_premium: boolean           // requerido
  is_published: boolean         // requerido
  sort_order: number            // requerido ⚠️ conflicto: SQL tiene order_index
  created_at: string            // requerido
  updated_at: string            // requerido
  // Relaciones (opcionales)
  modules?: Module[]
  modules_count?: number
  lessons_count?: number
  progress?: number
}
```

> ⚠️ El tipo usa `level` como nombre del campo de dificultad (un alias del campo SQL `difficulty`). El tipo usa `duration_minutes` y `sort_order` que no coinciden con la columna real en `scripts/003a` (`duration_hours`, `order_index`).

---

### `Module`
```typescript
interface Module {
  id: string                   // requerido
  formation_id: string         // requerido
  title: string                // requerido
  slug: string                 // requerido ⚠️ no está en scripts/003a
  description?: string | null  // opcional
  thumbnail_url?: string | null // opcional (no está en SQL)
  sort_order: number           // requerido ⚠️ conflicto: SQL tiene order_index
  is_published: boolean        // requerido
  created_at: string           // requerido
  updated_at: string           // requerido
  // Relaciones (opcionales)
  formation?: Formation
  lessons?: Lesson[]
  lessons_count?: number
  progress?: number
}
```

---

### `Lesson`
```typescript
interface Lesson {
  id: string                        // requerido
  module_id: string                 // requerido
  title: string                     // requerido
  slug: string                      // requerido ⚠️ no en scripts/003a
  description?: string | null       // opcional
  content_type: ContentType         // requerido ⚠️ SQL tiene lesson_type
  video_url?: string | null         // opcional
  video_duration_seconds: number    // requerido ⚠️ SQL tiene video_duration; seed tiene duration_seconds
  thumbnail_url?: string | null     // opcional
  transcript?: string               // opcional
  resources?: LessonResource[]      // opcional
  sort_order: number                // requerido ⚠️ SQL tiene order_index
  is_free_preview: boolean          // requerido ⚠️ SQL tiene is_preview; seed tiene is_free
  is_published: boolean             // requerido
  created_at: string                // requerido
  updated_at: string                // requerido
  // Relaciones (opcionales)
  module?: Module
  user_progress?: UserProgress
}
```

---

### `UserProgress`
```typescript
interface UserProgress {
  id: string                 // requerido
  user_id: string            // requerido
  lesson_id: string          // requerido
  status: ProgressStatus     // requerido ("not_started"|"in_progress"|"completed") ⚠️ no en scripts/003a
  progress_percent: number   // requerido
  last_position_seconds: number // requerido ⚠️ SQL tiene last_position (sin _seconds)
  completed_at?: string      // opcional
  created_at: string         // requerido
  updated_at: string         // requerido
}
```

> ⚠️ El tipo NO tiene `is_completed` (que sí existe en SQL y se usa extensamente en el código). El tipo usa `last_position_seconds` pero SQL tiene `last_position`.

---

### `Enrollment`

No existe una interfaz `Enrollment` en `types/index.ts`. Se usa inline en respuestas de API y dentro de funciones de data-access sin tipo explícito.

---

### `Profile`

No existe una interfaz `Profile` dedicada en `types/index.ts`. En su lugar hay:

```typescript
interface User {
  id: string
  email: string
  name: string                // ⚠️ SQL tiene full_name
  avatar_url: string | null
  role: UserRole              // "user" | "admin" | "mentor" ⚠️ SQL CHECK dice 'student'|'mentor'|'admin'
  status: UserStatus          // "active"|"inactive"|"suspended" ⚠️ no existe en SQL
  email_verified: boolean     // ⚠️ no existe en SQL
  created_at: string
  updated_at: string
}

interface UserStreak {
  id: string                  // ⚠️ profiles no tiene este campo separado
  user_id: string
  current_streak: number      // ⚠️ SQL tiene streak_days
  longest_streak: number      // ⚠️ no existe en SQL
  total_xp: number            // ⚠️ SQL tiene xp
  level: number
  last_activity_date?: string
  created_at: string
  updated_at: string
}
```

> ⚠️ `UserStreak` en el tipo modela una tabla separada `user_streaks` (presente en `migrations/0002_seed_data.sql` SQLite) pero en el schema PostgreSQL, todos estos campos son columnas de `profiles`. No hay tabla `user_streaks` en `scripts/`.

---

## Resumen ejecutivo

- **10 inconsistencias críticas de columnas** entre lo declarado en SQL y lo esperado por el código:
  1. `formations.duration_hours` (SQL/admin) vs `duration_minutes` (data-access/tipos)
  2. `formations.order_index` (SQL) vs `sort_order` (data-access/tipos)
  3. `lessons.video_duration` (SQL/admin) vs `duration_seconds` (data-access/platform) vs `video_duration_seconds` (tipos TS)
  4. `lessons.is_preview` (SQL) vs `is_free` (data-access/platform) vs `is_free_preview` (tipos TS)
  5. `lessons.order_index` (SQL) vs `sort_order` (data-access/tipos)
  6. `lessons.lesson_type` (SQL) vs `content_type` (tipos TS/admin)
  7. `modules.order_index` (SQL) vs `sort_order` (data-access/tipos)
  8. `profiles.last_activity_at` (scripts/001) vs `last_activity_date` (seed/actions.ts)
  9. `enrollments` sin columna `status` en SQL (el código la escribe)
  10. `profiles` sin columnas `birth_date`, `birth_time`, `birth_city` en SQL (el código las escribe)

- **2 funciones data-access faltantes**:
  - ❌ `getEnrollmentStatus`
  - ❌ `getUserWatchedLesson`

- **2 lugares con duplicación de lógica XP** (+ posible doble award en route.ts):
  1. `app/api/progress/route.ts:106` y `:134` — función `awardXP`, hardcoded +50 XP, usa `last_activity_at`
  2. `app/(platform)/learn/[slug]/[lessonId]/actions.ts:81` — inline, hardcoded +50 XP, usa `last_activity_date`
  - Las columnas `xp_reward` en formations/modules/lessons existen en SQL pero el código las ignora completamente

- **3 columnas de `profiles` usadas en código sin declaración SQL**: `birth_date`, `birth_time`, `birth_city`
- **1 columna `started_at` en `user_progress`** usada en código sin declaración SQL ni ALTER
- **Los tipos TypeScript no coinciden con el schema SQL** en múltiples campos críticos (`is_completed` falta en tipo, `last_position` vs `last_position_seconds`, `status` en UserProgress no existe en scripts/003a)

---

## Hallazgos adicionales

### A. Dos sistemas de schema en paralelo

El proyecto tiene `scripts/` (PostgreSQL, el canónico) y `migrations/` (SQLite, probablemente una iteración anterior). Muchas inconsistencias de nombres de columnas se explican porque `migrations/` tiene una tercera convención de nombres. **`migrations/` parece obsoleto** y no debería usarse como referencia.

### B. `seed.sql` como parche acumulativo

`seed.sql` en la raíz hace `CREATE TABLE IF NOT EXISTS` + `ALTER TABLE ADD COLUMN IF NOT EXISTS`. Esto significa que si `scripts/` fue aplicado primero y luego `seed.sql`, la tabla tendrá AMBOS sets de columnas. La base de datos en Supabase podría tener columnas como `duration_hours` Y `duration_minutes` simultáneamente, con el código leyendo una y el admin escribiendo la otra.

### C. RLS de lessons bloquea lecciones gratuitas

La política `lessons_select_enrolled` en `scripts/003b_enable_rls.sql` solo permite leer lecciones a usuarios matriculados. Sin embargo `lib/data-access.ts:478` verifica `is_free` para permitir acceso sin matrícula. Esta lógica app-level nunca llega a ejecutarse porque Supabase rechaza la query antes con 403. El preview de lecciones gratuitas no funciona en producción sin cambiar la política RLS.

### D. Role default inconsistente

- `scripts/001_create_profiles.sql`: `role TEXT DEFAULT 'student'`
- `seed.sql`: `role TEXT DEFAULT 'user'`
- `types/index.ts` `UserRole`: `"user" | "admin" | "mentor"`

El CHECK constraint en `scripts/001` admite `'student'` pero el tipo TypeScript declara `'user'`. Si el trigger de auto-create profile usa la definición de `scripts/001`, los usuarios nuevos tendrán `role = 'student'`, pero el código que verifica roles puede estar chequeando `'user'`.

### E. Tabla `reflections` sin script de creación en `scripts/`

`reflections` no tiene archivo en `scripts/`. Solo existe en `seed.sql` y en el schema SQLite obsoleto. Si la BD se resetea aplicando solo los scripts de `scripts/`, la tabla `reflections` no existirá y la Taberna fallará.
