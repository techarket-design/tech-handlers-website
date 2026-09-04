
CREATE TABLE public.city_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  city text NOT NULL,
  service text NOT NULL,
  service_slug text,
  h1 text NOT NULL,
  hero_subtitle text,
  meta_title text,
  meta_description text,
  hero_image_url text,
  intro text,
  why_us text,
  process text,
  faqs jsonb NOT NULL DEFAULT '[]'::jsonb,
  testimonials jsonb NOT NULL DEFAULT '[]'::jsonb,
  stats jsonb NOT NULL DEFAULT '[]'::jsonb,
  cta_heading text,
  cta_description text,
  is_published boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.city_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published city pages"
  ON public.city_pages FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can manage city pages"
  ON public.city_pages FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_city_pages_updated_at
  BEFORE UPDATE ON public.city_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_city_pages_slug ON public.city_pages(slug);
CREATE INDEX idx_city_pages_published ON public.city_pages(is_published);
