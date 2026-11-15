-- =============================================================================
-- Migration: 010_lead_capture_enquiries.sql
-- Description: Extends enquiries table with lead-capture fields for Free Kundli
--              and Ask the Astrologer requests.
-- =============================================================================

-- 1. Add lead capture columns
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS enquiry_type TEXT NOT NULL DEFAULT 'contact';
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS birth_time TEXT;
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS birth_time_unknown BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS birth_place TEXT;
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS question TEXT;
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS consent BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS consent_at TIMESTAMPTZ;
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS lead_status TEXT NOT NULL DEFAULT 'new';

-- 2. Relax NOT NULL constraints on legacy contact form fields so lead-capture forms can validate separately in Zod
ALTER TABLE enquiries ALTER COLUMN email DROP NOT NULL;
ALTER TABLE enquiries ALTER COLUMN subject DROP NOT NULL;
ALTER TABLE enquiries ALTER COLUMN message DROP NOT NULL;
ALTER TABLE enquiries ALTER COLUMN phone DROP NOT NULL;

-- 3. Enforce CHECK constraints safely
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'enquiries_enquiry_type_check') THEN
        ALTER TABLE enquiries ADD CONSTRAINT enquiries_enquiry_type_check 
            CHECK (enquiry_type IN ('contact', 'free_kundli', 'ask_question'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'enquiries_gender_check') THEN
        ALTER TABLE enquiries ADD CONSTRAINT enquiries_gender_check 
            CHECK (gender IS NULL OR gender IN ('male', 'female', 'other'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'enquiries_lead_status_check') THEN
        ALTER TABLE enquiries ADD CONSTRAINT enquiries_lead_status_check 
            CHECK (lead_status IN ('new', 'contacted', 'done'));
    END IF;
END $$;

-- 4. Normalize any existing rows
UPDATE enquiries SET enquiry_type = 'contact' WHERE enquiry_type IS NULL;
UPDATE enquiries SET lead_status = 'new' WHERE lead_status IS NULL;

-- 5. Indexes for fast lead filtering and sorting
CREATE INDEX IF NOT EXISTS idx_enquiries_type_created ON enquiries (enquiry_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enquiries_lead_status ON enquiries (lead_status, created_at DESC);
