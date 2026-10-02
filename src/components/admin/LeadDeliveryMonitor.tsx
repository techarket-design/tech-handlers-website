import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
export default function LeadDeliveryMonitor() {
  const [retrying, setRetrying] = useState(false);
  const query = useQuery({
    queryKey: ["lead_notification_outbox"],
    queryFn: async () => {
      const { data, error } = await supabase.from("lead_notification_outbox" as never).select("status,attempts,last_error").eq("status", "pending").limit(1000);
      if (error) throw error;
      return data as unknown as { status: string; attempts: number; last_error: string | null }[];
    },
    refetchInterval: 30_000,
    retry: false,
  });
  const retry = async () => {
    setRetrying(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch("/api/lead-notifications", { method: "POST", headers: { Authorization: `Bearer ${session?.access_token || ""}` } });
      if (!response.ok) throw new Error("Retry unavailable");
      const result = await response.json();
      toast.success(`${result.sent} notifications sent. Failed jobs remain queued.`);
      await query.refetch();
    } catch { toast.error("Could not retry notifications. Check the deployment configuration."); }
    finally { setRetrying(false); }
  };
  return <div className="rounded-xl border border-border bg-surface-white p-4 flex flex-wrap items-center justify-between gap-3">
    <div><p className="font-semibold text-lead">Email notification delivery</p><p className="text-sm text-muted-foreground">{query.isError ? "Apply the lead migration to enable delivery monitoring." : `${query.data?.length || 0} pending notifications. Enquiries remain saved in the CRM.`}</p>{query.data?.find(job => job.last_error) && <p className="text-xs text-muted-foreground mt-1">Provider/configuration failure recorded. Check Vercel environment settings.</p>}</div>
    <Button variant="outline" disabled={retrying || query.isError} onClick={retry}>{retrying ? "Retrying…" : "Retry due notifications"}</Button>
  </div>;
}
