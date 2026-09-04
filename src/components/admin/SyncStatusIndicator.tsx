import { useEffect, useState } from "react";
import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import { subscribeQueue, flushQueue, type QueuedOp } from "@/lib/mutationQueue";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Wifi, WifiOff, CloudUpload, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Compact header pill that at-a-glance answers: "is my work saved?"
 *   • Green check   → all synced, online
 *   • Blue spinner  → save/fetch in flight
 *   • Amber warning → offline OR queued mutations waiting to retry
 * Click to expand queued items and retry manually.
 */
export function SyncStatusIndicator() {
  const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);
  const [queue, setQueue] = useState<QueuedOp[]>([]);
  const fetching = useIsFetching();
  const mutating = useIsMutating();

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    const unsub = subscribeQueue(setQueue);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
      unsub();
    };
  }, []);

  const busy = fetching + mutating > 0;
  const pending = queue.length;
  const state: "synced" | "syncing" | "queued" | "offline" =
    !online ? "offline" : pending ? "queued" : busy ? "syncing" : "synced";

  const meta = {
    synced:  { icon: CheckCircle2, label: "Saved", tone: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40" },
    syncing: { icon: CloudUpload, label: "Saving…", tone: "text-blue-600 bg-blue-50 dark:bg-blue-950/40 animate-pulse" },
    queued:  { icon: AlertTriangle, label: `${pending} queued`, tone: "text-amber-700 bg-amber-50 dark:bg-amber-950/40" },
    offline: { icon: WifiOff, label: "Offline", tone: "text-amber-700 bg-amber-50 dark:bg-amber-950/40" },
  }[state];
  const Icon = meta.icon;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition",
            meta.tone,
            "hover:opacity-90"
          )}
          title={
            state === "synced" ? "All changes saved"
            : state === "syncing" ? "Saving to server…"
            : state === "queued" ? `${pending} changes queued — will retry automatically`
            : "Offline — your changes are queued and will save when you reconnect"
          }
        >
          <Icon className={cn("h-3.5 w-3.5", state === "syncing" && "animate-spin")} />
          <span className="hidden sm:inline">{meta.label}</span>
          {online ? null : <Wifi className="h-3 w-3 opacity-40" />}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold">Sync status</div>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => flushQueue()}>
            <RefreshCw className="h-3 w-3 mr-1" /> Retry now
          </Button>
        </div>
        <div className="text-xs text-muted-foreground mb-3">
          {online ? "Connected." : "You're offline."} {pending > 0
            ? `${pending} change${pending > 1 ? "s" : ""} waiting to send.`
            : "No pending changes."}
        </div>
        {pending > 0 && (
          <ul className="max-h-56 overflow-auto space-y-1 text-xs border-t pt-2">
            {queue.slice(0, 12).map(op => (
              <li key={op.id} className="flex items-center justify-between gap-2">
                <span className="truncate">
                  <span className="font-mono">{op.kind}</span> · {op.table}
                  {op.tries > 0 && <span className="text-amber-600 ml-1">(retry {op.tries})</span>}
                </span>
              </li>
            ))}
            {pending > 12 && <li className="text-muted-foreground">+{pending - 12} more…</li>}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}