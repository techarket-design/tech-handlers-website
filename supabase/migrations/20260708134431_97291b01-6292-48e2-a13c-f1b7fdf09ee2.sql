
-- Helper: is user a member of a task project?
CREATE OR REPLACE FUNCTION public.is_project_member(_user_id uuid, _project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.has_role(_user_id, 'admin'::app_role)
    OR EXISTS (SELECT 1 FROM public.task_projects p WHERE p.id = _project_id AND p.created_by = _user_id)
    OR EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.project_id = _project_id
        AND (t.created_by = _user_id OR public.is_task_assignee(_user_id, t.id))
    )
$$;

-- Milestones
CREATE TABLE public.project_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.task_projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','in_progress','done','blocked')),
  target_date date,
  completed_at timestamptz,
  progress integer NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_milestones TO authenticated;
GRANT ALL ON public.project_milestones TO service_role;
ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Project members read milestones" ON public.project_milestones
  FOR SELECT TO authenticated USING (public.is_project_member(auth.uid(), project_id));
CREATE POLICY "Project members write milestones" ON public.project_milestones
  FOR INSERT TO authenticated WITH CHECK (public.is_project_member(auth.uid(), project_id));
CREATE POLICY "Project members update milestones" ON public.project_milestones
  FOR UPDATE TO authenticated USING (public.is_project_member(auth.uid(), project_id));
CREATE POLICY "Project members delete milestones" ON public.project_milestones
  FOR DELETE TO authenticated USING (public.is_project_member(auth.uid(), project_id));
CREATE TRIGGER trg_project_milestones_updated_at BEFORE UPDATE ON public.project_milestones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Journey entries (timeline)
CREATE TABLE public.project_journey_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.task_projects(id) ON DELETE CASCADE,
  entry_type text NOT NULL CHECK (entry_type IN ('note','update','status_change','milestone','file','event')),
  title text,
  body text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  author_id uuid,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_journey_entries TO authenticated;
GRANT ALL ON public.project_journey_entries TO service_role;
ALTER TABLE public.project_journey_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Project members read journey" ON public.project_journey_entries
  FOR SELECT TO authenticated USING (public.is_project_member(auth.uid(), project_id));
CREATE POLICY "Project members write journey" ON public.project_journey_entries
  FOR INSERT TO authenticated WITH CHECK (public.is_project_member(auth.uid(), project_id));
CREATE POLICY "Author or admin update journey" ON public.project_journey_entries
  FOR UPDATE TO authenticated USING (author_id = auth.uid() OR public.has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Author or admin delete journey" ON public.project_journey_entries
  FOR DELETE TO authenticated USING (author_id = auth.uid() OR public.has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER trg_project_journey_updated_at BEFORE UPDATE ON public.project_journey_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_journey_project_occurred ON public.project_journey_entries(project_id, occurred_at DESC);

-- Project files
CREATE TABLE public.project_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.task_projects(id) ON DELETE CASCADE,
  journey_entry_id uuid REFERENCES public.project_journey_entries(id) ON DELETE SET NULL,
  file_name text NOT NULL,
  storage_path text NOT NULL,
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_files TO authenticated;
GRANT ALL ON public.project_files TO service_role;
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Project members read files" ON public.project_files
  FOR SELECT TO authenticated USING (public.is_project_member(auth.uid(), project_id));
CREATE POLICY "Project members write files" ON public.project_files
  FOR INSERT TO authenticated WITH CHECK (public.is_project_member(auth.uid(), project_id));
CREATE POLICY "Uploader or admin delete files" ON public.project_files
  FOR DELETE TO authenticated USING (uploaded_by = auth.uid() OR public.has_role(auth.uid(),'admin'::app_role));

-- Auto-log: task_projects archive change
CREATE OR REPLACE FUNCTION public.log_project_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.project_journey_entries(project_id, entry_type, title, author_id, metadata)
    VALUES (NEW.id, 'event', 'Project created', NEW.created_by, jsonb_build_object('name', NEW.name));
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.is_archived IS DISTINCT FROM OLD.is_archived THEN
      INSERT INTO public.project_journey_entries(project_id, entry_type, title, author_id, metadata)
      VALUES (NEW.id, 'status_change',
        CASE WHEN NEW.is_archived THEN 'Project archived' ELSE 'Project reopened' END,
        auth.uid(), jsonb_build_object('is_archived', NEW.is_archived));
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_log_project_change
AFTER INSERT OR UPDATE ON public.task_projects
FOR EACH ROW EXECUTE FUNCTION public.log_project_change();

-- Auto-log: milestone insert/update
CREATE OR REPLACE FUNCTION public.log_milestone_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.project_journey_entries(project_id, entry_type, title, body, author_id, metadata)
    VALUES (NEW.project_id, 'milestone', 'Milestone added: ' || NEW.title, NEW.description, NEW.created_by,
      jsonb_build_object('milestone_id', NEW.id, 'status', NEW.status));
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.project_journey_entries(project_id, entry_type, title, author_id, metadata)
    VALUES (NEW.project_id, 'milestone',
      'Milestone "' || NEW.title || '" → ' || NEW.status,
      auth.uid(),
      jsonb_build_object('milestone_id', NEW.id, 'from', OLD.status, 'to', NEW.status));
    IF NEW.status = 'done' AND NEW.completed_at IS NULL THEN
      NEW.completed_at := now();
      NEW.progress := 100;
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_log_milestone_change
BEFORE INSERT OR UPDATE ON public.project_milestones
FOR EACH ROW EXECUTE FUNCTION public.log_milestone_change();

-- Auto-log: file upload
CREATE OR REPLACE FUNCTION public.log_project_file()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  entry_id uuid;
BEGIN
  INSERT INTO public.project_journey_entries(project_id, entry_type, title, author_id, metadata)
  VALUES (NEW.project_id, 'file', 'File uploaded: ' || NEW.file_name, NEW.uploaded_by,
    jsonb_build_object('file_id', NEW.id, 'storage_path', NEW.storage_path, 'size', NEW.size_bytes))
  RETURNING id INTO entry_id;
  IF NEW.journey_entry_id IS NULL THEN
    NEW.journey_entry_id := entry_id;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_log_project_file
BEFORE INSERT ON public.project_files
FOR EACH ROW EXECUTE FUNCTION public.log_project_file();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_journey_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_milestones;
