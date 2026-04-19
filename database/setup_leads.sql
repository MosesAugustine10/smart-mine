-- Enable RLS and create standard policies for contact_submissions

-- 1. Create the table if it somehow didn't exist (though it should according to the landing page)
CREATE TABLE IF NOT EXISTS public.contact_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    company_type TEXT NOT NULL,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Turn on RLS
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- 3. Allow ANYONE (even guests) to INSERT their registration form
CREATE POLICY "Allow public form inserts" 
ON public.contact_submissions 
FOR INSERT 
WITH CHECK (true);

-- 4. Allow Authenticated Users (Super Admins) to READ the submissions
CREATE POLICY "Allow authenticated to read submissions" 
ON public.contact_submissions 
FOR SELECT 
USING (auth.role() = 'authenticated');
