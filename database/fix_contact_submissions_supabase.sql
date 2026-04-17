-- ======================================================
-- SMART MINE: CONTACT SUBMISSIONS SCHEMA UPDATE
-- Run this in your Supabase SQL Editor
-- ======================================================

-- 1. Drop existing table if you want a fresh start
-- WARNING: This will delete existing submissions!
-- If you want to keep them, use the ALTER script below instead.
DROP TABLE IF EXISTS contact_submissions;

-- 2. Create the table with correct columns
CREATE TABLE IF NOT EXISTS contact_submissions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name     TEXT NOT NULL,
  phone_number  TEXT,
  company_type  TEXT,
  message       TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  status        TEXT DEFAULT 'pending'
);

-- 3. Enable Row Level Security
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies
-- Allow anyone to submit a contact form (Public Insert)
DROP POLICY IF EXISTS "Allow public insert" ON contact_submissions;
CREATE POLICY "Allow public insert" ON contact_submissions 
FOR INSERT WITH CHECK (true);

-- Allow authenticated users (System Owners/Admins) to read submissions
DROP POLICY IF EXISTS "Allow authenticated read" ON contact_submissions;
CREATE POLICY "Allow authenticated read" ON contact_submissions 
FOR SELECT USING (auth.role() = 'authenticated');
