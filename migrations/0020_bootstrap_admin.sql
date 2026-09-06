-- =====================================================================
-- Migration 0020 — Recuperar tu propio acceso de administrador
--
-- POR QUÉ HACE FALTA ESTO
--
-- El panel de administración aceptaba el rol desde `user_metadata`, un campo
-- que el propio usuario puede escribir desde el navegador con
-- `supabase.auth.updateUser({ data: { role: 'admin' } })`. Es decir:
-- cualquiera podía concederse el panel. Se corrigió para leer el rol solo de
-- `profiles.role`, que únicamente se puede escribir desde el servidor.
--
-- Efecto secundario: si tu cuenta era administradora ÚNICAMENTE por
-- `user_metadata` y su fila en `profiles` decía `student`, dejaste de serlo.
-- Este script lo arregla en el sitio correcto.
--
-- CÓMO USARLO
--
-- Sustituye el correo de abajo por el tuyo y ejecútalo en el editor SQL de
-- Supabase. Es idempotente: puedes ejecutarlo las veces que quieras.
-- =====================================================================

-- ⚠️  CAMBIA ESTE CORREO POR EL TUYO ANTES DE EJECUTAR  ⚠️
\set admin_email 'tu-correo@ejemplo.com'

-- ── 1. Ver en qué estado está la cuenta ──────────────────────────────────
-- Ejecuta esto primero, por separado, para saber qué hay que arreglar.
SELECT
  p.email,
  p.role                AS rol_actual,
  p.access_status       AS suscripcion,
  p.has_lifetime_access AS acceso_permanente
FROM public.profiles p
WHERE p.email = :'admin_email';


-- ── 2. Devolverte el rol de administrador ────────────────────────────────
-- Con `role = 'admin'` recuperas a la vez el panel Y el contenido completo:
-- `resolveAccessTier` devuelve `staff` para admin y mentor, que tiene acceso
-- a todo sin necesidad de haber pagado nada.
UPDATE public.profiles
   SET role = 'admin'
 WHERE email = :'admin_email';


-- ── 3. (Opcional) Marcarte además el acceso permanente ───────────────────
-- No hace falta para poder entrar —el rol de admin ya te da todo—, pero sí
-- para ver la plataforma tal y como la ve alguien que ha comprado el pago
-- único, sin los avisos de "estás en el plan gratuito".
--
-- Descomenta si lo quieres:
--
-- UPDATE public.profiles
--    SET has_lifetime_access = TRUE
--  WHERE email = :'admin_email';


-- ── 4. Comprobación ──────────────────────────────────────────────────────
SELECT
  email,
  role,
  access_status,
  has_lifetime_access
FROM public.profiles
WHERE email = :'admin_email';

-- Después de ejecutarlo, cierra sesión y vuelve a entrar. El middleware
-- guarda el rol en una cookie durante 60 segundos, así que si no cierras
-- sesión tardarás como mucho un minuto en ver el cambio.
