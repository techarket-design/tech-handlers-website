import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Debounced server-side draft autosave.
 * Writes `payload` to `public.content_drafts` every ~2s and on tab hide/close.
 * On mount, loads the last saved draft for the current user/scope/entity.
 *
 * Usage:
 *   const { serverDraft, save, clear, saving } = useServerDraft("project_note", projectId);
 *   useEffect(() => { if (serverDraft) restore(serverDraft); }, [serverDraft]);
 *   onChange -> save({ title, body });
 *   onSubmitSuccess -> clear();
 */
export function useServerDraft<T = any>(scope: string, entityId?: string | null) {
  const [serverDraft, setServerDraft] = useState<{ payload: T; updated_at: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = useRef<T | null>(null);
  const scopeRef = useRef(scope);
  const entityRef = useRef(entityId ?? null);

  useEffect(() => { scopeRef.current = scope; entityRef.current = entityId ?? null; }, [scope, entityId]);

  // Load latest
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const q = supabase.from("content_drafts" as any)
        .select("payload, updated_at")
        .eq("user_id", u.user.id)
        .eq("scope", scope);
      const { data } = entityId
        ? await q.eq("entity_id", entityId).maybeSingle()
        : await q.is("entity_id", null).maybeSingle();
      if (!cancelled && data) setServerDraft(data as any);
    })();
    return () => { cancelled = true; };
  }, [scope, entityId]);

  const flush = useCallback(async () => {
    const payload = latestRef.current;
    if (payload == null) return;
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    setSaving(true);
    await supabase.from("content_drafts" as any).upsert({
      user_id: u.user.id,
      scope: scopeRef.current,
      entity_id: entityRef.current,
      payload,
    }, { onConflict: "user_id,scope,entity_id" });
    setSaving(false);
  }, []);

  const save = useCallback((payload: T) => {
    latestRef.current = payload;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(flush, 2000);
  }, [flush]);

  const clear = useCallback(async () => {
    latestRef.current = null;
    if (timerRef.current) clearTimeout(timerRef.current);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const q = supabase.from("content_drafts" as any).delete()
      .eq("user_id", u.user.id).eq("scope", scopeRef.current);
    if (entityRef.current) await q.eq("entity_id", entityRef.current);
    else await q.is("entity_id", null);
    setServerDraft(null);
  }, []);

  // Flush on hide/unload
  useEffect(() => {
    const onHide = () => { flush(); };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onHide);
    window.addEventListener("beforeunload", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onHide);
      window.removeEventListener("beforeunload", onHide);
    };
  }, [flush]);

  return { serverDraft, save, clear, saving, flush };
}