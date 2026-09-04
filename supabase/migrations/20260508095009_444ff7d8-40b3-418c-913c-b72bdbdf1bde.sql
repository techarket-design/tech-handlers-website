
-- ============ ENUMS ============
DO $$ BEGIN
  CREATE TYPE public.customer_status AS ENUM ('active','paused','churned','prospect');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.invoice_status AS ENUM ('draft','sent','partial','paid','overdue','void');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_method AS ENUM ('bank_transfer','upi','cash','card','cheque','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.allocation_type AS ENUM ('revenue_share','ad_spend','hours','fixed_payout');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ CUSTOMERS ============
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  contact_name text,
  email text,
  phone text,
  website text,
  address text,
  tax_id text,
  currency text NOT NULL DEFAULT 'INR',
  status public.customer_status NOT NULL DEFAULT 'active',
  onboarded_at date,
  monthly_retainer numeric(14,2) DEFAULT 0,
  monthly_ad_budget numeric(14,2) DEFAULT 0,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers module manage" ON public.customers FOR ALL TO authenticated
  USING (public.has_permission(auth.uid(),'customers')) WITH CHECK (public.has_permission(auth.uid(),'customers'));
CREATE POLICY "Admins delete customers" ON public.customers FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_customers_updated BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ INVOICES ============
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  invoice_number text NOT NULL UNIQUE,
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  status public.invoice_status NOT NULL DEFAULT 'draft',
  subtotal numeric(14,2) NOT NULL DEFAULT 0,
  tax_percent numeric(5,2) NOT NULL DEFAULT 0,
  tax_amount numeric(14,2) NOT NULL DEFAULT 0,
  discount_amount numeric(14,2) NOT NULL DEFAULT 0,
  total numeric(14,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'INR',
  notes text,
  terms text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_invoices_customer_status ON public.invoices(customer_id,status);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Billing manage invoices" ON public.invoices FOR ALL TO authenticated
  USING (public.has_permission(auth.uid(),'billing')) WITH CHECK (public.has_permission(auth.uid(),'billing'));
CREATE TRIGGER trg_invoices_updated BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ INVOICE LINE ITEMS ============
CREATE TABLE public.invoice_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity numeric(14,2) NOT NULL DEFAULT 1,
  unit_price numeric(14,2) NOT NULL DEFAULT 0,
  amount numeric(14,2) NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_line_items_invoice ON public.invoice_line_items(invoice_id);
ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Billing manage line items" ON public.invoice_line_items FOR ALL TO authenticated
  USING (public.has_permission(auth.uid(),'billing')) WITH CHECK (public.has_permission(auth.uid(),'billing'));

-- ============ PAYMENTS ============
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  amount numeric(14,2) NOT NULL,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  method public.payment_method NOT NULL DEFAULT 'bank_transfer',
  reference_no text,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_payments_invoice ON public.payments(invoice_id);
CREATE INDEX idx_payments_customer ON public.payments(customer_id);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Billing manage payments" ON public.payments FOR ALL TO authenticated
  USING (public.has_permission(auth.uid(),'billing')) WITH CHECK (public.has_permission(auth.uid(),'billing'));

-- ============ CUSTOMER TEAM ALLOCATIONS ============
CREATE TABLE public.customer_team_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  allocation_type public.allocation_type NOT NULL,
  value numeric(14,2) NOT NULL DEFAULT 0,
  effective_month date NOT NULL DEFAULT date_trunc('month', CURRENT_DATE),
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (customer_id, user_id, allocation_type, effective_month)
);
CREATE INDEX idx_alloc_user_month ON public.customer_team_allocations(user_id, effective_month);
ALTER TABLE public.customer_team_allocations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers module manage allocations" ON public.customer_team_allocations FOR ALL TO authenticated
  USING (public.has_permission(auth.uid(),'customers')) WITH CHECK (public.has_permission(auth.uid(),'customers'));
CREATE TRIGGER trg_alloc_updated BEFORE UPDATE ON public.customer_team_allocations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ TASK LINKS ============
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS lead_id uuid,
  ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_lead ON public.tasks(lead_id);
CREATE INDEX IF NOT EXISTS idx_tasks_customer ON public.tasks(customer_id);

-- ============ INVOICE NUMBER HELPER ============
CREATE OR REPLACE FUNCTION public.next_invoice_number()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  yr text := to_char(CURRENT_DATE,'YYYY');
  n integer;
BEGIN
  SELECT COALESCE(MAX(CAST(split_part(invoice_number,'-',3) AS integer)),0) + 1
    INTO n FROM public.invoices WHERE invoice_number LIKE 'INV-'||yr||'-%';
  RETURN 'INV-'||yr||'-'||lpad(n::text,4,'0');
END$$;
