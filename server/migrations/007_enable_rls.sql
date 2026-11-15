-- =============================================================================
-- Migration: 007_enable_rls.sql
-- Description: Enables Row Level Security (RLS) on all public tables and revokes
--              public Data API access from anon and authenticated roles.
--
-- NOTE FOR FUTURE MIGRATIONS:
-- Future tables ko bhi RLS enable karni hai (naya migration me ENABLE ROW LEVEL SECURITY lagao).
-- =============================================================================

DO $$
DECLARE
    t RECORD;
    has_anon BOOLEAN;
    has_authenticated BOOLEAN;
BEGIN
    -- 1. Enable Row Level Security on ALL existing tables in public schema
    FOR t IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
    END LOOP;

    -- 2. Detect presence of Supabase roles (anon / authenticated)
    SELECT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') INTO has_anon;
    SELECT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') INTO has_authenticated;

    -- 3. Defense in depth: Revoke all direct API access for 'anon' role if it exists
    IF has_anon THEN
        EXECUTE 'REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon';
        EXECUTE 'REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon';
        EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon';
        EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon';
    END IF;

    -- 4. Defense in depth: Revoke all direct API access for 'authenticated' role if it exists
    IF has_authenticated THEN
        EXECUTE 'REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated';
        EXECUTE 'REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM authenticated';
        EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM authenticated';
        EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM authenticated';
    END IF;
END $$;
