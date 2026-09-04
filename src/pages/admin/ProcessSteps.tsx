import { useState } from "react";
import { useEditingDraft } from "@/hooks/useEditingDraft";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAdminProcessSteps, useUpsertGenericRow, useDeleteGenericRow } from "@/hooks/useData";
import { Plus, Trash2 } from "lucide-react";

export default function AdminProcessSteps() {
  const { data: steps, isLoading } = useAdminProcessSteps();
  const upsert = useUpsertGenericRow("process_steps");
  const remove = useDeleteGenericRow("process_steps");
  const [editing, setEditing] = useEditingDraft<any>("process_steps");

  const blank = { title: "", description: "", detail: "", icon_name: "Scan", step_number: "01", color: "#6366f1", sort_order: 0, is_active: true };

  const save = async () => {
    if (!editing?.title || !editing?.description) return toast.error("Title and description required");
    await upsert.mutateAsync(editing);
    toast.success("Saved");
    setEditing(null);
  };

  if (isLoading) return <div className="animate-pulse h-40 bg-muted rounded-xl" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold text-lead">Process Steps</h1>
        <Button onClick={() => setEditing(blank)} className="gradient-primary-accent text-primary-foreground">
          <Plus className="mr-2 h-4 w-4" /> Add Step
        </Button>
      </div>

      {editing && (
        <div className="bg-surface-white rounded-xl border border-border p-6 mb-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label>Title</Label><Input value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} className="mt-1" /></div>
            <div><Label>Step Number</Label><Input value={editing.step_number} onChange={e => setEditing({ ...editing, step_number: e.target.value })} className="mt-1" /></div>
            <div><Label>Icon Name</Label><Input value={editing.icon_name} onChange={e => setEditing({ ...editing, icon_name: e.target.value })} className="mt-1" placeholder="Scan, Rocket, etc." /></div>
            <div><Label>Color</Label><Input type="color" value={editing.color} onChange={e => setEditing({ ...editing, color: e.target.value })} className="mt-1" /></div>
            <div><Label>Detail</Label><Input value={editing.detail || ""} onChange={e => setEditing({ ...editing, detail: e.target.value })} className="mt-1" /></div>
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
        {(steps as any[])?.map((step: any) => (
          <div key={step.id} className="bg-surface-white rounded-xl border border-border p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-primary mr-2">Step {step.step_number}</span>
              <span className="font-semibold text-lead">{step.title}</span>
              {!step.is_active && <span className="ml-2 text-xs text-muted-foreground">(inactive)</span>}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setEditing({ ...step })}>Edit</Button>
              <Button size="sm" variant="ghost" onClick={async () => { await remove.mutateAsync(step.id); toast.success("Deleted"); }}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
        {!(steps as any[])?.length && <p className="text-muted-foreground text-center py-8">No process steps yet</p>}
      </div>
    </div>
  );
}
