// Internal function: sends Web Push to one user or a list of users.
// Call via Authorization: Bearer <SERVICE_ROLE_KEY> from triggers/cron.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY')!;
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:info@techhandlers.in';
webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  // Require service role
  const auth = req.headers.get('Authorization') || '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  if (auth !== `Bearer ${serviceKey}`) return json({ error: 'forbidden' }, 403);

  try {
    const { userIds, title, body, url, category } = await req.json();
    if (!Array.isArray(userIds) || userIds.length === 0 || !title) {
      return json({ error: 'invalid_payload' }, 400);
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, serviceKey);

    // Filter by preferences
    const { data: prefs } = await supabase
      .from('user_notification_prefs')
      .select('*')
      .in('user_id', userIds);
    const prefMap = new Map((prefs || []).map((p: any) => [p.user_id, p]));

    const allowedUsers = userIds.filter((uid: string) => {
      const p = prefMap.get(uid);
      if (!p) return true; // default: all enabled
      if (!p.master_enabled) return false;
      if (category && p[category] === false) return false;
      return true;
    });
    if (allowedUsers.length === 0) return json({ ok: true, sent: 0, skipped: userIds.length });

    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('user_id', allowedUsers);

    const payload = JSON.stringify({ title, body: body || '', url: url || '/admin', tag: category ? `${category}:${url || '/admin'}` : undefined });
    let sent = 0;
    let failed = 0;
    const deadEndpoints: string[] = [];

    await Promise.all((subs || []).map(async (s: any) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload
        );
        sent++;
      } catch (e: any) {
        failed++;
        const code = e?.statusCode;
        console.warn('push_send_failed', { code, endpoint: String(s.endpoint).slice(0, 80), body: e?.body });
        if (code === 400 || code === 404 || code === 410) deadEndpoints.push(s.endpoint);
      }
    }));

    if (deadEndpoints.length > 0) {
      await supabase.from('push_subscriptions').delete().in('endpoint', deadEndpoints);
    }

    return json({ ok: true, sent, failed, dead: deadEndpoints.length, subscriptions: subs?.length || 0 });
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}