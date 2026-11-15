-- =============================================================================
-- Migration: 003_courses_cms.sql
-- Description: Adds updated_at timestamp to courses table for CMS tracking
-- =============================================================================

ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());
