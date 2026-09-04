
-- Task management system
CREATE TABLE public.task_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  color text NOT NULL DEFAULT '#6366f1',
  client_name text,
  is_archived boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TYPE public.task_status AS ENUM ('todo', 'in_progress', 'review', 'done');
CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high', 'urgent');

CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.task_projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status public.task_status NOT NULL DEFAULT 'todo',
  priority public.task_priority NOT NULL DEFAULT 'medium',
  due_date timestamptz,
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_project ON public.tasks(project_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);

CREATE TABLE public.task_assignees (
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (task_id, user_id)
);
CREATE INDEX idx_task_assignees_user ON public.task_assignees(user_id);

CREATE TABLE public.task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_task_comments_task ON public.task_comments(task_id);

CREATE TABLE public.task_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id uuid,
  action text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_task_activities_task ON public.task_activities(task_id);

-- Enable RLS
ALTER TABLE public.task_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_activities ENABLE ROW LEVEL SECURITY;

-- Policies: any user with 'tasks' permission OR admin can manage everything (internal team tool)
CREATE POLICY "Tasks module users manage projects" ON public.task_projects
  FOR ALL TO authenticated
  USING (public.has_permission(auth.uid(), 'tasks'))
  WITH CHECK (public.has_permission(auth.uid(), 'tasks'));

CREATE POLICY "Tasks module users manage tasks" ON public.tasks
  FOR ALL TO authenticated
  USING (public.has_permission(auth.uid(), 'tasks'))
  WITH CHECK (public.has_permission(auth.uid(), 'tasks'));

CREATE POLICY "Tasks module users manage assignees" ON public.task_assignees
  FOR ALL TO authenticated
  USING (public.has_permission(auth.uid(), 'tasks'))
  WITH CHECK (public.has_permission(auth.uid(), 'tasks'));

CREATE POLICY "Tasks module users manage comments" ON public.task_comments
  FOR ALL TO authenticated
  USING (public.has_permission(auth.uid(), 'tasks'))
  WITH CHECK (public.has_permission(auth.uid(), 'tasks'));

CREATE POLICY "Tasks module users view activities" ON public.task_activities
  FOR SELECT TO authenticated
  USING (public.has_permission(auth.uid(), 'tasks'));

CREATE POLICY "Tasks module users insert activities" ON public.task_activities
  FOR INSERT TO authenticated
  WITH CHECK (public.has_permission(auth.uid(), 'tasks'));

-- updated_at triggers
CREATE TRIGGER trg_task_projects_updated BEFORE UPDATE ON public.task_projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_tasks_updated BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
