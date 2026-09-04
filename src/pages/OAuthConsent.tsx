import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import logoImg from "@/assets/logo.png";

type AuthOAuth = {
  getAuthorizationDetails: (id: string) => Promise<{ data: any; error: any }>;
  approveAuthorization: (id: string) => Promise<{ data: any; error: any }>;
  denyAuthorization: (id: string) => Promise<{ data: any; error: any }>;
};
const authOAuth = () => (supabase.auth as unknown as { oauth: AuthOAuth }).oauth;

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) return setError("Missing authorization_id in URL.");
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/admin/login?next=" + encodeURIComponent(next);
        return;
      }
      try {
        const { data, error } = await authOAuth().getAuthorizationDetails(authorizationId);
        if (!active) return;
        if (error) return setError(error.message);
        const immediate = data?.redirect_url ?? data?.redirect_to;
        if (immediate && !data?.client) { window.location.href = immediate; return; }
        setDetails(data);
      } catch (e: any) {
        if (active) setError(e?.message ?? "Failed to load authorization details.");
      }
    })();
    return () => { active = false; };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    try {
      const { data, error } = approve
        ? await authOAuth().approveAuthorization(authorizationId)
        : await authOAuth().denyAuthorization(authorizationId);
      if (error) { setBusy(false); return setError(error.message); }
      const target = data?.redirect_url ?? data?.redirect_to;
      if (!target) { setBusy(false); return setError("No redirect returned by the authorization server."); }
      window.location.href = target;
    } catch (e: any) {
      setBusy(false);
      setError(e?.message ?? "Failed to record your choice.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md bg-surface-white rounded-2xl border border-border p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <img src={logoImg} alt="Tech Handlers" className="h-8 w-auto" />
          <span className="font-display text-base font-bold text-lead">Tech Handlers</span>
        </div>
        {error ? (
          <>
            <h1 className="font-display text-lg font-bold text-lead mb-2">Authorization error</h1>
            <p className="text-sm text-muted-foreground">{error}</p>
          </>
        ) : !details ? (
          <p className="text-sm text-muted-foreground">Loading authorization…</p>
        ) : (
          <>
            <h1 className="font-display text-lg font-bold text-lead mb-1">
              Connect {details.client?.name ?? "an app"} to Tech Handlers
            </h1>
            <p className="text-sm text-muted-foreground mb-4">
              {details.client?.name ?? "The client"} will be able to call this app's enabled MCP tools while you are signed in.
              This does not bypass this app's permissions or backend policies.
            </p>
            {details.scopes?.length ? (
              <p className="text-xs text-muted-foreground mb-4">
                Requested access: {(details.scopes as string[]).join(", ")}
              </p>
            ) : null}
            <div className="flex gap-2">
              <Button className="flex-1 gradient-primary-accent text-primary-foreground" disabled={busy} onClick={() => decide(true)}>
                Approve
              </Button>
              <Button variant="outline" className="flex-1" disabled={busy} onClick={() => decide(false)}>
                Deny
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}