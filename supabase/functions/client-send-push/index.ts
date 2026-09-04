// Authenticated wrapper around send-push for app code.
// Any logged-in admin/team member can trigger a push to a target user.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const auth = req.headers.get('Authorization');
    if (!auth) return j({ error: 'unauthorized' }, 401);
    const userClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: u } = await userClient.auth.getUser();
    if (!u?.user) return j({ error: 'unauthorized' }, 401);

    // require admin OR any role (team) — same gate as notifications insert
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: roles } = await admin.from('user_roles').select('role').eq('user_id', u.user.id);
    if (!roles || roles.length === 0) return j({ error: 'forbidden' }, 403);

    const { userIds, title, body, url, category } = await req.json();
    if (!Array.isArray(userIds) || !title) return j({ error: 'invalid_payload' }, 400);

    const r = await fetch(`${SUPABASE_URL}/functions/v1/send-push`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIds, title, body, url, category }),
    });
    const out = await r.json();
    return j(out, r.status);
  } catch (e: any) {
    return j({ error: e.message }, 500);
  }
});

function j(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}