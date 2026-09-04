
CREATE TABLE public.video_showcase_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  description text,
  poster_url text,
  video_url text NOT NULL,
  video_url_hd text,
  video_url_sd text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.video_showcase_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.video_showcase_items TO authenticated;
GRANT ALL ON public.video_showcase_items TO service_role;

ALTER TABLE public.video_showcase_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active video showcase items"
  ON public.video_showcase_items FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can view all video showcase items"
  ON public.video_showcase_items FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert video showcase items"
  ON public.video_showcase_items FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update video showcase items"
  ON public.video_showcase_items FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete video showcase items"
  ON public.video_showcase_items FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_video_showcase_items_updated_at
  BEFORE UPDATE ON public.video_showcase_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.video_showcase_items REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.video_showcase_items;

-- Register homepage section so it appears (and can be reordered/hidden) in the admin.
-- sort_order 15 places it between hero (10) and the next section (20).
INSERT INTO public.homepage_sections (section_key, label, sort_order, is_visible)
VALUES ('video_showcase', 'Video Showcase', 15, true)
ON CONFLICT (section_key) DO NOTHING;
