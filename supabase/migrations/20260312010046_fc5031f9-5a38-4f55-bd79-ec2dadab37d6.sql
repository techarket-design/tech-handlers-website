
CREATE TABLE public.platform_logos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  website_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_logos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read platform logos" ON public.platform_logos FOR SELECT TO public USING (true);
CREATE POLICY "Admins can manage platform logos" ON public.platform_logos FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS platform_expertise_heading text DEFAULT 'Experts Across Leading Marketing Platforms';

INSERT INTO public.platform_logos (name, sort_order) VALUES
  ('Google', 1),
  ('Meta', 2),
  ('LinkedIn', 3),
  ('Shopify', 4),
  ('WordPress', 5),
  ('HubSpot', 6);
