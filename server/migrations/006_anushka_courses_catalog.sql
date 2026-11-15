-- =============================================================================
-- Migration: 006_anushka_courses_catalog.sql
-- Description: Schema updates for Anushka Yadav course catalog & bundle packages
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. EXTEND COURSES TABLE (Columns)
-- -----------------------------------------------------------------------------
ALTER TABLE courses
ADD COLUMN IF NOT EXISTS slug TEXT,
ADD COLUMN IF NOT EXISTS original_price INTEGER,
ADD COLUMN IF NOT EXISTS instructor TEXT DEFAULT 'Anushka Yadav',
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS is_package BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS category VARCHAR(40);

-- Generate initial slug for any existing rows that lack one
UPDATE courses
SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(title, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
WHERE slug IS NULL OR slug = '';

-- Fallback for any row whose title produced an empty slug
UPDATE courses
SET slug = 'course-' || SUBSTRING(id::text, 1, 8)
WHERE slug IS NULL OR slug = '';

-- Resolve any potential duplicate slugs among existing rows
UPDATE courses
SET slug = slug || '-' || SUBSTRING(id::text, 1, 8)
WHERE slug IN (
    SELECT slug FROM courses GROUP BY slug HAVING COUNT(*) > 1
);

-- Ensure slug unique index exists
CREATE UNIQUE INDEX IF NOT EXISTS idx_courses_slug ON courses (slug);

-- -----------------------------------------------------------------------------
-- 2. CATEGORY CONSTRAINT CLEANUP (Make free-text, max 40 chars)
-- -----------------------------------------------------------------------------
ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_category_check;

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'courses'::regclass 
          AND contype = 'c' 
          AND conname LIKE '%category%'
    ) LOOP
        EXECUTE 'ALTER TABLE courses DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
    END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- 3. LEVEL COLUMN NORMALIZATION & CONSTRAINT
-- -----------------------------------------------------------------------------
-- (a) Drop existing check constraints on level first
ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_level_check;

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'courses'::regclass 
          AND contype = 'c' 
          AND conname LIKE '%level%'
    ) LOOP
        EXECUTE 'ALTER TABLE courses DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
    END LOOP;
END $$;

-- (b) Make level nullable and drop any default BEFORE updating values to NULL
ALTER TABLE courses ALTER COLUMN level DROP NOT NULL;
ALTER TABLE courses ALTER COLUMN level DROP DEFAULT;

-- (c) Normalize existing rows' level values to allowed set ('Basic', 'Advanced', 'Basic to Advanced') or NULL
UPDATE courses
SET level = CASE
    WHEN level = 'Beginner' THEN 'Basic'
    WHEN level = 'Intermediate' THEN 'Basic to Advanced'
    WHEN level = 'Advanced' THEN 'Advanced'
    WHEN level = 'Basic' THEN 'Basic'
    WHEN level = 'Basic to Advanced' THEN 'Basic to Advanced'
    ELSE NULL
END;

-- (d) Add new check constraint allowing NULL or allowed values
ALTER TABLE courses ADD CONSTRAINT courses_level_check 
    CHECK (level IS NULL OR level IN ('Basic', 'Advanced', 'Basic to Advanced'));

-- Make duration nullable and drop default
ALTER TABLE courses ALTER COLUMN duration DROP NOT NULL;
ALTER TABLE courses ALTER COLUMN duration DROP DEFAULT;

-- -----------------------------------------------------------------------------
-- 4. CREATE COURSE_BUNDLE_ITEMS TABLE FOR PACKAGES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS course_bundle_items (
    bundle_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    position INT NOT NULL DEFAULT 0,
    PRIMARY KEY (bundle_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_bundle_items_bundle ON course_bundle_items (bundle_id, position);
CREATE INDEX IF NOT EXISTS idx_bundle_items_course ON course_bundle_items (course_id);

-- -----------------------------------------------------------------------------
-- 5. UPDATE ENROLLMENTS.SOURCE CHECK CONSTRAINT (Add 'free')
-- -----------------------------------------------------------------------------
ALTER TABLE enrollments DROP CONSTRAINT IF EXISTS enrollments_source_check;

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'enrollments'::regclass 
          AND contype = 'c' 
          AND conname LIKE '%source%'
    ) LOOP
        EXECUTE 'ALTER TABLE enrollments DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
    END LOOP;
END $$;

-- Normalize any unexpected source values if present
UPDATE enrollments
SET source = 'admin'
WHERE source NOT IN ('payment', 'admin', 'free');

ALTER TABLE enrollments ADD CONSTRAINT enrollments_source_check 
    CHECK (source IN ('payment', 'admin', 'free'));
