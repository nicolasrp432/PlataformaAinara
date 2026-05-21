-- Platform Settings — key/value store for admin-editable configuration
-- Apply in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS platform_settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  label       TEXT NOT NULL,       -- human-readable label shown in admin
  description TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Default values
INSERT INTO platform_settings (key, value, label, description) VALUES
  ('site_name',         'Sendero',     'Nombre de la plataforma', 'Nombre que aparece en el título del sitio'),
  ('welcome_message',   'Bienvenido a Sendero, tu espacio de crecimiento personal.', 'Mensaje de bienvenida', 'Mostrado en el dashboard del usuario'),
  ('xp_per_lesson',    '50',           'XP por lección completada', 'Puntos de experiencia base por cada lección'),
  ('xp_per_module',    '200',          'XP bonus por módulo completo', 'Bonus de XP al terminar un módulo entero'),
  ('xp_per_streak',    '25',           'XP bonus por día de racha', 'XP extra por mantener la racha diaria'),
  ('xp_level_threshold', '500',        'XP necesario por nivel', 'Cuántos XP se necesitan para subir cada nivel')
ON CONFLICT (key) DO NOTHING;

-- Row Level Security
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Admins can read and write
CREATE POLICY "Admins manage platform_settings" ON platform_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Authenticated users can read (needed for client-side config display)
CREATE POLICY "Authenticated users read platform_settings" ON platform_settings
  FOR SELECT USING (auth.role() = 'authenticated');
