CREATE TABLE IF NOT EXISTS public.system_flags ( 
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
  flag_name TEXT UNIQUE NOT NULL, 
  is_enabled BOOLEAN DEFAULT false, 
  description TEXT, 
  updated_at TIMESTAMP DEFAULT NOW() 
); 

INSERT INTO public.system_flags (flag_name, is_enabled, description)  
VALUES ('show_consultant_pricing', false, 'Show Consultant pricing card on landing page')
ON CONFLICT (flag_name) DO NOTHING; 

CREATE TABLE IF NOT EXISTS public.company_subscriptions ( 
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE, 
  subscription_type TEXT NOT NULL, -- 'medium_scale', 'contractor', 'consultant', 'small_scale'
  billing_cycle TEXT NOT NULL, -- 'monthly', 'quarterly', 'annually' 
  amount DECIMAL(12,2) NOT NULL, 
  currency TEXT DEFAULT 'TZS', 
  enabled_modules JSONB NOT NULL, 
  start_date DATE NOT NULL, 
  next_billing_date DATE NOT NULL, 
  trial_ends_at TIMESTAMP, 
  status TEXT DEFAULT 'trial', -- 'trial', 'active', 'past_due', 'cancelled' 
  created_at TIMESTAMP DEFAULT NOW(), 
  updated_at TIMESTAMP DEFAULT NOW() 
); 

CREATE TABLE IF NOT EXISTS public.invoices ( 
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE, 
  subscription_id UUID REFERENCES company_subscriptions(id) ON DELETE CASCADE, 
  selcom_invoice_id TEXT UNIQUE, 
  invoice_number TEXT UNIQUE, 
  amount DECIMAL(12,2) NOT NULL, 
  currency TEXT DEFAULT 'TZS', 
  description TEXT, 
  status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'failed', 'expired', 'cancelled' 
  payment_link TEXT, 
  paid_at TIMESTAMP, 
  created_at TIMESTAMP DEFAULT NOW(), 
  updated_at TIMESTAMP DEFAULT NOW() 
);
