
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS requirement text,
ADD COLUMN IF NOT EXISTS lead_label text,
ADD COLUMN IF NOT EXISTS designation text;
