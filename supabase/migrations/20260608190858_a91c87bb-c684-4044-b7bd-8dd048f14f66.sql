
-- 1. Notifications: restrict user_id in INSERT to self OR admin (admins can notify others)
DROP POLICY IF EXISTS "Users can create notifications as themselves" ON public.notifications;
CREATE POLICY "Users can create notifications as themselves"
ON public.notifications FOR INSERT TO authenticated
WITH CHECK (
  actor_id = auth.uid()
  AND (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
);

-- 2. task_activities: restrict insert to admin or task assignee
DROP POLICY IF EXISTS "Tasks module users insert activities" ON public.task_activities;
CREATE POLICY "Tasks module users insert activities"
ON public.task_activities FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR (public.has_permission(auth.uid(), 'tasks') AND public.is_task_assignee(auth.uid(), task_id))
);

-- 3. Storage media: restrict delete/update to admins
DROP POLICY IF EXISTS "Authenticated can delete media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update media" ON storage.objects;
CREATE POLICY "Admins can delete media"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'media' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update media"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'media' AND public.has_role(auth.uid(), 'admin'));

-- 4. Realtime: scope broadcasts to chat members / notification owners
DROP POLICY IF EXISTS "Authenticated can read realtime messages" ON realtime.messages;
DROP POLICY IF EXISTS "Scoped realtime read" ON realtime.messages;
CREATE POLICY "Scoped realtime read"
ON realtime.messages FOR SELECT TO authenticated
USING (
  -- notifications:<user_id>
  (realtime.topic() LIKE 'notifications:%' AND split_part(realtime.topic(), ':', 2) = auth.uid()::text)
  OR
  -- chat:<conversation_id> — must be a member
  (realtime.topic() LIKE 'chat:%' AND public.is_conversation_member(auth.uid(), (split_part(realtime.topic(), ':', 2))::uuid))
);
