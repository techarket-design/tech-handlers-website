
-- Add creator tracking to leads
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS created_by uuid DEFAULT auth.uid();
CREATE INDEX IF NOT EXISTS leads_created_by_idx ON public.leads(created_by);

-- Replace lead visibility policies
DROP POLICY IF EXISTS "Admins can view leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can update leads" ON public.leads;
DROP POLICY IF EXISTS "Team view assigned leads" ON public.leads;
DROP POLICY IF EXISTS "Team update assigned leads" ON public.leads;

-- SELECT: admins, the creator, or any assignee
CREATE POLICY "Leads visible to creator, assignees and admins"
ON public.leads FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR created_by = auth.uid()
  OR is_lead_assignee(auth.uid(), id)
  OR assigned_to = (auth.uid())::text
);

-- UPDATE: admins, the creator, or any assignee
CREATE POLICY "Leads editable by creator, assignees and admins"
ON public.leads FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR created_by = auth.uid()
  OR is_lead_assignee(auth.uid(), id)
  OR assigned_to = (auth.uid())::text
);

-- Also restrict related lead_activities the same way
DROP POLICY IF EXISTS "Admins can view all lead activities" ON public.lead_activities;
DROP POLICY IF EXISTS "Team view activities for assigned leads" ON public.lead_activities;

CREATE POLICY "Lead activities visible to lead viewers"
ON public.lead_activities FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.leads l
    WHERE l.id = lead_activities.lead_id
      AND (
        has_role(auth.uid(), 'admin'::app_role)
        OR l.created_by = auth.uid()
        OR is_lead_assignee(auth.uid(), l.id)
        OR l.assigned_to = (auth.uid())::text
      )
  )
);
