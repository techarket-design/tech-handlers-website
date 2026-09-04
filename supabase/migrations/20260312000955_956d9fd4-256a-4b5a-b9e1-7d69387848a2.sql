-- Create revenue_engine_segments table
CREATE TABLE public.revenue_engine_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_key text NOT NULL,
  label text NOT NULL,
  color text NOT NULL DEFAULT '#4A7BF7',
  icon_name text DEFAULT 'Users',
  title text NOT NULL,
  description text NOT NULL,
  stat text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.revenue_engine_segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read segments" ON public.revenue_engine_segments FOR SELECT TO public USING (true);
CREATE POLICY "Admins can manage segments" ON public.revenue_engine_segments FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Create homepage_sections table
CREATE TABLE public.homepage_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text UNIQUE NOT NULL,
  label text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read sections" ON public.homepage_sections FOR SELECT TO public USING (true);
CREATE POLICY "Admins can manage sections" ON public.homepage_sections FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));