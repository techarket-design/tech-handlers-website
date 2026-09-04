INSERT INTO public.homepage_sections (section_key, label, sort_order, is_visible) VALUES
  ('hero', 'Hero', 10, true),
  ('metrics', 'Metrics', 20, true),
  ('services', 'Services', 30, true),
  ('process', 'Process', 40, true),
  ('case_studies', 'Case Studies', 50, true),
  ('funnel', 'Funnel Comparison', 60, true),
  ('testimonials', 'Testimonials', 70, true),
  ('why_us', 'Why Us', 80, true),
  ('cta', 'CTA Banner', 90, true),
  ('platform_expertise', 'Platform Expertise', 110, true),
  ('faq', 'FAQ', 120, true),
  ('contact', 'Contact', 130, true)
ON CONFLICT DO NOTHING;

UPDATE public.homepage_sections SET label = 'Social Showcase', sort_order = 100 WHERE section_key = 'social_showcase';