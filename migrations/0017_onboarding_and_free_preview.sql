-- =====================================================================
-- Migration 0017 — Alta sin fricción + primera clase gratuita
--
-- Acompaña al cambio de modelo de acceso:
--   pending  = cuenta creada, nivel gratuito (ve la 1ª clase de cada formación)
--   approved = suscripción activa (contenido completo)
--   suspended = impago o cuenta bloqueada
--
-- Es idempotente: se puede ejecutar más de una vez sin efectos adversos.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. El trigger de alta no puede tumbar el registro
--
-- `handle_new_user` corre DENTRO de la transacción que crea el usuario en
-- `auth.users`. Si lanza una excepción —un email duplicado en `profiles`
-- de una cuenta borrada a medias, un CHECK que ya no cuadra, un cambio de
-- esquema— Supabase aborta el alta entera y el usuario ve
-- "Database error saving new user", sin ninguna pista de qué ha pasado.
--
-- El perfil es importante, pero no lo suficiente como para impedir que
-- alguien se registre: si su creación falla, se avisa por log y el alta
-- continúa. `getUserProfile` ya tolera un perfil ausente, y la siguiente
-- escritura del perfil lo crea con ON CONFLICT.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(
        NEW.raw_user_meta_data ->> 'full_name',
        NEW.raw_user_meta_data ->> 'name',
        NULL
      ),
      COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', NULL)
    )
    ON CONFLICT (id) DO UPDATE SET
      email      = EXCLUDED.email,
      full_name  = COALESCE(EXCLUDED.full_name, profiles.full_name),
      avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '[handle_new_user] no se pudo crear el perfil de %: % (%)',
      NEW.id, SQLERRM, SQLSTATE;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- ---------------------------------------------------------------------
-- 2. Backfill de perfiles ausentes
--
-- Cualquier usuario que se registrase mientras el trigger fallaba se quedó
-- sin fila en `profiles`. Se recuperan aquí para que puedan entrar con
-- normalidad.
-- ---------------------------------------------------------------------
INSERT INTO public.profiles (id, email, full_name)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name')
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;


-- ---------------------------------------------------------------------
-- 3. Primera lección de cada formación marcada como gratuita
--
-- La aplicación ya abre la primera lección por posición, sin depender de
-- este flag (ver `isLessonUnlocked` en lib/access.ts). Se marca igualmente
-- para que la base de datos diga lo mismo que la interfaz y para que el
-- panel de administración muestre la casilla correcta.
--
-- El orden es el mismo que usa la aplicación: módulos por `sort_order` y,
-- dentro de cada uno, lecciones por `sort_order`.
-- ---------------------------------------------------------------------
WITH ordered AS (
  SELECT
    l.id,
    ROW_NUMBER() OVER (
      PARTITION BY m.formation_id
      ORDER BY m.sort_order NULLS LAST, m.created_at, l.sort_order NULLS LAST, l.created_at
    ) AS position
  FROM lessons l
  JOIN modules m ON m.id = l.module_id
  WHERE l.is_published
)
UPDATE lessons
SET is_free = TRUE
FROM ordered
WHERE lessons.id = ordered.id
  AND ordered.position = 1
  AND lessons.is_free IS DISTINCT FROM TRUE;


-- ---------------------------------------------------------------------
-- 4. Perfil de la mentora
--
-- El texto público se sirve desde `lib/mentor.ts` (ver el comentario de ese
-- fichero). Aquí se corrige el dato almacenado para que ninguna consulta
-- antigua siga publicando una cifra de experiencia que no es la real.
-- ---------------------------------------------------------------------
UPDATE mentors
SET
  name  = 'Ainara',
  title = 'Fundadora y mentora de Mitra',
  bio   = 'Llevo cinco años acompañando procesos de transformación personal, uno a uno. No trabajo con fórmulas: cada sesión parte de dónde estás hoy y de qué quieres que sea distinto.'
WHERE is_active = TRUE;
