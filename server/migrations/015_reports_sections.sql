-- =============================================================================
-- Migration: 015_reports_sections.sql
-- Description: Add section column and index to reports table
-- =============================================================================

ALTER TABLE reports
ADD COLUMN IF NOT EXISTS section TEXT NOT NULL DEFAULT 'personalized'
CHECK (section IN ('personalized', 'additional'));

-- Ensure any existing rows have section set to 'personalized'
UPDATE reports
SET section = 'personalized'
WHERE section IS NULL;

-- Index for section and position ordering
CREATE INDEX IF NOT EXISTS idx_reports_section_position ON reports (section, position ASC);
