-- =============================================================================
-- Migration: 016_cashfree_payments.sql
-- Description: Adds Cashfree payment columns to orders, consultation_bookings,
--              ebook_purchases, and report_orders enhancements.
-- =============================================================================

-- 1. ENHANCE ORDERS TABLE
-- Add missing columns for Cashfree integration and payment auditing
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_session_id TEXT,
ADD COLUMN IF NOT EXISTS cashfree_payment_id TEXT,
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS failure_reason TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
ADD COLUMN IF NOT EXISTS reference_title TEXT;

-- Normalize existing orders type and status to lowercase if any exist
UPDATE orders SET type = LOWER(type) WHERE type IS NOT NULL;
UPDATE orders SET status = LOWER(status) WHERE status IS NOT NULL;

-- Safely replace orders_type_check to allow: 'course', 'consultation', 'ebook', 'report'
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_type_check;
ALTER TABLE orders ADD CONSTRAINT orders_type_check CHECK (type IN ('course', 'consultation', 'ebook', 'report'));

-- Unique index on cashfree_order_id (allowing NULLs)
CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_cashfree_order_id ON orders (cashfree_order_id) WHERE cashfree_order_id IS NOT NULL;

-- 2. CONSULTATION BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS consultation_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID UNIQUE NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    service_title TEXT,
    preferred_date DATE NOT NULL,
    preferred_slot TEXT NOT NULL CHECK (preferred_slot IN ('Morning', 'Afternoon', 'Evening')),
    birth_date DATE,
    birth_time TEXT,
    birth_time_unknown BOOLEAN NOT NULL DEFAULT false,
    birth_place TEXT,
    topic TEXT,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'confirmed', 'completed', 'cancelled')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_consultation_bookings_order_id ON consultation_bookings (order_id);
CREATE INDEX IF NOT EXISTS idx_consultation_bookings_user_id ON consultation_bookings (user_id);
CREATE INDEX IF NOT EXISTS idx_consultation_bookings_status_created ON consultation_bookings (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_consultation_bookings_pref_date ON consultation_bookings (preferred_date);

-- 3. EBOOK PURCHASES TABLE
CREATE TABLE IF NOT EXISTS ebook_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ebook_id UUID NOT NULL REFERENCES ebooks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_ebook_purchases_user_ebook UNIQUE (ebook_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_ebook_purchases_user_id ON ebook_purchases (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ebook_purchases_ebook_id ON ebook_purchases (ebook_id);
CREATE INDEX IF NOT EXISTS idx_ebook_purchases_order_id ON ebook_purchases (order_id);

-- 4. ENHANCE REPORT_ORDERS TABLE
ALTER TABLE report_orders
ADD COLUMN IF NOT EXISTS details TEXT,
ADD COLUMN IF NOT EXISTS consent BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS consent_at TIMESTAMPTZ;

-- 5. ENABLE ROW LEVEL SECURITY (RLS) ON NEW TABLES (DEFENSE IN DEPTH)
ALTER TABLE public.consultation_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ebook_purchases ENABLE ROW LEVEL SECURITY;

-- 6. REVOKE DIRECT API ACCESS FOR anon AND authenticated ROLES IF THEY EXIST
DO $$
DECLARE
    has_anon BOOLEAN;
    has_authenticated BOOLEAN;
BEGIN
    SELECT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') INTO has_anon;
    SELECT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') INTO has_authenticated;

    IF has_anon THEN
        REVOKE ALL ON public.consultation_bookings FROM anon;
        REVOKE ALL ON public.ebook_purchases FROM anon;
    END IF;

    IF has_authenticated THEN
        REVOKE ALL ON public.consultation_bookings FROM authenticated;
        REVOKE ALL ON public.ebook_purchases FROM authenticated;
    END IF;
END $$;
