DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'leads','lead_activities','lead_assignees',
    'tasks','task_projects','task_assignees','task_comments','task_activities',
    'project_journey_entries','project_milestones','project_files',
    'notifications','customers','invoices','payments'
  ] LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
    EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL', t);
  END LOOP;
END $$;