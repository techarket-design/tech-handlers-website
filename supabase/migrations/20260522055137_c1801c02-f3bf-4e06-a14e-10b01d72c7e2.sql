
-- 1. lead_assignees table
CREATE TABLE IF NOT EXISTS public.lead_assignees (
  lead_id uuid NOT NULL,
  user_id uuid NOT NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (lead_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_lead_assignees_user ON public.lead_assignees(user_id);
ALTER TABLE public.lead_assignees ENABLE ROW LEVEL SECURITY;

-- 2. Helper functions
CREATE OR REPLACE FUNCTION public.is_lead_assignee(_user_id uuid, _lead_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.lead_assignees WHERE lead_id = _lead_id AND user_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION public.is_task_assignee(_user_id uuid, _task_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.task_assignees WHERE task_id = _task_id AND user_id = _user_id)
$$;

-- 3. lead_assignees policies
CREATE POLICY "Admins manage lead assignees" ON public.lead_assignees
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users view own lead assignments" ON public.lead_assignees
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

-- 4. Tighten leads RLS
DROP POLICY IF EXISTS "Team can view assigned leads" ON public.leads;
DROP POLICY IF EXISTS "Team can update assigned leads" ON public.leads;

CREATE POLICY "Team view assigned leads" ON public.leads
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'team'::app_role)
    AND (
      public.is_lead_assignee(auth.uid(), id)
      OR assigned_to = (auth.uid())::text
    )
  );

CREATE POLICY "Team update assigned leads" ON public.leads
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'team'::app_role)
    AND (
      public.is_lead_assignee(auth.uid(), id)
      OR assigned_to = (auth.uid())::text
    )
  );

-- 5. Tighten lead_activities RLS for team
DROP POLICY IF EXISTS "Team can view assigned lead activities" ON public.lead_activities;
DROP POLICY IF EXISTS "Team can update assigned lead activities" ON public.lead_activities;
DROP POLICY IF EXISTS "Team can insert assigned lead activities" ON public.lead_activities;

CREATE POLICY "Team view lead activities" ON public.lead_activities
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'team'::app_role)
    AND (
      public.is_lead_assignee(auth.uid(), lead_id)
      OR lead_id IN (SELECT id FROM public.leads WHERE assigned_to = (auth.uid())::text)
    )
  );

CREATE POLICY "Team insert lead activities" ON public.lead_activities
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'team'::app_role)
    AND (
      public.is_lead_assignee(auth.uid(), lead_id)
      OR lead_id IN (SELECT id FROM public.leads WHERE assigned_to = (auth.uid())::text)
    )
  );

CREATE POLICY "Team update lead activities" ON public.lead_activities
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'team'::app_role)
    AND (
      public.is_lead_assignee(auth.uid(), lead_id)
      OR lead_id IN (SELECT id FROM public.leads WHERE assigned_to = (auth.uid())::text)
    )
  );

-- 6. Tighten tasks RLS
DROP POLICY IF EXISTS "Tasks module users manage tasks" ON public.tasks;

CREATE POLICY "Admins manage tasks" ON public.tasks
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Tasks module users insert tasks" ON public.tasks
  FOR INSERT TO authenticated
  WITH CHECK (public.has_permission(auth.uid(), 'tasks'));

CREATE POLICY "Tasks assignees view tasks" ON public.tasks
  FOR SELECT TO authenticated
  USING (
    public.has_permission(auth.uid(), 'tasks')
    AND (
      public.is_task_assignee(auth.uid(), id)
      OR created_by = auth.uid()
    )
  );

CREATE POLICY "Tasks assignees update tasks" ON public.tasks
  FOR UPDATE TO authenticated
  USING (
    public.has_permission(auth.uid(), 'tasks')
    AND (
      public.is_task_assignee(auth.uid(), id)
      OR created_by = auth.uid()
    )
  );

-- 7. Tighten task_comments
DROP POLICY IF EXISTS "Tasks module users manage comments" ON public.task_comments;

CREATE POLICY "Admins manage task comments" ON public.task_comments
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Task assignees view comments" ON public.task_comments
  FOR SELECT TO authenticated
  USING (
    public.has_permission(auth.uid(), 'tasks')
    AND public.is_task_assignee(auth.uid(), task_id)
  );

CREATE POLICY "Task assignees insert comments" ON public.task_comments
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_permission(auth.uid(), 'tasks')
    AND public.is_task_assignee(auth.uid(), task_id)
    AND user_id = auth.uid()
  );

CREATE POLICY "Comment authors update own" ON public.task_comments
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Comment authors delete own" ON public.task_comments
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- 8. task_activities visibility tightened to assignees / admins
DROP POLICY IF EXISTS "Tasks module users view activities" ON public.task_activities;
CREATE POLICY "Task assignees view activities" ON public.task_activities
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR (public.has_permission(auth.uid(), 'tasks') AND public.is_task_assignee(auth.uid(), task_id))
  );

-- 9. task_assignees readability for the assignee themselves
DROP POLICY IF EXISTS "Tasks module users manage assignees" ON public.task_assignees;
CREATE POLICY "Admins manage task assignees" ON public.task_assignees
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Tasks module insert assignees on create" ON public.task_assignees
  FOR INSERT TO authenticated
  WITH CHECK (public.has_permission(auth.uid(), 'tasks'));

CREATE POLICY "Users view own task assignments" ON public.task_assignees
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Task assignees view fellow assignees" ON public.task_assignees
  FOR SELECT TO authenticated
  USING (public.is_task_assignee(auth.uid(), task_id));

-- 10. Backfill: copy legacy single assigned_to into lead_assignees when it's a uuid
INSERT INTO public.lead_assignees (lead_id, user_id)
SELECT l.id, l.assigned_to::uuid
FROM public.leads l
WHERE l.assigned_to ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
ON CONFLICT DO NOTHING;
