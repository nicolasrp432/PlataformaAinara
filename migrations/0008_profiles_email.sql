-- Add email to profiles so the auth signup trigger can create/update rows safely.
-- Backfill existing profiles from auth.users when possible.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS email TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email
  ON profiles (email);

UPDATE profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
  AND (p.email IS NULL OR p.email = '');
