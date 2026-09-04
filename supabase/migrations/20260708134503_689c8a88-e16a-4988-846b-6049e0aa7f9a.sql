
CREATE TABLE public.content_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scope text NOT NULL,
  entity_id text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, scope, entity_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_drafts TO authenticated;
GRANT ALL ON public.content_drafts TO service_role;
ALTER TABLE public.content_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own drafts read" ON public.content_drafts
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Own drafts insert" ON public.content_drafts
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own drafts update" ON public.content_drafts
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own drafts delete" ON public.content_drafts
  FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE TRIGGER trg_content_drafts_updated_at BEFORE UPDATE ON public.content_drafts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage RLS for project files under media/project-files/<project_id>/...
CREATE POLICY "Project members read project files"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] = 'project-files'
    AND public.is_project_member(auth.uid(), ((storage.foldername(name))[2])::uuid)
  );
CREATE POLICY "Project members upload project files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] = 'project-files'
    AND public.is_project_member(auth.uid(), ((storage.foldername(name))[2])::uuid)
  );
CREATE POLICY "Project members delete project files"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] = 'project-files'
    AND public.is_project_member(auth.uid(), ((storage.foldername(name))[2])::uuid)
  );
