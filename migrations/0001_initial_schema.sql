-- =====================================================
-- Leader Blueprint - Schema de Base de Datos
-- Sistema de Formación Premium con Control de Acceso
-- =====================================================

-- Tabla de Usuarios
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'mentor')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  email_verified INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Sesiones de Usuario (JWT refresh tokens)
CREATE TABLE IF NOT EXISTS user_sessions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token TEXT UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Planes/Suscripciones
CREATE TABLE IF NOT EXISTS subscription_plans (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price_monthly REAL,
  price_yearly REAL,
  features TEXT, -- JSON array
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Acceso de Usuarios (Control de pago/autorización)
CREATE TABLE IF NOT EXISTS user_access (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id TEXT REFERENCES subscription_plans(id),
  access_type TEXT DEFAULT 'free' CHECK (access_type IN ('free', 'paid', 'manual', 'trial')),
  access_granted_by TEXT, -- admin user_id si es manual
  access_reason TEXT, -- razón si es manual
  starts_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,
  is_active INTEGER DEFAULT 1,
  payment_reference TEXT, -- referencia de pago externo
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Formaciones (Cursos principales)
CREATE TABLE IF NOT EXISTS formations (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  short_description TEXT,
  thumbnail_url TEXT,
  trailer_url TEXT,
  level TEXT DEFAULT 'beginner' CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  duration_minutes INTEGER DEFAULT 0,
  is_premium INTEGER DEFAULT 1,
  is_published INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Módulos (dentro de formaciones)
CREATE TABLE IF NOT EXISTS modules (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  formation_id TEXT NOT NULL REFERENCES formations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_published INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(formation_id, slug)
);

-- Tabla de Lecciones (dentro de módulos)
CREATE TABLE IF NOT EXISTS lessons (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  content_type TEXT DEFAULT 'video' CHECK (content_type IN ('video', 'audio', 'text', 'quiz', 'exercise')),
  video_url TEXT,
  video_duration_seconds INTEGER DEFAULT 0,
  thumbnail_url TEXT,
  transcript TEXT,
  resources TEXT, -- JSON array de recursos descargables
  sort_order INTEGER DEFAULT 0,
  is_free_preview INTEGER DEFAULT 0, -- lección gratuita como preview
  is_published INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(module_id, slug)
);

-- Tabla de Progreso del Usuario
CREATE TABLE IF NOT EXISTS user_progress (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  progress_percent INTEGER DEFAULT 0,
  last_position_seconds INTEGER DEFAULT 0, -- posición del video
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, lesson_id)
);

-- Tabla de Racha de Usuario
CREATE TABLE IF NOT EXISTS user_streaks (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  last_activity_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de XP Log (historial de puntos)
CREATE TABLE IF NOT EXISTS xp_log (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  xp_amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  reference_type TEXT, -- 'lesson', 'module', 'streak', etc.
  reference_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Reflexiones (Diario / Journal)
CREATE TABLE IF NOT EXISTS reflections (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id TEXT REFERENCES lessons(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_public INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Reacciones a Reflexiones
CREATE TABLE IF NOT EXISTS reflection_reactions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  reflection_id TEXT NOT NULL REFERENCES reflections(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('resonate', 'support')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(reflection_id, user_id, reaction_type)
);

-- Tabla de Mentores
CREATE TABLE IF NOT EXISTS mentors (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  title TEXT,
  bio TEXT,
  avatar_url TEXT,
  specialties TEXT, -- JSON array
  session_price REAL,
  session_duration_minutes INTEGER DEFAULT 60,
  calendar_link TEXT, -- link externo de calendario
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Disponibilidad de Mentores
CREATE TABLE IF NOT EXISTS mentor_availability (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  mentor_id TEXT NOT NULL REFERENCES mentors(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Domingo
  start_time TEXT NOT NULL, -- formato HH:MM
  end_time TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Sesiones de Mentoría
CREATE TABLE IF NOT EXISTS mentorship_sessions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  mentor_id TEXT NOT NULL REFERENCES mentors(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scheduled_at DATETIME NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
  meeting_link TEXT,
  notes TEXT,
  user_notes TEXT, -- notas del usuario sobre qué quiere trabajar
  payment_reference TEXT,
  cancelled_by TEXT,
  cancelled_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Bloqueos de Calendario (fechas no disponibles)
CREATE TABLE IF NOT EXISTS mentor_blocked_dates (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  mentor_id TEXT NOT NULL REFERENCES mentors(id) ON DELETE CASCADE,
  blocked_date DATE NOT NULL,
  reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(mentor_id, blocked_date)
);

-- Tabla de Configuración del Sistema
CREATE TABLE IF NOT EXISTS system_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_access_user_id ON user_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_access_active ON user_access(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_formations_published ON formations(is_published);
CREATE INDEX IF NOT EXISTS idx_formations_slug ON formations(slug);
CREATE INDEX IF NOT EXISTS idx_modules_formation ON modules(formation_id);
CREATE INDEX IF NOT EXISTS idx_lessons_module ON lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_lesson ON user_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_reflections_user ON reflections(user_id);
CREATE INDEX IF NOT EXISTS idx_reflections_public ON reflections(is_public);
CREATE INDEX IF NOT EXISTS idx_mentorship_sessions_mentor ON mentorship_sessions(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentorship_sessions_user ON mentorship_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_mentorship_sessions_date ON mentorship_sessions(scheduled_at);
