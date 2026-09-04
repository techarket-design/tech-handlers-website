
-- Assign team role to isha@techhandlers.in
INSERT INTO public.user_roles (user_id, role)
VALUES ('73997c6f-3968-44ac-995d-f70b4741d894', 'team')
ON CONFLICT (user_id, role) DO NOTHING;
