-- =============================================================================
-- Migration: 008_testimonials_and_consultation.sql
-- Description: Extends testimonials (location, rating, created_at) and
--              consultation_settings (integer fee, services, process_steps, faqs,
--              single-row constraint).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. EXTEND TESTIMONIALS TABLE
-- -----------------------------------------------------------------------------

ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS location VARCHAR(80);
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS rating INT;
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

-- Enforce rating check (1-5 or null)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'testimonials_rating_check') THEN
        ALTER TABLE testimonials ADD CONSTRAINT testimonials_rating_check CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5));
    END IF;
END $$;

-- Ensure ordering index is present
CREATE INDEX IF NOT EXISTS idx_testimonials_visible_position ON testimonials (is_visible, position);

-- -----------------------------------------------------------------------------
-- 2. EXTEND CONSULTATION_SETTINGS TABLE
-- -----------------------------------------------------------------------------

-- Alter fee to integer rupees
ALTER TABLE consultation_settings ALTER COLUMN fee TYPE INT USING round(fee)::INT;
ALTER TABLE consultation_settings ALTER COLUMN fee SET DEFAULT 3000;
ALTER TABLE consultation_settings ALTER COLUMN duration_minutes SET DEFAULT 45;

-- Add rich content columns (jsonb)
ALTER TABLE consultation_settings ADD COLUMN IF NOT EXISTS services JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE consultation_settings ADD COLUMN IF NOT EXISTS process_steps JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE consultation_settings ADD COLUMN IF NOT EXISTS faqs JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Remove legacy dummy/duplicate rows before applying single-row constraint
-- (Clean starting state so seed-content can populate full initial configuration)
DELETE FROM consultation_settings;

-- Single-row constraint: is_singleton boolean column defaulted to true with unique & check constraint
ALTER TABLE consultation_settings ADD COLUMN IF NOT EXISTS is_singleton BOOLEAN NOT NULL DEFAULT true;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'consultation_settings_singleton_check') THEN
        ALTER TABLE consultation_settings ADD CONSTRAINT consultation_settings_singleton_check CHECK (is_singleton = true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'consultation_settings_singleton_unique') THEN
        ALTER TABLE consultation_settings ADD CONSTRAINT consultation_settings_singleton_unique UNIQUE (is_singleton);
    END IF;
END $$;
