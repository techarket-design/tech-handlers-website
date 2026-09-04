import { useEffect, useState } from "react";
import { Bell, BellOff, Smartphone, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { enablePush, disablePush, isPushEnabled, isPushSupported, pushPermission, isIosNotInstalled, pushNotify, isInIframe, showLocalTestNotification, refreshPushWorker } from "@/lib/push";

type Prefs = {
  master_enabled: boolean;
  task_assigned: boolean;
  task_due: boolean;
  followup_due: boolean;
  mention: boolean;
};
const DEFAULT_PREFS: Prefs = { master_enabled: true, task_assigned: true, task_due: true, followup_due: true, mention: true };

export function NotificationSettings() {
  const { user } = useAuth();
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [devices, setDevices] = useState<any[]>([]);
  const supported = isPushSupported();
  const iosNeedsInstall = isIosNotInstalled();
  const inIframe = isInIframe();

  const refreshDevices = async () => {
    if (!user) return;
    const { data } = await supabase.from("push_subscriptions").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setDevices(data || []);
  };

  useEffect(() => {
    isPushEnabled().then(async (on) => {
      setEnabled(on);
      if (on) await refreshPushWorker();
    });
    if (user) {
      supabase.from("user_notification_prefs").select("*").eq("user_id", user.id).maybeSingle()
        .then(({ data }) => { if (data) setPrefs(data as any); });
      refreshDevices();
    }
  }, [user]);

  const toggleMaster = async () => {
    setBusy(true);
    if (enabled) {
      const r = await disablePush();
      if (!r.ok) toast.error(r.error || "Failed");
      else { toast.success("Notifications disabled on this device"); setEnabled(false); }
    } else {
      const r = await enablePush();
      if (!r.ok) toast.error(r.error || "Failed");
      else { toast.success("Notifications enabled"); setEnabled(true); }
      await refreshDevices();
    }
    setBusy(false);
  };

  const updatePref = async (key: keyof Prefs, value: boolean) => {
    if (!user) return;
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    await supabase.from("user_notification_prefs").upsert({ user_id: user.id, ...next, updated_at: new Date().toISOString() });
  };

  const testNotification = async () => {
    if (!user) return;
    setBusy(true);
    try {
      const localShown = await showLocalTestNotification();
      const result = await pushNotify({
        userIds: [user.id],
        title: "Push notification test",
        body: "If you see this after the local test, background push is working ✅",
        url: "/admin/account",
      });
      if (result?.sent && result.sent > 0) {
        toast.success(localShown ? "Local + push tests sent" : "Push test sent");
      } else if (result?.skipped) {
        toast.error("Push skipped because notification preferences are off");
      } else {
        toast.error("No registered device was found for this account. Disable and enable notifications again.");
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to send test notification");
    }
    setBusy(false);
  };

  const removeDevice = async (id: string, endpoint: string) => {
    await supabase.from("push_subscriptions").delete().eq("id", id);
    // if it's the current device, also unsubscribe browser-side
    const reg = await navigator.serviceWorker?.getRegistration("/");
    const sub = await reg?.pushManager.getSubscription();
    if (sub?.endpoint === endpoint) { await sub.unsubscribe(); setEnabled(false); }
    refreshDevices();
  };

  return (
    <div className="bg-surface-white rounded-xl border border-border p-6">
      <h2 className="font-display font-semibold text-lead mb-1 flex items-center gap-2">
        <Bell className="h-5 w-5 text-primary" /> Desktop & Mobile Notifications
      </h2>
      <p className="text-sm text-muted-foreground mb-4">Get pop-up alerts for tasks, reminders, and mentions — even when the tab is closed.</p>

      {!supported && (
        <div className="flex items-start gap-2 text-sm bg-muted/40 border border-border rounded-md p-3 mb-4">
          <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
          <span>This browser does not support push notifications.</span>
        </div>
      )}
      {inIframe && (
        <div className="flex items-start gap-2 text-sm bg-amber-50 border border-amber-200 text-amber-900 rounded-md p-3 mb-4">
          <AlertCircle className="h-4 w-4 mt-0.5" />
          <span>
            You're viewing this inside a preview iframe. Browsers block the notification permission prompt here.{" "}
            <a
              href={typeof window !== "undefined" ? window.location.href : "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-medium"
            >
              Open in a new tab
            </a>{" "}
            to enable notifications.
          </span>
        </div>
      )}
      {iosNeedsInstall && (
        <div className="flex items-start gap-2 text-sm bg-amber-50 border border-amber-200 text-amber-900 rounded-md p-3 mb-4">
          <Smartphone className="h-4 w-4 mt-0.5" />
          <span>On iPhone, tap <strong>Share → Add to Home Screen</strong> first, then open the app from your home screen and enable notifications here.</span>
        </div>
      )}
      {supported && pushPermission() === "denied" && (
        <div className="flex items-start gap-2 text-sm bg-destructive/10 border border-destructive/20 text-destructive rounded-md p-3 mb-4">
          <BellOff className="h-4 w-4 mt-0.5" />
          <span>Notifications are blocked in browser settings. Click the lock icon in the address bar to allow them.</span>
        </div>
      )}

      <div className="flex items-center justify-between py-3 border-y border-border">
        <div>
          <p className="font-medium text-sm">Enable on this device</p>
          <p className="text-xs text-muted-foreground">{enabled ? "Active on this device" : "Not enabled"}</p>
        </div>
        <Button onClick={toggleMaster} disabled={busy || !supported}>
          {enabled ? "Disable" : "Enable Notifications"}
        </Button>
      </div>

      <div className="mt-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notify me about</p>
        {([
          ["task_assigned", "Tasks assigned to me"],
          ["task_due", "Task due dates"],
          ["followup_due", "Lead follow-up reminders"],
          ["mention", "@mentions in log notes"],
        ] as [keyof Prefs, string][]).map(([key, label]) => (
          <div key={key} className="flex items-center justify-between">
            <Label htmlFor={key} className="text-sm">{label}</Label>
            <Switch id={key} checked={prefs[key]} onCheckedChange={(v) => updatePref(key, v)} disabled={!prefs.master_enabled && key !== "master_enabled"} />
          </div>
        ))}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <Label htmlFor="master" className="text-sm font-semibold">Master switch (all notifications)</Label>
          <Switch id="master" checked={prefs.master_enabled} onCheckedChange={(v) => updatePref("master_enabled", v)} />
        </div>
      </div>

      <div className="mt-6">
        <Button variant="outline" size="sm" onClick={testNotification} disabled={busy || !enabled}>Send test notification</Button>
      </div>

      {devices.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Registered devices ({devices.length})</p>
          <div className="space-y-1.5">
            {devices.map((d) => (
              <div key={d.id} className="flex items-center justify-between text-xs bg-muted/30 rounded-md px-3 py-2">
                <span className="truncate flex-1 mr-2">{d.user_agent?.slice(0, 90) || "Unknown device"}</span>
                <Button variant="ghost" size="sm" className="h-6 text-destructive" onClick={() => removeDevice(d.id, d.endpoint)}>Remove</Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}