-- =============================================================================
-- Migration: 018_consultation_time_slots.sql
-- Description: Allow 1-hour consultation time slots (12-5 PM, 8-10 PM)
-- Compatible with: PostgreSQL & Supabase
-- =============================================================================

-- Drop the previous CHECK constraint that only allowed ('Morning', 'Afternoon', 'Evening')
ALTER TABLE consultation_bookings 
  DROP CONSTRAINT IF EXISTS consultation_bookings_preferred_slot_check;

-- Add a flexible constraint ensuring non-empty slot string
ALTER TABLE consultation_bookings 
  ADD CONSTRAINT consultation_bookings_preferred_slot_check 
  CHECK (char_length(trim(preferred_slot)) > 0);
