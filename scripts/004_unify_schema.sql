-- ============================================================
-- Migration 004: Unify Schema Column Names
-- Applied: 2026-05-06
-- Purpose: Documents the canonical column rename migration already
--          applied to the Supabase project via the dashboard.
--          TypeScript code has been synchronized to match these names.
-- ============================================================

-- PROFILES
-- Canonical columns (no renames needed — already correct):
--   id, full_name, avatar_url, role, status, level, xp,
--   streak_days, last_activity_date, birth_date, birth_time,
--   birth_city, created_at, updated_at
-- Removed non-canonical alias: last_activity_at → last_activity_date (already applied)

-- FORMATIONS
-- Canonical columns:
--   id, title, slug, description, short_description, long_description,
--   thumbnail_url, trailer_url, difficulty, duration_minutes,
--   is_premium, is_published, is_featured, sort_order, xp_reward,
--   price, created_at, updated_at
-- Renamed: duration_hours → duration_minutes (already applied)
-- Renamed: order_index → sort_order (already applied)

-- MODULES
-- Canonical columns:
--   id, formation_id, title, slug, description, thumbnail_url,
--   sort_order, is_published, created_at, updated_at
-- Renamed: order_index → sort_order (already applied)
-- Removed: xp_reward (not in modules schema)

-- LESSONS
-- Canonical columns:
--   id, module_id, title, slug, description, content_type,
--   video_url, duration_seconds, thumbnail_url, transcript,
--   resources, sort_order, is_free, is_published, xp_reward,
--   created_at, updated_at
-- Renamed: lesson_type → content_type (already applied)
-- Renamed: video_duration / video_duration_seconds → duration_seconds (already applied)
-- Renamed: order_index → sort_order (already applied)
-- Renamed: is_preview / is_free_preview → is_free (already applied)

-- ENROLLMENTS
-- Canonical columns:
--   id, user_id, formation_id, status, enrolled_at, completed_at,
--   progress_percent

-- USER_PROGRESS
-- Canonical columns:
--   id, user_id, lesson_id, status, is_completed, progress_percent,
--   watched_seconds, last_position_seconds, started_at, completed_at,
--   created_at, updated_at

-- REFLECTIONS
-- Canonical columns:
--   id, user_id, lesson_id, content, is_public, created_at, updated_at

-- No DDL statements needed — migration was applied via Supabase dashboard.
-- This file serves as an authoritative record of the schema state.
