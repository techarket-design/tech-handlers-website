
-- Drop existing team policies on leads
DROP POLICY IF EXISTS "Team can view leads" ON public.leads;
DROP POLICY IF EXISTS "Team can update leads" ON public.leads;

-- Team can only view leads assigned to them
CREATE POLICY "Team can view assigned leads"
ON public.leads FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'team'::app_role)
  AND assigned_to = auth.uid()::text
);

-- Team can update only their assigned leads
CREATE POLICY "Team can update assigned leads"
ON public.leads FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'team'::app_role)
  AND assigned_to = auth.uid()::text
);

-- Team can insert leads
CREATE POLICY "Team can insert leads"
ON public.leads FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'team'::app_role)
);

-- Drop existing team policies on lead_activities
DROP POLICY IF EXISTS "Team can manage lead activities" ON public.lead_activities;

-- Team can only see activities for leads assigned to them
CREATE POLICY "Team can view assigned lead activities"
ON public.lead_activities FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'team'::app_role)
  AND lead_id IN (SELECT id FROM public.leads WHERE assigned_to = auth.uid()::text)
);

-- Team can insert activities for their assigned leads
CREATE POLICY "Team can insert assigned lead activities"
ON public.lead_activities FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'team'::app_role)
  AND lead_id IN (SELECT id FROM public.leads WHERE assigned_to = auth.uid()::text)
);

-- Team can update activities for their assigned leads
CREATE POLICY "Team can update assigned lead activities"
ON public.lead_activities FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'team'::app_role)
  AND lead_id IN (SELECT id FROM public.leads WHERE assigned_to = auth.uid()::text)
);
