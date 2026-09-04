import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const now = new Date();
  const horizon = new Date(now.getTime() + 15 * 60 * 1000).toISOString();

  // Tasks due in next 15 min OR already overdue, not done, not yet notified
  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title, due_date, status, assignees:task_assignees(user_id)')
    .neq('status', 'done')
    .lte('due_date', horizon)
    .is('due_notified_at', null);

  let sentBatches = 0;
  for (const t of tasks || []) {
    const userIds = (t.assignees || []).map((a: any) => a.user_id);
    if (userIds.length === 0) {
      await supabase.from('tasks').update({ due_notified_at: new Date().toISOString() }).eq('id', t.id);
      continue;
    }
    const overdue = new Date(t.due_date) < now;
    const title = overdue ? `Overdue: ${t.title}` : `Due soon: ${t.title}`;
    const body = overdue ? 'This task is past due' : `Due ${new Date(t.due_date).toLocaleString()}`;
    await fetch(`${SUPABASE_URL}/functions/v1/send-push`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIds, title, body, url: `/admin/tasks/${t.id}`, category: 'task_due' }),
    });
    await supabase.from('tasks').update({ due_notified_at: new Date().toISOString() }).eq('id', t.id);
    sentBatches++;
  }

  return new Response(JSON.stringify({ ok: true, batches: sentBatches }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});