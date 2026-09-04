import { useState } from "react";
import { useGenericTable, useUpsertGenericRow } from "@/hooks/useData";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import * as Icons from "lucide-react";
import { toast } from "sonner";

type Row = { id: string; slug: string; label: string; sublabel: string | null; icon: string; is_enabled: boolean; sort_order: number };

function Ico({ name }: { name: string }) {
  const I = (Icons as any)[name] || Icons.ShieldCheck;
  return <I className="h-4 w-4 text-primary" />;
}

export default function TrustBadgesAdmin() {
  const { data, isLoading } = useGenericTable("trust_badges", { orderBy: "sort_order" });
  const upsert = useUpsertGenericRow("trust_badges");
  const [drafts, setDrafts] = useState<Record<string, Partial<Row>>>({});

  const rows = (data as unknown as Row[]) || [];

  const save = async (row: Row) => {
    const patch = drafts[row.id] || {};
    try {
      await upsert.mutateAsync({ ...row, ...patch });
      toast.success("Saved");
      setDrafts((d) => { const c = { ...d }; delete c[row.id]; return c; });
    } catch (e: any) { toast.error(e.message || "Save failed"); }
  };

  const toggle = async (row: Row, val: boolean) => {
    try { await upsert.mutateAsync({ ...row, is_enabled: val }); toast.success(val ? "Enabled" : "Disabled"); }
    catch (e: any) { toast.error(e.message || "Update failed"); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Trust Badges</h1>
        <p className="text-sm text-muted-foreground mt-1">Shown on homepage, footer, and contact form. Only enable badges for certifications you actually hold.</p>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      <div className="rounded-xl border border-border bg-surface-white divide-y divide-border">
        {rows.map((row) => {
          const draft = drafts[row.id] || {};
          const merged = { ...row, ...draft } as Row;
          const dirty = Object.keys(draft).length > 0;
          return (
            <div key={row.id} className="p-4 grid grid-cols-1 md:grid-cols-[auto_1fr_1fr_120px_auto_auto] gap-3 items-center">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center"><Ico name={merged.icon} /></div>
              <Input value={merged.label} onChange={(e) => setDrafts((d) => ({ ...d, [row.id]: { ...d[row.id], label: e.target.value } }))} placeholder="Label" />
              <Input value={merged.sublabel || ""} onChange={(e) => setDrafts((d) => ({ ...d, [row.id]: { ...d[row.id], sublabel: e.target.value } }))} placeholder="Sublabel" />
              <Input value={merged.icon} onChange={(e) => setDrafts((d) => ({ ...d, [row.id]: { ...d[row.id], icon: e.target.value } }))} placeholder="Lucide icon" />
              <Switch checked={merged.is_enabled} onCheckedChange={(v) => toggle(row, v)} />
              <Button size="sm" disabled={!dirty || upsert.isPending} onClick={() => save(row)}>Save</Button>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Icon names come from <a href="https://lucide.dev/icons" target="_blank" rel="noreferrer" className="underline">lucide.dev/icons</a>.
      </p>
    </div>
  );
}
