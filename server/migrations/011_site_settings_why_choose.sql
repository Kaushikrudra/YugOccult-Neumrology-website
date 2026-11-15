-- =============================================================================
-- Migration: 011_site_settings_why_choose.sql
-- Description: Adds why_choose_points jsonb column to site_settings table for
--              managing custom trust points on the consultation page.
-- =============================================================================

ALTER TABLE site_settings
ADD COLUMN IF NOT EXISTS why_choose_points JSONB NOT NULL DEFAULT '[]'::jsonb;
