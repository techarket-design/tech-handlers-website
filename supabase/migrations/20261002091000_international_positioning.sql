-- Update the observed regional defaults only. Preserve any newer admin customizations.
update public.site_settings set tagline = 'Digital Growth for Ambitious Brands. Worldwide.'
where tagline = 'Dominate Delhi NCR. Scale Your Revenue.';
update public.site_settings set hero_subtitle = 'India-based digital marketing and web development for ambitious businesses. Build a measurable growth plan for your market, with clear scope and remote collaboration.'
where hero_subtitle = 'Gurgaon''s most aggressive data-driven digital marketing agency. We don''t just drive traffic; we build revenue engines.';
update public.site_settings set hero_badge_text = 'India-based. Working across markets.'
where hero_badge_text = '#1 Agency in Gurgaon';
update public.site_settings set footer_description = 'India-based digital marketing and web development for businesses worldwide. SEO, performance marketing and websites built around your commercial goals.'
where footer_description = 'Gurgaon''s most results-driven digital marketing agency. Turning clicks into customers and data into revenue since 2018.';
update public.site_settings set process_heading = 'A Clear Process from Discovery to Delivery'
where process_heading = 'From Audit to Domination in 4 Steps';
update public.site_settings set process_subheading = 'Align goals, agree the scope, deliver and review performance.'
where process_subheading = 'A battle-tested framework refined over 150+ successful campaigns';
update public.site_settings set cta_badge_text = 'Start with a conversation'
where cta_badge_text = 'Limited Spots This Month';
