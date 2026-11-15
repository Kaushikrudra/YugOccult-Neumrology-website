-- =============================================================================
-- Migration: 012_enquiries_pricing.sql
-- Description: Adds amount and question_count columns to enquiries table
--              for paid Kundli requests (₹499) and tiered questions (₹499, ₹999, ₹1299).
-- =============================================================================

ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS amount INTEGER;
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS question_count INTEGER DEFAULT 1;

-- Update enquiry_type check constraint safely to allow 'kundli' alongside legacy 'free_kundli'
ALTER TABLE enquiries DROP CONSTRAINT IF EXISTS enquiries_enquiry_type_check;
ALTER TABLE enquiries ADD CONSTRAINT enquiries_enquiry_type_check 
    CHECK (enquiry_type IN ('contact', 'free_kundli', 'kundli', 'ask_question'));
