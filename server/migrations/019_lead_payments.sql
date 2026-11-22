-- =============================================================================
-- Migration: 019_lead_payments.sql
-- Description: Enables Cashfree payment integration for Kundli Requests (₹499)
--              and Ask Question submissions (₹699, ₹999, ₹1599).
-- =============================================================================

-- 1. Relax/extend orders_type_check to allow 'kundli' and 'ask_question'
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_type_check;
ALTER TABLE orders ADD CONSTRAINT orders_type_check 
    CHECK (type IN ('course', 'consultation', 'ebook', 'report', 'kundli', 'ask_question'));

-- 2. Add order_id and payment_status to enquiries table
ALTER TABLE enquiries 
    ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pending' 
        CHECK (payment_status IN ('pending', 'paid', 'failed'));

-- 3. Create index for fast order lookup in enquiries
CREATE INDEX IF NOT EXISTS idx_enquiries_order_id ON enquiries (order_id) WHERE order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_enquiries_payment_status ON enquiries (payment_status);
