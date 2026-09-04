import { useState } from "react";
import { useEditingDraft } from "@/hooks/useEditingDraft";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAdminRevenueEngineSegments, useUpsertGenericRow, useDeleteGenericRow } from "@/hooks/useData";
import { Plus, Trash2 } from "lucide-react";

export default function AdminRevenueEngine() {
  const { data: segments, isLoading } = useAdminRevenueEngineSegments();
  const upsert = useUpsertGenericRow("revenue_engine_segments");
  const remove = useDeleteGenericRow("revenue_engine_segments");
  const [editing, setEditing] = useEditingDraft<any>("revenue_engine");

  const blank = {
    segment_key: "", label: "", color: "#4A7BF7", icon_name: "Users",
    title: "", description: "", stat: "", sort_order: 0, is_active: true,
  };

  const save = async () => {
    if (!editing?.label || !editing?.title || !editing?.description || !editing?.stat) {
      return toast.error("Label, title, description and stat are required");
    }
    if (!editing.segment_key) editing.segment_key = editing.label.toLowerCase().replace(/\s+/g, "_");
    await upsert.mutateAsync(editing);
    toast.success("Saved");
    setEditing(null);
  };

  if (isLoading) return <div className="animate-pulse h-40 bg-muted rounded-xl" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold text-lead">Revenue Engine Segments</h1>
        <Button onClick={() => setEditing(blank)} className="gradient-primary-accent text-primary-foreground">
          <Plus className="mr-2 h-4 w-4" /> Add Segment
        </Button>
      </div>

      {editing && (
        <div className="bg-surface-white rounded-xl border border-border p-6 mb-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label>Label</Label><Input value={editing.label} onChange={e => setEditing({ ...editing, label: e.target.value })} className="mt-1" placeholder="e.g. Acquisition" /></div>
            <div><Label>Segment Key</Label><Input value={editing.segment_key} onChange={e => setEditing({ ...editing, segment_key: e.target.value })} className="mt-1" placeholder="acquisition" /></div>
            <div><Label>Title</Label><Input value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} className="mt-1" placeholder="Drive Qualified Traffic" /></div>
            <div><Label>Stat</Label><Input value={editing.stat} onChange={e => setEditing({ ...editing, stat: e.target.value })} className="mt-1" placeholder="3.2x ROI" /></div>
            <div><Label>Icon Name</Label><Input value={editing.icon_name} onChange={e => setEditing({ ...editing, icon_name: e.target.value })} className="mt-1" placeholder="Users, BarChart3, etc." /></div>
            <div><Label>Color</Label><Input type="color" value={editing.color} onChange={e => setEditing({ ...editing, color: e.target.value })} className="mt-1" /></div>
            <div><Label>Sort Order</Label><Input type="number" value={editing.sort_order} onChange={e => setEditing({ ...editing, sort_order: parseInt(e.target.value) || 0 })} className="mt-1" /></div>
          </div>
          <div><Label>Description</Label><textarea value={editing.description} onChange={e => setEditing({ ...editing, description: e.target.value })}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" rows={3} /></div>
          <div className="flex items-center gap-2">
            <Switch checked={editing.is_active} onCheckedChange={v => setEditing({ ...editing, is_active: v })} /><Label>Active</Label>
          </div>
          <div className="flex gap-2">
            <Button onClick={save} disabled={upsert.isPending}>{upsert.isPending ? "Saving..." : "Save"}</Button>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {(segments as any[])?.map((seg: any) => (
          <div key={seg.id} className="bg-surface-white rounded-xl border border-border p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: seg.color }} />
              <div>
                <span className="font-semibold text-lead">{seg.label}</span>
                <span className="ml-2 text-xs text-muted-foreground">{seg.stat}</span>
                {!seg.is_active && <span className="ml-2 text-xs text-muted-foreground">(inactive)</span>}
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setEditing({ ...seg })}>Edit</Button>
              <Button size="sm" variant="ghost" onClick={async () => { await remove.mutateAsync(seg.id); toast.success("Deleted"); }}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
        {!(segments as any[])?.length && <p className="text-muted-foreground text-center py-8">No segments yet</p>}
      </div>
    </div>
  );
}
