-- Tech Handlers — clean PostgreSQL schema (no Supabase RLS).
-- Run on a fresh database: psql -U techhandlers -d techhandlers -f schema.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;     -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================================
-- AUTH (replaces auth.users / user_roles / user_permissions)
-- =====================================================================
CREATE TABLE IF NOT EXISTS app_users (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email           text UNIQUE NOT NULL,
  encrypted_password text NOT NULL,         -- bcrypt hash (Supabase-compatible)
  name            text,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

DO $$ BEGIN
  CREATE TYPE app_role AS ENUM ('admin','team');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS user_roles (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  role       app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE TABLE IF NOT EXISTS user_permissions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  module     text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module)
);

-- =====================================================================
-- CMS / SITE
-- =====================================================================
CREATE TABLE IF NOT EXISTS site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_name text NOT NULL DEFAULT 'Tech Handlers',
  tagline text, contact_email text, contact_phone text, contact_address text,
  whatsapp_number text,
  social_facebook text, social_instagram text, social_linkedin text,
  social_twitter text, social_youtube text,
  logo_url text, favicon_url text,
  cta_badge_text text, cta_heading text, cta_description text,
  cta_button_text text, cta_secondary_button_text text, cta_footer_text text,
  hero_badge_text text, hero_subtitle text,
  contact_section_heading text, contact_form_heading text,
  footer_description text,
  metrics_heading text, metrics_subheading text,
  services_heading text, services_subheading text,
  testimonials_heading text, faq_heading text,
  process_heading text, process_subheading text,
  why_us_heading text, why_us_subheading text,
  case_studies_heading text, case_studies_subheading text,
  funnel_heading text, funnel_subtitle text,
  funnel_traditional_title text, funnel_traditional_description text,
  funnel_revenue_title text, funnel_revenue_description text,
  platform_expertise_heading text,
  google_maps_embed text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hero_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL, subtitle text,
  background_image_url text,
  cta_text text DEFAULT 'Get Your Free Audit',
  cta_link text DEFAULT '#contact',
  graphic_type text DEFAULT 'revenue',
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, slug text NOT NULL UNIQUE,
  short_description text, full_description text,
  icon_name text DEFAULT 'Settings',
  features jsonb DEFAULT '[]'::jsonb,
  meta_title text, meta_description text, image_url text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS portfolio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL, slug text NOT NULL UNIQUE,
  client_name text, category text, industry text, duration text,
  short_description text, full_description text,
  hero_image_url text, image_url text,
  service_id uuid REFERENCES services(id) ON DELETE SET NULL,
  gallery jsonb NOT NULL DEFAULT '[]'::jsonb,
  body_blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  results jsonb DEFAULT '[]'::jsonb,
  technologies text[] DEFAULT '{}',
  testimonial_quote text,
  meta_title text, meta_description text,
  is_featured boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, logo_url text, website_url text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, role text, company text,
  content text NOT NULL, rating int DEFAULT 5,
  avatar_url text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL, answer text NOT NULL,
  category text DEFAULT 'general',
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL, value text NOT NULL,
  suffix text DEFAULT '', icon_name text DEFAULT 'TrendingUp',
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS process_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL, description text NOT NULL, detail text,
  step_number text DEFAULT '01', icon_name text DEFAULT 'Scan',
  color text DEFAULT '#6366f1',
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS why_us_reasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL, description text NOT NULL,
  icon_name text DEFAULT 'TrendingUp',
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nav_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL, href text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS footer_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL, url text NOT NULL DEFAULT '#',
  category text NOT NULL DEFAULT 'Company',
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS revenue_engine_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_key text NOT NULL, label text NOT NULL,
  title text NOT NULL, description text NOT NULL, stat text NOT NULL,
  icon_name text DEFAULT 'Users', color text NOT NULL DEFAULT '#4A7BF7',
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS homepage_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text NOT NULL UNIQUE, label text NOT NULL,
  is_visible boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS platform_logos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, logo_url text, website_url text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL, slug text NOT NULL UNIQUE,
  excerpt text, content text,
  featured_image_url text,
  author_name text DEFAULT 'Tech Handlers Team',
  category text, tags text[] DEFAULT '{}',
  meta_title text, meta_description text,
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tracking_scripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, script_type text NOT NULL, script_id text,
  head_code text, body_code text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =====================================================================
-- CRM
-- =====================================================================
DO $$ BEGIN
  CREATE TYPE lead_status AS ENUM ('new','contacted','qualified','proposal','won','lost');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, email text, phone text,
  company text, website_url text, designation text,
  budget text, service_interest text, message text, requirement text,
  source text DEFAULT 'website',
  status lead_status NOT NULL DEFAULT 'new',
  priority text DEFAULT 'warm', lead_label text,
  assigned_to text,
  follow_up_date timestamptz, last_contacted_at timestamptz,
  reminder_sent boolean DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);

CREATE TABLE IF NOT EXISTS lead_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  activity_type text NOT NULL DEFAULT 'note',
  description text, file_url text,
  scheduled_at timestamptz, completed_at timestamptz,
  is_completed boolean DEFAULT false,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =====================================================================
-- CUSTOMERS / BILLING
-- =====================================================================
DO $$ BEGIN
  CREATE TYPE customer_status AS ENUM ('active','paused','churned','prospect');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE invoice_status AS ENUM ('draft','sent','paid','overdue','void');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('bank_transfer','upi','cash','card','cheque','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  contact_name text, email text, phone text, website text,
  address text, tax_id text,
  currency text NOT NULL DEFAULT 'INR',
  monthly_retainer numeric DEFAULT 0,
  monthly_ad_budget numeric DEFAULT 0,
  status customer_status NOT NULL DEFAULT 'active',
  onboarded_at date, notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  invoice_number text NOT NULL UNIQUE,
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  status invoice_status NOT NULL DEFAULT 'draft',
  tax_percent numeric NOT NULL DEFAULT 0,
  subtotal numeric NOT NULL DEFAULT 0,
  tax_amount numeric NOT NULL DEFAULT 0,
  discount_amount numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'INR',
  notes text, terms text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoice_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  amount numeric NOT NULL DEFAULT 0,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL,
  amount numeric NOT NULL,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  method payment_method NOT NULL DEFAULT 'bank_transfer',
  reference_no text, notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Invoice numbering (replaces Supabase function)
CREATE OR REPLACE FUNCTION next_invoice_number() RETURNS text AS $$
DECLARE yr text := to_char(CURRENT_DATE,'YYYY'); n int;
BEGIN
  SELECT COALESCE(MAX(CAST(split_part(invoice_number,'-',3) AS int)),0) + 1
    INTO n FROM invoices WHERE invoice_number LIKE 'INV-'||yr||'-%';
  RETURN 'INV-'||yr||'-'||lpad(n::text,4,'0');
END $$ LANGUAGE plpgsql;

-- =====================================================================
-- TASKS
-- =====================================================================
DO $$ BEGIN
  CREATE TYPE task_status AS ENUM ('todo','in_progress','review','done','blocked');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE task_priority AS ENUM ('low','medium','high','urgent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS task_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, description text, client_name text,
  color text NOT NULL DEFAULT '#6366f1',
  is_archived boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL, description text,
  project_id uuid REFERENCES task_projects(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  status task_status NOT NULL DEFAULT 'todo',
  priority task_priority NOT NULL DEFAULT 'medium',
  due_date timestamptz, completed_at timestamptz,
  sort_order int NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS task_assignees (
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (task_id, user_id)
);

CREATE TABLE IF NOT EXISTS task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  content text NOT NULL,
  mentioned_users uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS task_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid REFERENCES app_users(id) ON DELETE SET NULL,
  action text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =====================================================================
-- WORKSPACE / NOTIFICATIONS
-- =====================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES app_users(id) ON DELETE SET NULL,
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  type text NOT NULL, title text NOT NULL, body text, link text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS personal_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Untitled', content text,
  color text NOT NULL DEFAULT 'yellow',
  is_pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS personal_todos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  title text NOT NULL, notes text,
  priority text NOT NULL DEFAULT 'medium',
  due_date date, is_done boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS personal_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  title text NOT NULL, url text NOT NULL,
  category text NOT NULL DEFAULT 'general', icon text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customer_team_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  allocation_type text NOT NULL,
  value numeric NOT NULL DEFAULT 0,
  effective_month date NOT NULL DEFAULT date_trunc('month', CURRENT_DATE)::date,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- updated_at triggers
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$ LANGUAGE plpgsql;

DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'app_users','site_settings','hero_slides','services','portfolio',
    'blog_posts','tracking_scripts','leads','customers','invoices',
    'task_projects','tasks','personal_notes','personal_todos','customer_team_allocations'
  ]) LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%1$s_updated_at ON %1$s', t);
    EXECUTE format('CREATE TRIGGER trg_%1$s_updated_at BEFORE UPDATE ON %1$s
                    FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t);
  END LOOP;
END $$;