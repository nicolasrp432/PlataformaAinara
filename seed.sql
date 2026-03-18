-- ==========================================
-- SCRIPT DE BASE DE DATOS: PLATAFORMA AINARA
-- ==========================================
-- Ejecuta este script desde el SQL Editor de Supabase
-- para asegurar que todas las tablas, rachas, exp y seguridad funcionen bien.

-- 1. Habilitar extensión para generar UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1.5. Actualizar tablas existentes con nuevas columnas (Evita errores si la tabla ya existía)
DO $$ 
BEGIN
  -- Profiles
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='level') THEN 
    ALTER TABLE public.profiles ADD COLUMN level INTEGER DEFAULT 1;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='xp') THEN 
    ALTER TABLE public.profiles ADD COLUMN xp INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='streak_days') THEN 
    ALTER TABLE public.profiles ADD COLUMN streak_days INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='last_activity_date') THEN 
    ALTER TABLE public.profiles ADD COLUMN last_activity_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;

  -- Formations
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='formations' AND column_name='difficulty') THEN 
    ALTER TABLE public.formations ADD COLUMN difficulty TEXT DEFAULT 'beginner';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='formations' AND column_name='duration_minutes') THEN 
    ALTER TABLE public.formations ADD COLUMN duration_minutes INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='formations' AND column_name='xp_reward') THEN 
    ALTER TABLE public.formations ADD COLUMN xp_reward INTEGER DEFAULT 500;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='formations' AND column_name='is_published') THEN 
    ALTER TABLE public.formations ADD COLUMN is_published BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='formations' AND column_name='is_premium') THEN 
    ALTER TABLE public.formations ADD COLUMN is_premium BOOLEAN DEFAULT false;
  END IF;

  -- Lessons
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lessons' AND column_name='xp_reward') THEN 
    ALTER TABLE public.lessons ADD COLUMN xp_reward INTEGER DEFAULT 50;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lessons' AND column_name='resources') THEN 
    ALTER TABLE public.lessons ADD COLUMN resources JSONB DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lessons' AND column_name='is_free') THEN 
    ALTER TABLE public.lessons ADD COLUMN is_free BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lessons' AND column_name='duration_seconds') THEN 
    ALTER TABLE public.lessons ADD COLUMN duration_seconds INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lessons' AND column_name='video_url') THEN 
    ALTER TABLE public.lessons ADD COLUMN video_url TEXT;
  END IF;

  -- User Progress
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_progress' AND column_name='watched_seconds') THEN 
    ALTER TABLE public.user_progress ADD COLUMN watched_seconds INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_progress' AND column_name='progress_percent') THEN 
    ALTER TABLE public.user_progress ADD COLUMN progress_percent INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_progress' AND column_name='status') THEN 
    ALTER TABLE public.user_progress ADD COLUMN status TEXT DEFAULT 'not_started';
  END IF;
END $$;

-- 2. Asegurar existencia de las tablas maestras (Profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  last_activity_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Tabla: Formaciones
CREATE TABLE IF NOT EXISTS public.formations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  is_published BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  difficulty TEXT DEFAULT 'beginner',
  duration_minutes INTEGER DEFAULT 0,
  xp_reward INTEGER DEFAULT 500,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.formations ENABLE ROW LEVEL SECURITY;

-- 4. Tabla: Módulos
CREATE TABLE IF NOT EXISTS public.modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  formation_id UUID REFERENCES public.formations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

-- 5. Tabla: Lecciones
CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  video_url TEXT,
  duration_seconds INTEGER DEFAULT 0,
  is_free BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  xp_reward INTEGER DEFAULT 50,
  resources JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- 6. Tabla: Reflexiones (Para la Taberna y Comentarios de Aula)
CREATE TABLE IF NOT EXISTS public.reflections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE, -- si es null, es directo a taberna
  content TEXT NOT NULL,
  is_public BOOLEAN DEFAULT true,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.reflections ENABLE ROW LEVEL SECURITY;

-- 7. Tabla: Progreso de los Estudiantes
CREATE TABLE IF NOT EXISTS public.user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  is_completed BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'not_started',
  watched_seconds INTEGER DEFAULT 0,
  progress_percent INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  last_watched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;


-- ==========================================
-- POLÍTICAS DE SEGURIDAD (Row Level Security)
-- ==========================================
-- Sin esto, Next.js no puede insertar datos:

-- Profiles: ver todo, modificar tu propio perfil
CREATE POLICY "Profiles viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Formaciones/Lessons: ver todo
CREATE POLICY "Public read formations" ON public.formations FOR SELECT USING (true);
CREATE POLICY "Public read modules" ON public.modules FOR SELECT USING (true);
CREATE POLICY "Public read lessons" ON public.lessons FOR SELECT USING (true);

-- Reflexiones:
CREATE POLICY "Reflections viewable by everyone" ON public.reflections FOR SELECT USING (true);
CREATE POLICY "Users insert own reflections" ON public.reflections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own reflections" ON public.reflections FOR UPDATE USING (auth.uid() = user_id);

-- Progreso:
CREATE POLICY "Users view own progress" ON public.user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own progress" ON public.user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own progress" ON public.user_progress FOR UPDATE USING (auth.uid() = user_id);


-- ==========================================
-- INSERCIÓN DE FORMACIÓN DE PRUEBA EXTREMA
-- ==========================================
INSERT INTO public.formations (id, title, slug, description, is_published, is_premium, difficulty)
VALUES 
('f0000000-0000-0000-0000-000000000005', 'Despertar Consciente MVP', 'despertar-mvp', 'Comienza la prueba completa del MVP.', true, false, 'beginner')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.modules (id, formation_id, title, slug, sort_order)
VALUES 
('e0000000-0000-0000-0000-000000000005', 'f0000000-0000-0000-0000-000000000005', 'Módulo 1: Introducción', 'modulo-1-demo', 1)
ON CONFLICT DO NOTHING;

INSERT INTO public.lessons (id, module_id, title, slug, description, video_url, duration_seconds, sort_order, is_free)
VALUES 
('d0000000-0000-0000-0000-000000000005', 'e0000000-0000-0000-0000-000000000005', 'La Bienvenida', 'la-bienvenida-demo', 'Visualiza este video de prueba para auto-completar el progreso.', 'https://www.w3schools.com/html/mov_bbb.mp4', 120, 1, true),
('d0000000-0000-0000-0000-000000000006', 'e0000000-0000-0000-0000-000000000005', 'Forjando el Hábito', 'forjando-habito-demo', 'Segunda lección para ganar XP adicional.', 'https://www.w3schools.com/html/mov_bbb.mp4', 240, 2, true)
ON CONFLICT DO NOTHING;
