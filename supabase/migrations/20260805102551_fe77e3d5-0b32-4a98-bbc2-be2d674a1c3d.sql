ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS focus_keyword text,
  ADD COLUMN IF NOT EXISTS secondary_keywords text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS canonical_url text,
  ADD COLUMN IF NOT EXISTS noindex boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS schema_type text NOT NULL DEFAULT 'BlogPosting',
  ADD COLUMN IF NOT EXISTS faq_schema jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS how_to_schema jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS custom_schema jsonb,
  ADD COLUMN IF NOT EXISTS og_image_url text,
  ADD COLUMN IF NOT EXISTS image_alt text,
  ADD COLUMN IF NOT EXISTS reading_time_minutes integer;