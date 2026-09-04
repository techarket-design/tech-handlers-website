
-- Add CRM columns to leads table
ALTER TABLE public.leads
ADD COLUMN assigned_to text,
ADD COLUMN priority text DEFAULT 'warm',
ADD COLUMN follow_up_date timestamptz,
ADD COLUMN last_contacted_at timestamptz;

-- Create lead_activities table
CREATE TABLE public.lead_activities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  activity_type text NOT NULL DEFAULT 'note',
  description text,
  scheduled_at timestamptz,
  completed_at timestamptz,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

-- Admin-only policies
CREATE POLICY "Admins can manage lead activities"
ON public.lead_activities
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Index for fast lookups
CREATE INDEX idx_lead_activities_lead_id ON public.lead_activities(lead_id);
CREATE INDEX idx_leads_priority ON public.leads(priority);
CREATE INDEX idx_leads_follow_up_date ON public.leads(follow_up_date);
