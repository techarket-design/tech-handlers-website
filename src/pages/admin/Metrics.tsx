import { useState } from "react";
import { useEditingDraft } from "@/hooks/useEditingDraft";
import { usePersistentState } from "@/hooks/usePersistentState";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useAdminMetrics, useUpsertRow, useDeleteRow } from "@/hooks/useData";

export default function AdminMetrics() {
  const { data: items, isLoading } = useAdminMetrics();
  const upsert = useUpsertRow("metrics");
  const remove = useDeleteRow("metrics");
  const [editing, setEditing] = useEditingDraft<any>("metrics");
  const [showForm, setShowForm] = usePersistentState<boolean>("crm_show_form_metrics", false);

  const blank = { label: "", value: "", suffix: "", icon_name: "TrendingUp", sort_order: 0, is_active: true };
  const openNew = () => { setEditing(blank); setShowForm(true); };
  const openEdit = (m: any) => { setEditing({ ...m }); setShowForm(true); };
  const close = () => { setEditing(null); setShowForm(false); };

  const save = async () => {
    if (!editing.label || !editing.value) return toast.error("Label and value required");
    await upsert.mutateAsync(editing);
    toast.success("Metric saved");
    close();
  };

  if (isLoading) return <div className="animate-pulse h-40 bg-muted rounded-xl" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold text-lead">Metrics / Stats</h1>
        <Button onClick={openNew} className="gradient-primary-accent text-primary-foreground"><Plus className="mr-2 h-4 w-4" /> Add Metric</Button>
      </div>

      {showForm && editing && (
        <div className="bg-surface-white rounded-xl border border-border p-6 mb-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label>Label</Label><Input value={editing.label} onChange={e => setEditing({ ...editing, label: e.target.value })} className="mt-1" placeholder="Revenue Generated" /></div>
            <div><Label>Value (number)</Label><Input value={editing.value} onChange={e => setEditing({ ...editing, value: e.target.value })} className="mt-1" placeholder="500" /></div>
            <div><Label>Suffix</Label><Input value={editing.suffix || ""} onChange={e => setEditing({ ...editing, suffix: e.target.value })} className="mt-1" placeholder="Cr+" /></div>
            <div><Label>Icon (Lucide name)</Label><Input value={editing.icon_name || ""} onChange={e => setEditing({ ...editing, icon_name: e.target.value })} className="mt-1" /></div>
          </div>
          <label className="flex items-center gap-2"><input type="checkbox" checked={editing.is_active} onChange={e => setEditing({ ...editing, is_active: e.target.checked })} /><span className="text-sm">Active</span></label>
          <div className="flex gap-2"><Button onClick={save} disabled={upsert.isPending}>Save</Button><Button variant="outline" onClick={close}>Cancel</Button></div>
        </div>
      )}

      <div className="bg-surface-white rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead>Label</TableHead><TableHead>Value</TableHead><TableHead>Suffix</TableHead><TableHead>Active</TableHead><TableHead className="w-24">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {items?.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{m.label}</TableCell>
                <TableCell className="text-lead font-bold">{m.value}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{m.suffix}</TableCell>
                <TableCell>{m.is_active ? <span className="text-success text-xs font-bold">Active</span> : <span className="text-destructive text-xs">Inactive</span>}</TableCell>
                <TableCell><div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(m)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => { if (confirm("Delete?")) remove.mutateAsync(m.id).then(() => toast.success("Deleted")); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div></TableCell>
              </TableRow>
            ))}
            {!items?.length && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No metrics yet</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
