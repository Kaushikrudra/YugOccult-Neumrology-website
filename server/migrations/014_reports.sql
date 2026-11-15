-- =============================================================================
-- Migration: 014_reports.sql
-- Description: Personalised Astrology & Numerology Reports CMS & Orders tables
-- Compatible with: PostgreSQL & Supabase
-- =============================================================================

-- 1. REPORTS TABLE (Catalog of client-prepared personalised reports)
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL CHECK (char_length(title) <= 120),
    tagline TEXT CHECK (tagline IS NULL OR char_length(tagline) <= 140),
    description TEXT CHECK (description IS NULL OR char_length(description) <= 2000),
    included JSONB NOT NULL DEFAULT '[]',
    price INT NOT NULL DEFAULT 0 CHECK (price >= 0),
    original_price INT CHECK (original_price IS NULL OR original_price >= price),
    cover_image_url TEXT,
    badge TEXT CHECK (badge IS NULL OR badge IN ('new', 'popular', 'trending', 'best_seller')),
    is_visible BOOLEAN NOT NULL DEFAULT true,
    position INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_reports_position ON reports (position ASC);
CREATE INDEX IF NOT EXISTS idx_reports_is_visible ON reports (is_visible);
CREATE INDEX IF NOT EXISTS idx_reports_slug ON reports (slug);

-- 2. REPORT_ORDERS TABLE (Buyer submissions & manual admin bookings)
CREATE TABLE IF NOT EXISTS report_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES reports(id) ON DELETE SET NULL,
    report_title TEXT NOT NULL,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    source TEXT NOT NULL DEFAULT 'online' CHECK (source IN ('online', 'manual')),
    name TEXT NOT NULL,
    email TEXT,
    whatsapp_number TEXT NOT NULL,
    gender TEXT CHECK (gender IS NULL OR gender IN ('male', 'female', 'other')),
    birth_date DATE,
    birth_time TEXT,
    birth_time_unknown BOOLEAN NOT NULL DEFAULT false,
    birth_place TEXT,
    notes TEXT,
    amount INT NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'paid', 'in_progress', 'delivered', 'cancelled')),
    delivered_pdf_path TEXT,
    delivered_file_name TEXT,
    delivered_at TIMESTAMPTZ,
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_report_orders_status_created ON report_orders (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_report_orders_report_id ON report_orders (report_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_report_orders_user_id ON report_orders (user_id, created_at DESC);

-- 3. ENABLE ROW LEVEL SECURITY (RLS) ON BOTH NEW TABLES
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_orders ENABLE ROW LEVEL SECURITY;

-- 4. REVOKE ALL DIRECT DATA API ACCESS FROM anon AND authenticated ROLES (DEFENSE IN DEPTH)
DO $$
DECLARE
    has_anon BOOLEAN;
    has_authenticated BOOLEAN;
BEGIN
    SELECT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') INTO has_anon;
    SELECT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') INTO has_authenticated;

    IF has_anon THEN
        REVOKE ALL ON public.reports FROM anon;
        REVOKE ALL ON public.report_orders FROM anon;
    END IF;

    IF has_authenticated THEN
        REVOKE ALL ON public.reports FROM authenticated;
        REVOKE ALL ON public.report_orders FROM authenticated;
    END IF;
END $$;
