
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS funnel_heading text DEFAULT 'Move From Marketing that Reports Clicks to Marketing that Reports Revenue',
  ADD COLUMN IF NOT EXISTS funnel_subtitle text DEFAULT 'Traditional marketing optimizes for channel metrics. RevenueLift marketing builds a connected Revenue Engine for total business impact. Achieve 15% higher lead growth and smarter decisions through predictive analytics.',
  ADD COLUMN IF NOT EXISTS funnel_traditional_title text DEFAULT 'Traditional Digital Marketing',
  ADD COLUMN IF NOT EXISTS funnel_traditional_description text DEFAULT 'Siloed data and channels. Decisions based on vanity metrics and feel, leading to a broken, inefficient funnel.',
  ADD COLUMN IF NOT EXISTS funnel_revenue_title text DEFAULT 'RevenueLift Revenue Marketing',
  ADD COLUMN IF NOT EXISTS funnel_revenue_description text DEFAULT 'Connects all data sources to power a cohesive Revenue Engine. Use predictive analytics for smarter, revenue-backed decisions that minimize cost per lead and maximize ROI.';
