
-- Process Steps table
CREATE TABLE public.process_steps (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  detail text,
  icon_name text DEFAULT 'Scan',
  step_number text DEFAULT '01',
  color text DEFAULT '#6366f1',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.process_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read process steps" ON public.process_steps
  FOR SELECT TO public USING (true);

CREATE POLICY "Admins can manage process steps" ON public.process_steps
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Why Us Reasons table
CREATE TABLE public.why_us_reasons (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  icon_name text DEFAULT 'TrendingUp',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.why_us_reasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read why us reasons" ON public.why_us_reasons
  FOR SELECT TO public USING (true);

CREATE POLICY "Admins can manage why us reasons" ON public.why_us_reasons
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- CTA content fields in site_settings
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS cta_badge_text text DEFAULT 'Limited Spots This Month',
  ADD COLUMN IF NOT EXISTS cta_heading text DEFAULT 'Ready to Own Delhi NCR?',
  ADD COLUMN IF NOT EXISTS cta_description text DEFAULT 'Get a comprehensive audit of your digital presence with actionable insights. No strings attached.',
  ADD COLUMN IF NOT EXISTS cta_button_text text DEFAULT 'Claim Your Free Audit',
  ADD COLUMN IF NOT EXISTS cta_secondary_button_text text DEFAULT 'Call +91 98765 43210',
  ADD COLUMN IF NOT EXISTS cta_footer_text text DEFAULT 'Trusted by 150+ brands · 97% retention rate · Response within 24 hours',
  ADD COLUMN IF NOT EXISTS hero_badge_text text DEFAULT '#1 Agency in Gurgaon',
  ADD COLUMN IF NOT EXISTS hero_subtitle text DEFAULT 'Gurgaon''s most aggressive data-driven digital marketing agency. We don''t just drive traffic; we build revenue engines.',
  ADD COLUMN IF NOT EXISTS contact_section_heading text DEFAULT 'Let''s Build Your Revenue Engine',
  ADD COLUMN IF NOT EXISTS contact_form_heading text DEFAULT 'Get Your Free Growth Audit',
  ADD COLUMN IF NOT EXISTS footer_description text DEFAULT 'Gurgaon''s most results-driven digital marketing agency. Turning clicks into customers and data into revenue since 2018.',
  ADD COLUMN IF NOT EXISTS metrics_heading text DEFAULT 'Numbers That Speak Louder Than Promises',
  ADD COLUMN IF NOT EXISTS metrics_subheading text DEFAULT 'Real results for real businesses across Delhi NCR',
  ADD COLUMN IF NOT EXISTS services_heading text DEFAULT 'Services Built for Revenue, Not Vanity',
  ADD COLUMN IF NOT EXISTS services_subheading text DEFAULT 'Every service is engineered to move your bottom line.',
  ADD COLUMN IF NOT EXISTS testimonials_heading text DEFAULT 'Trusted by Leaders Across Delhi NCR',
  ADD COLUMN IF NOT EXISTS faq_heading text DEFAULT 'Questions We Get Asked a Lot',
  ADD COLUMN IF NOT EXISTS process_heading text DEFAULT 'From Audit to Domination in 4 Steps',
  ADD COLUMN IF NOT EXISTS process_subheading text DEFAULT 'A battle-tested framework refined over 150+ successful campaigns',
  ADD COLUMN IF NOT EXISTS why_us_heading text DEFAULT 'Built Different. Proven Results.',
  ADD COLUMN IF NOT EXISTS why_us_subheading text DEFAULT 'Here''s why the smartest brands in Delhi NCR choose us',
  ADD COLUMN IF NOT EXISTS case_studies_heading text DEFAULT 'Results That Speak for Themselves',
  ADD COLUMN IF NOT EXISTS case_studies_subheading text DEFAULT 'Deep dives into how we''ve transformed businesses across Delhi NCR';

-- Nav links table for customizable navigation
CREATE TABLE public.nav_links (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label text NOT NULL,
  href text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.nav_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read nav links" ON public.nav_links
  FOR SELECT TO public USING (true);

CREATE POLICY "Admins can manage nav links" ON public.nav_links
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Footer links table
CREATE TABLE public.footer_links (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label text NOT NULL,
  url text NOT NULL DEFAULT '#',
  category text NOT NULL DEFAULT 'Company',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.footer_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read footer links" ON public.footer_links
  FOR SELECT TO public USING (true);

CREATE POLICY "Admins can manage footer links" ON public.footer_links
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
