import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { enablePush, isPushSupported, isPushEnabled, pushPermission, isIosNotInstalled, refreshPushWorker } from "@/lib/push";

const DISMISS_KEY = "th_push_prompt_dismissed_v1";

export function EnableNotificationsBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    (async () => {
      if (!isPushSupported()) return;
      if (pushPermission() === "denied") return;
      if (isIosNotInstalled()) return;
      if (localStorage.getItem(DISMISS_KEY)) return;
      const on = await isPushEnabled();
      if (on) await refreshPushWorker();
      if (!on) setShow(true);
    })();
  }, []);

  if (!show) return null;

  const enable = async () => {
    const r = await enablePush();
    if (r.ok) { toast.success("Notifications enabled"); setShow(false); }
    else toast.error(r.error || "Failed");
  };
  const dismiss = () => { localStorage.setItem(DISMISS_KEY, "1"); setShow(false); };

  return (
    <div className="bg-primary/5 border-b border-primary/20 px-4 py-2 flex items-center gap-3 text-sm">
      <Bell className="h-4 w-4 text-primary shrink-0" />
      <span className="flex-1 text-lead">Get desktop pop-up alerts for tasks, reminders & mentions.</span>
      <Button size="sm" onClick={enable}>Enable</Button>
      <button onClick={dismiss} className="text-muted-foreground hover:text-foreground p-1" aria-label="Dismiss"><X className="h-4 w-4" /></button>
    </div>
  );
}