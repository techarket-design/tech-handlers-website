
-- Team can view leads
CREATE POLICY "Team can view leads"
ON public.leads FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'team'::app_role));

-- Team can update leads
CREATE POLICY "Team can update leads"
ON public.leads FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'team'::app_role));

-- Team can manage lead activities
CREATE POLICY "Team can manage lead activities"
ON public.lead_activities FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'team'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'team'::app_role));

-- Team can view their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid());
