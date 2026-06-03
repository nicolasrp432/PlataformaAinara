-- =====================================================
-- 0011 - Cartas Natales
-- Almacena la carta natal completa calculada en el
-- proyecto "carta-natal" y campos derivados en profiles.
-- =====================================================

-- Tabla para almacenar cartas natales completas (una por usuario)
CREATE TABLE IF NOT EXISTS public.natal_charts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,

  -- Datos de nacimiento usados para el cálculo
  birth_date TEXT NOT NULL,
  birth_time TEXT NOT NULL,
  birth_city TEXT NOT NULL,
  birth_country TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  timezone TEXT,

  -- Posiciones planetarias (array de PlanetPosition)
  planets JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Cúspides de las casas (array de HouseCusp)
  houses JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Aspectos (array de Aspect)
  aspects JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Ángulos principales (AnglePoint)
  ascendant JSONB,
  midheaven JSONB,

  -- Metadata
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: lectura pública (los perfiles ya son públicos),
-- solo el dueño puede insertar/actualizar/borrar su carta.
ALTER TABLE public.natal_charts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Natal charts viewable by everyone" ON public.natal_charts;
CREATE POLICY "Natal charts viewable by everyone"
  ON public.natal_charts FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users insert own natal chart" ON public.natal_charts;
CREATE POLICY "Users insert own natal chart"
  ON public.natal_charts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own natal chart" ON public.natal_charts;
CREATE POLICY "Users update own natal chart"
  ON public.natal_charts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own natal chart" ON public.natal_charts;
CREATE POLICY "Users delete own natal chart"
  ON public.natal_charts FOR DELETE
  USING (auth.uid() = user_id);

-- Campos derivados en profiles para acceso rápido (resumen)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='profiles' AND column_name='sun_sign') THEN
    ALTER TABLE public.profiles ADD COLUMN sun_sign TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='profiles' AND column_name='moon_sign') THEN
    ALTER TABLE public.profiles ADD COLUMN moon_sign TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='profiles' AND column_name='rising_sign') THEN
    ALTER TABLE public.profiles ADD COLUMN rising_sign TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='profiles' AND column_name='natal_chart_id') THEN
    ALTER TABLE public.profiles ADD COLUMN natal_chart_id UUID REFERENCES public.natal_charts(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Índice para búsquedas por usuario
CREATE INDEX IF NOT EXISTS idx_natal_charts_user_id ON public.natal_charts(user_id);

-- Trigger para mantener updated_at al día
CREATE OR REPLACE FUNCTION public.set_natal_charts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_natal_charts_updated_at ON public.natal_charts;
CREATE TRIGGER trg_natal_charts_updated_at
  BEFORE UPDATE ON public.natal_charts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_natal_charts_updated_at();
