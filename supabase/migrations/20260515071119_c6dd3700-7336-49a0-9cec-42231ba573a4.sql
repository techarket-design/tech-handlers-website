INSERT INTO public.homepage_sections (section_key, label, sort_order, is_visible)
SELECT 'social_showcase', 'Social Media Showcase', 105, true
WHERE NOT EXISTS (SELECT 1 FROM public.homepage_sections WHERE section_key = 'social_showcase');