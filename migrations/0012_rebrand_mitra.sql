-- Rebrand: actualizar el nombre de la plataforma a "Mitra" en los ajustes.
-- Idempotente: solo toca los valores seed antiguos.
UPDATE public.platform_settings
SET value = 'Mitra'
WHERE key = 'site_name' AND value IN ('Sendero', 'Μήτρα');

UPDATE public.platform_settings
SET value = 'Bienvenido a Mitra, tu espacio de crecimiento personal.'
WHERE key = 'welcome_message' AND value LIKE 'Bienvenido a Sendero%';
