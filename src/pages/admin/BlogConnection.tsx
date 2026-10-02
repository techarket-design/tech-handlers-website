import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import SEOHead from '@/components/SEOHead';

type Connection = { id:string; created_at:string; expires_at:string; revoked_at:string|null };
export default function BlogConnection() {
  const { user,isAdmin,loading }=useAuth();
  const [params]=useSearchParams();
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  const [connections,setConnections]=useState<Connection[]>([]);
  const linking=params.has('client_id');
  const request=useCallback(async (action:string,body?:unknown) => {
    const { data:{ session } }=await supabase.auth.getSession();
    if (!session) throw new Error('Sign in to continue');
    const response=await fetch(`/api/blog-oauth?action=${action}`,{ method:body ? 'POST':'GET',
      headers:{ Authorization:`Bearer ${session.access_token}`,'Content-Type':'application/json' },body:body ? JSON.stringify(body):undefined });
    const data=await response.json(); if (!response.ok) throw new Error(data.error || 'Could not complete your request'); return data;
  },[]);
  const refresh=useCallback(async () => {
    try { const data=await request('connections'); setConnections(data.connections); } catch(e) { setError(e instanceof Error ? e.message:'Could not load connections'); }
  },[request]);
  useEffect(() => { if (isAdmin && !linking) void refresh(); },[isAdmin,linking,refresh]);
  async function connect() {
    setBusy(true);setError('');
    try { const result=await request('consent',{ ...Object.fromEntries(params),approved:true }); window.location.assign(result.redirect); }
    catch(e) { setError(e instanceof Error ? e.message:'Connection failed');setBusy(false); }
  }
  async function revoke(id:string) {
    setBusy(true);setError('');
    try { await request('connections',{ id });await refresh(); } catch(e) { setError(e instanceof Error ? e.message:'Could not disconnect'); }
    finally { setBusy(false); }
  }
  const next=`/admin/blog-connection${linking ? `?${params.toString()}`:''}`;
  return <main className="min-h-screen bg-background p-6 flex justify-center items-start pt-24">
    <SEOHead title="TH Blog Publisher connection" noindex />
    <section className="w-full max-w-xl rounded-2xl border bg-card p-6 space-y-5">
      <h1 className="text-2xl font-bold">TH Blog Publisher</h1>
      <p className="text-muted-foreground">Connect Gemini to create articles, save drafts and publish approved posts on Tech Handlers.</p>
      {loading ? <p>Checking your account…</p> : !user ? <Button asChild><Link to={`/admin/login?next=${encodeURIComponent(next)}`}>Sign in to Tech Handlers</Link></Button> : !isAdmin ? <p>Only a Tech Handlers administrator can authorize this connection.</p> : linking ? <>
        <p>By connecting, you allow this app to read blog posts and drafts, create drafts, edit drafts and publish articles. Gemini will ask you to confirm write actions.</p>
        <p className="text-sm text-muted-foreground">This connection expires after 30 days. You can revoke it at any time on this page.</p>
        <div className="flex gap-3"><Button onClick={connect} disabled={busy}>{busy ? 'Connecting…':'Connect blog publisher'}</Button><Button variant="outline" asChild><Link to="/admin/blog-connection">Cancel</Link></Button></div>
      </> : <>
        <p>Custom app link: <code className="break-all">{window.location.origin}/api/mcp</code></p>
        <p className="text-sm text-muted-foreground">Add this URL in Gemini’s Connected Apps. Use the client credentials supplied during deployment under Advanced features, then sign in here to approve access.</p>
        <h2 className="font-semibold">Your connections</h2>
        {!connections.length && !error && <p>No connections yet.</p>}
        {connections.map(c => <div key={c.id} className="border rounded-lg p-4 flex justify-between gap-3 items-center"><div><p>Gemini blog access</p><p className="text-sm text-muted-foreground">{c.revoked_at ? 'Disconnected':new Date(c.expires_at)<new Date() ? 'Expired':`Expires ${new Date(c.expires_at).toLocaleDateString()}`}</p></div>{!c.revoked_at && <Button variant="outline" onClick={() => revoke(c.id)} disabled={busy}>Disconnect</Button>}</div>)}
        <Button variant="outline" asChild><Link to="/admin/blog">Open blog posts</Link></Button>
      </>}
      {error && <p role="alert" className="text-destructive">{error}</p>}
    </section>
  </main>;
}
