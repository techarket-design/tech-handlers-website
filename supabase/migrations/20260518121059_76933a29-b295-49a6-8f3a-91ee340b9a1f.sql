INSERT INTO public.homepage_sections (section_key, label, sort_order, is_visible)
VALUES ('trust_badges', 'Trust Badges', 15, true)
ON CONFLICT (section_key) DO NOTHING;