-- =====================================================
-- Migration 0003: Access Control System
-- Adds access_status to profiles table for
-- controlling who can access platform content.
-- Values: pending | approved | suspended
-- =====================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS access_status TEXT
    NOT NULL DEFAULT 'pending'
    CHECK (access_status IN ('pending', 'approved', 'suspended'));

-- Admin and mentor roles get auto-approved
UPDATE profiles
  SET access_status = 'approved'
  WHERE role IN ('admin', 'mentor');

-- Index for fast middleware lookups
CREATE INDEX IF NOT EXISTS idx_profiles_access_status
  ON profiles (access_status);
