-- =============================================================================
-- Migration: 001_initial_schema.sql
-- Description: Initial schema for Vedic Astrology & Numerology Consultation & Courses
-- Compatible with: PostgreSQL & Supabase
-- =============================================================================

-- Enable pgcrypto extension for UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. COURSES TABLE
-- Stores astrology and numerology courses offered on the website
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    level VARCHAR(50) NOT NULL DEFAULT 'All Levels', -- e.g. Beginner, Intermediate, Advanced
    duration VARCHAR(100) NOT NULL,                  -- e.g. '8 Weeks', '12 Sessions'
    image_url TEXT,
    position INT NOT NULL DEFAULT 0,                 -- Ordering position on UI
    is_visible BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for ordering visible courses
CREATE INDEX IF NOT EXISTS idx_courses_visible_position ON courses (is_visible, position);

-- -----------------------------------------------------------------------------
-- 2. CONSULTATION_SETTINGS TABLE
-- Stores master configuration for 1-on-1 consultations (pricing & duration)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS consultation_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fee NUMERIC(10, 2) NOT NULL DEFAULT 2100.00,
    duration_minutes INT NOT NULL DEFAULT 60,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- -----------------------------------------------------------------------------
-- 3. TESTIMONIALS TABLE
-- Stores seeker testimonials and reviews
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS testimonials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    text TEXT NOT NULL,
    position INT NOT NULL DEFAULT 0,
    is_visible BOOLEAN NOT NULL DEFAULT true
);

-- Index for testimonials ordering
CREATE INDEX IF NOT EXISTS idx_testimonials_visible_position ON testimonials (is_visible, position);

-- -----------------------------------------------------------------------------
-- 4. ENQUIRIES TABLE
-- Stores contact enquiries and consultation requests submitted by visitors
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS enquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for querying recent enquiries
CREATE INDEX IF NOT EXISTS idx_enquiries_created_at ON enquiries (created_at DESC);

-- -----------------------------------------------------------------------------
-- 5. ORDERS TABLE
-- Stores orders for course purchases and paid consultations (Cashfree integration ready)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL,                       -- e.g. 'course', 'consultation'
    reference_id VARCHAR(255),                       -- course UUID or consultation reference
    amount NUMERIC(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',   -- 'PENDING', 'PAID', 'FAILED', 'REFUNDED'
    cashfree_order_id VARCHAR(255),
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for searching orders
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_cashfree_id ON orders (cashfree_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders (customer_email);

-- -----------------------------------------------------------------------------
-- 6. ADMIN_USERS TABLE
-- Stores administrative credentials for portal access
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- =============================================================================
-- OPTIONAL INITIAL SEED DATA
-- (Can be executed to populate initial settings and sample courses)
-- =============================================================================

INSERT INTO consultation_settings (fee, duration_minutes)
VALUES (3000.00, 45)
ON CONFLICT DO NOTHING;

INSERT INTO courses (title, description, price, level, duration, position, is_visible)
VALUES 
('Vedic Astrology Foundation', 'Master the 12 houses, 9 planetary grahas, and 12 rashis to read birth charts.', 4999.00, 'Beginner', '8 Weeks', 1, true),
('Professional Numerology & Name Correction', 'Learn Chaldean and Pythagorean numerology and name vibration tuning.', 5999.00, 'Intermediate', '6 Weeks', 2, true),
('Advanced Kundali & Prashna Jyotish', 'Comprehensive divisional charts (D9, D10) and Prashna Kundali horary science.', 9999.00, 'Advanced', '12 Weeks', 3, true),
('Vedic Remedial Shastra & Gemstones', 'Practical classical remedies: gemstone science, mantras, and lifestyle alignment.', 3999.00, 'All Levels', '4 Weeks', 4, true)
ON CONFLICT DO NOTHING;
