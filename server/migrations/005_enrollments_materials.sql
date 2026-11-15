-- =============================================================================
-- Migration: 005_enrollments_materials.sql
-- Description: Course enrollments, secure materials, and access tracking logs
-- Compatible with: PostgreSQL & Supabase
-- =============================================================================

-- 1. ENROLLMENTS TABLE
CREATE TABLE IF NOT EXISTS enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
    source TEXT NOT NULL CHECK (source IN ('payment', 'admin')),
    granted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    granted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE (user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON enrollments (user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments (course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments (status);

-- 2. COURSE_MATERIALS TABLE
CREATE TABLE IF NOT EXISTS course_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('file', 'video_link', 'link')),
    storage_path TEXT,
    url TEXT,
    file_name TEXT,
    size_bytes INT,
    position INT NOT NULL DEFAULT 0,
    is_visible BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_course_materials_course_position ON course_materials (course_id, position);
CREATE INDEX IF NOT EXISTS idx_course_materials_visibility ON course_materials (course_id, is_visible);

-- 3. ACCESS_LOGS TABLE
CREATE TABLE IF NOT EXISTS access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    material_id UUID REFERENCES course_materials(id) ON DELETE SET NULL,
    action TEXT NOT NULL CHECK (action IN ('view', 'download')),
    ip TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_access_logs_user_created ON access_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_access_logs_course_created ON access_logs (course_id, created_at DESC);
