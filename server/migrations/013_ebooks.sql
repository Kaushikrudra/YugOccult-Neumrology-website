-- =============================================================================
-- Migration: 013_ebooks.sql
-- Description: Ebooks CMS and download tracking tables with strict RLS
-- Compatible with: PostgreSQL & Supabase
-- =============================================================================

-- 1. EBOOKS TABLE
CREATE TABLE IF NOT EXISTS ebooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL CHECK (char_length(title) <= 150),
    description TEXT CHECK (description IS NULL OR char_length(description) <= 1000),
    cover_image_url TEXT,
    storage_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    size_bytes INT NOT NULL,
    price INT NOT NULL DEFAULT 0 CHECK (price >= 0),
    position INT NOT NULL,
    is_visible BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_ebooks_position ON ebooks (position ASC);
CREATE INDEX IF NOT EXISTS idx_ebooks_is_visible ON ebooks (is_visible);

-- 2. EBOOK_DOWNLOADS TABLE
CREATE TABLE IF NOT EXISTS ebook_downloads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ebook_id UUID NOT NULL REFERENCES ebooks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ip TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_ebook_downloads_ebook_created ON ebook_downloads (ebook_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ebook_downloads_user_created ON ebook_downloads (user_id, created_at DESC);

-- 3. ENABLE ROW LEVEL SECURITY (RLS) ON BOTH NEW TABLES
ALTER TABLE public.ebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ebook_downloads ENABLE ROW LEVEL SECURITY;

-- 4. REVOKE ALL DIRECT DATA API ACCESS FROM anon AND authenticated ROLES (DEFENSE IN DEPTH)
DO $$
DECLARE
    has_anon BOOLEAN;
    has_authenticated BOOLEAN;
BEGIN
    SELECT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') INTO has_anon;
    SELECT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') INTO has_authenticated;

    IF has_anon THEN
        REVOKE ALL ON public.ebooks FROM anon;
        REVOKE ALL ON public.ebook_downloads FROM anon;
    END IF;

    IF has_authenticated THEN
        REVOKE ALL ON public.ebooks FROM authenticated;
        REVOKE ALL ON public.ebook_downloads FROM authenticated;
    END IF;
END $$;
