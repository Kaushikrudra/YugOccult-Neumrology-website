-- =============================================================================
-- Migration: 002_admin_features.sql
-- Description: Adds is_read to enquiries and last_login_at to admin_users
-- Compatible with: PostgreSQL & Supabase
-- =============================================================================

-- 1. Add is_read to enquiries table if not present
ALTER TABLE enquiries 
ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT false;

-- Index for filtering unread enquiries quickly
CREATE INDEX IF NOT EXISTS idx_enquiries_is_read ON enquiries (is_read);

-- 2. Add last_login_at to admin_users table if not present
ALTER TABLE admin_users 
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
