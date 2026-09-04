import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const now = new Date();
  const horizon = new Date(now.getTime() + 15 * 60 * 1000).toISOString();

  const { data: leads } = await supabase
    .from('leads')
    .select('id, name, company, follow_up_date, assigned_to')
    .lte('follow_up_date', horizon)
    .is('followup_notified_at', null);

  let count = 0;
  for (const l of leads || []) {
    if (!l.assigned_to) {
      await supabase.from('leads').update({ followup_notified_at: new Date().toISOString() }).eq('id', l.id);
      continue;
    }
    const overdue = new Date(l.follow_up_date) < now;
    const title = overdue ? `Follow-up overdue: ${l.name}` : `Follow-up soon: ${l.name}`;
    const body = `${l.company || ''} · ${new Date(l.follow_up_date).toLocaleString()}`;
    await fetch(`${SUPABASE_URL}/functions/v1/send-push`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIds: [l.assigned_to], title, body, url: `/admin/leads/${l.id}`, category: 'followup_due' }),
    });
    await supabase.from('leads').update({ followup_notified_at: new Date().toISOString() }).eq('id', l.id);
    count++;
  }

  return new Response(JSON.stringify({ ok: true, sent: count }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});