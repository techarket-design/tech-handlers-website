
DROP POLICY IF EXISTS "senders edit own messages" ON public.chat_messages;
CREATE POLICY "senders edit own messages"
ON public.chat_messages FOR UPDATE
TO authenticated
USING (sender_id = auth.uid() AND is_conversation_member(auth.uid(), conversation_id))
WITH CHECK (sender_id = auth.uid() AND is_conversation_member(auth.uid(), conversation_id));

DROP POLICY IF EXISTS "Authenticated can upload media" ON storage.objects;
CREATE POLICY "Admins can upload media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media' AND has_role(auth.uid(), 'admin'::app_role));
