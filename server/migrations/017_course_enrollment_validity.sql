-- =============================================================================
-- Migration: 017_course_enrollment_validity.sql
-- Description: Course subscription validity (1-year access limit)
-- Compatible with: PostgreSQL & Supabase
-- =============================================================================

-- 1. Add expires_at column to enrollments
ALTER TABLE enrollments 
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- 2. Backfill existing active enrollments to 1 year from their granted_at date
UPDATE enrollments 
SET expires_at = granted_at + INTERVAL '1 year' 
WHERE expires_at IS NULL AND status = 'active';

-- 3. Create index for fast status & validity queries
CREATE INDEX IF NOT EXISTS idx_enrollments_user_course_exp 
  ON enrollments (user_id, course_id, status, expires_at);
