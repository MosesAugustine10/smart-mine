-- ── PART 1: Ongeza columns kwenye invoices table iliyopo ──────────────────────
-- Run hii kwenye Supabase SQL Editor

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'selcom';
-- Values: 'selcom', 'manual_mpesa', 'manual_tigo', 'manual_airtel'

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS manual_transaction_id TEXT;

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS verified_by UUID;
-- Note: references auth.users — Supabase managed

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP;

-- ── RLS Policies (ensure super admin can do everything) ────────────────────────
-- Tumia policy zilizomo kutoka subscription_selcom_schema.sql
-- Status 'pending_verification' na 'rejected' zinapokelewa bila ALTER nyingine
