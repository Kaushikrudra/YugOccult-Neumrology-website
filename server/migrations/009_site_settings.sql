-- =============================================================================
-- Migration: 009_site_settings.sql
-- Description: Creates site_settings singleton table and admin_action_logs table,
--              enables Row Level Security (RLS), and revokes anon/authenticated access.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. CREATE SITE_SETTINGS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone TEXT,
    whatsapp_number TEXT,
    email TEXT,
    address TEXT,
    timings TEXT,
    social_links JSONB NOT NULL DEFAULT '{}'::jsonb,
    show_stats BOOLEAN NOT NULL DEFAULT false,
    stats JSONB NOT NULL DEFAULT '[]'::jsonb,
    about_name TEXT,
    about_title TEXT,
    about_bio TEXT,
    about_expertise JSONB NOT NULL DEFAULT '[]'::jsonb,
    about_credentials JSONB NOT NULL DEFAULT '[]'::jsonb,
    about_photo_url TEXT,
    hero_badge TEXT,
    hero_headline TEXT,
    hero_subtitle TEXT,
    meta_title TEXT,
    meta_description TEXT,
    is_singleton BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enforce singleton constraints safely
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'site_settings_singleton_check') THEN
        ALTER TABLE site_settings ADD CONSTRAINT site_settings_singleton_check CHECK (is_singleton = true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'site_settings_singleton_unique') THEN
        ALTER TABLE site_settings ADD CONSTRAINT site_settings_singleton_unique UNIQUE (is_singleton);
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 2. CREATE ADMIN_ACTION_LOGS TABLE (If not already present)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_action_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_admin_action_logs_created_at ON admin_action_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_action_logs_entity ON admin_action_logs (entity);

-- -----------------------------------------------------------------------------
-- 3. ENABLE ROW LEVEL SECURITY AND REVOKE ACCESS
-- -----------------------------------------------------------------------------
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_action_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        EXECUTE 'REVOKE ALL ON site_settings FROM anon';
        EXECUTE 'REVOKE ALL ON admin_action_logs FROM anon';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        EXECUTE 'REVOKE ALL ON site_settings FROM authenticated';
        EXECUTE 'REVOKE ALL ON admin_action_logs FROM authenticated';
    END IF;
END $$;
