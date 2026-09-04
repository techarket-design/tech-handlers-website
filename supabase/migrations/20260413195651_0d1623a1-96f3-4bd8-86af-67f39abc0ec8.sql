
-- Add 'team' to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'team';

-- Add reminder tracking to leads
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS reminder_sent boolean DEFAULT false;

-- Add completion tracking to lead_activities
ALTER TABLE public.lead_activities
ADD COLUMN IF NOT EXISTS is_completed boolean DEFAULT false;
