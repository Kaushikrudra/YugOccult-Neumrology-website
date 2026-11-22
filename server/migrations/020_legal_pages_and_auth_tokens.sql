-- =============================================================================
-- Migration: 020_legal_pages_and_auth_tokens.sql
-- Description: Creates site_pages, password_reset_tokens, and email_logs tables
--              with RLS, role revokes, and initial legal pages seed data.
-- =============================================================================

-- 1. SITE_PAGES TABLE
CREATE TABLE IF NOT EXISTS site_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL CHECK (slug IN ('terms', 'privacy-policy', 'refund-policy')),
    title VARCHAR(120) NOT NULL,
    body VARCHAR(20000) NOT NULL,
    reviewed BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. PASSWORD_RESET_TOKENS TABLE
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_hash ON password_reset_tokens (token_hash);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens (user_id);

-- 3. EMAIL_LOGS TABLE
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    to_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    template TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'skipped')),
    error VARCHAR(300),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. ROW LEVEL SECURITY (RLS) & ACCESS RESTRICTIONS
ALTER TABLE site_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE ALL ON site_pages FROM anon;
        REVOKE ALL ON password_reset_tokens FROM anon;
        REVOKE ALL ON email_logs FROM anon;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        REVOKE ALL ON site_pages FROM authenticated;
        REVOKE ALL ON password_reset_tokens FROM authenticated;
        REVOKE ALL ON email_logs FROM authenticated;
    END IF;
END $$;

-- 5. INITIAL LEGAL PAGES SEED (INSERT ONLY - ON CONFLICT DO NOTHING)
INSERT INTO site_pages (slug, title, body, reviewed)
VALUES
(
    'terms',
    'Terms & Conditions',
    '## About these terms
By using this website and buying from it, you agree to these terms. {{brand}} offers online courses, ebooks, personalised reports and consultations in astrology, numerology and tarot.

## Nature of our services
- Our services offer guidance and perspective. They are not a substitute for professional medical, legal or financial advice.
- We do not guarantee any particular outcome or result.

## Accounts
- Please give accurate details when you register or place an order.
- You are responsible for keeping your password safe. One account is for one person.

## Courses and downloads
- Course access, ebooks and reports are for your personal use only. Please do not copy, resell or share them with others.
- Your lesson views and downloads are recorded for security.

## Consultations and reports
- Consultations and reports are prepared from the details you give us, so accurate details help us serve you better.
- Any delivery or scheduling time we mention is an estimate, not a guarantee.

## Prices and payments
- Prices are shown in Indian rupees. Payments are handled by our payment partner, and we do not store your card details.

## Intellectual property
All content on this website belongs to {{brand}} or its licensors.

## Changes to these terms
We may update these terms from time to time. The updated version applies from the date it is published on this page.

## Contact us
- Email: {{email}}
- Phone: {{phone}}
- Address: {{address}}',
    false
),
(
    'privacy-policy',
    'Privacy Policy',
    '## What this policy covers
This policy explains what information {{brand}} collects through this website, why we collect it and how we look after it.

## Information we collect
- Account details: your name, email address, phone number and password (stored in a protected form).
- Order details: what you bought, the amount and the payment status. We do not store your card or UPI details.
- Details you submit: birth details, questions, messages and enquiries you send to us.
- Usage records: lesson views and downloads, for security and support.
- Cookies: we use an essential cookie to keep you signed in.

## How we use it
- To provide your courses, ebooks, reports and consultations.
- To reply to your messages and support requests.
- To keep the website and your account secure.

## Sharing
We do not sell your information. We share it only with service providers that help us run the website, such as payment, hosting, database and email providers, and only as needed for those services or where the law requires.

## Your choices
You can ask us to show, correct or delete your information by writing to us at {{email}}.

## Security
We use access controls and protected storage to look after your information. No system is completely secure, so please keep your password private.

## Changes to this policy
We may update this policy from time to time. The updated version applies from the date it is published on this page.

## Contact us
- Email: {{email}}
- Phone: {{phone}}
- Address: {{address}}',
    false
),
(
    'refund-policy',
    'Refund, Cancellation & Delivery Policy',
    '## Courses and ebooks
- Access is given in your account after your payment is confirmed.
- These are digital products and cannot be returned, so payments are generally not refundable once access has been given.
- If you were charged but did not receive access, or you were charged twice, please write to us at {{email}} and we will look into it and put it right.

## Personalised reports
- Reports are prepared individually from the details you give us.
- Once preparation has started or the report has been delivered, the payment is generally not refundable.
- If you placed an order by mistake, please contact us as soon as possible, before preparation starts.

## Consultations
- Please contact us in advance if you need to reschedule a session.
- A consultation that has taken place is not refundable.

## Refunds that are approved
Approved refunds are made to the original payment method. The time your bank takes to show the amount may vary.

## How to reach us
- Email: {{email}}
- Phone: {{phone}}
- Address: {{address}}',
    false
)
ON CONFLICT (slug) DO NOTHING;
