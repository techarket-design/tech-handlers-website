import { useState } from "react";
import { useEditingDraft } from "@/hooks/useEditingDraft";
import { usePersistentState } from "@/hooks/usePersistentState";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Code } from "lucide-react";
import { useAdminTrackingScripts, useUpsertRow, useDeleteRow } from "@/hooks/useData";

export default function AdminTracking() {
  const { data: scripts, isLoading } = useAdminTrackingScripts();
  const upsert = useUpsertRow("tracking_scripts");
  const remove = useDeleteRow("tracking_scripts");
  const [editing, setEditing] = useEditingDraft<any>("tracking");
  const [showForm, setShowForm] = usePersistentState<boolean>("crm_show_form_tracking", false);

  const blank = { name: "", script_type: "gtm", script_id: "", head_code: "", body_code: "", is_active: true };
  const openNew = () => { setEditing(blank); setShowForm(true); };
  const openEdit = (s: any) => { setEditing({ ...s }); setShowForm(true); };
  const close = () => { setEditing(null); setShowForm(false); };

  const save = async () => {
    if (!editing.name || !editing.script_type) return toast.error("Name and type required");
    await upsert.mutateAsync(editing);
    toast.success("Tracking script saved");
    close();
  };

  if (isLoading) return <div className="animate-pulse h-40 bg-muted rounded-xl" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-lead">Tracking & Pixels</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage GTM, Meta Pixel, Google Ads tags and custom scripts</p>
        </div>
        <Button onClick={openNew} className="gradient-primary-accent text-primary-foreground"><Plus className="mr-2 h-4 w-4" /> Add Script</Button>
      </div>

      {showForm && editing && (
        <div className="bg-surface-white rounded-xl border border-border p-6 mb-6 space-y-4">
          <div className="grid sm:grid-cols-3 gap-4">
            <div><Label>Name</Label><Input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} className="mt-1" placeholder="Google Tag Manager" /></div>
            <div>
              <Label>Type</Label>
              <select value={editing.script_type} onChange={e => setEditing({ ...editing, script_type: e.target.value })} className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="gtm">Google Tag Manager</option>
                <option value="meta_pixel">Meta Pixel</option>
                <option value="google_ads">Google Ads</option>
                <option value="google_analytics">Google Analytics</option>
                <option value="custom">Custom Script</option>
              </select>
            </div>
            <div><Label>Script/Pixel ID</Label><Input value={editing.script_id || ""} onChange={e => setEditing({ ...editing, script_id: e.target.value })} className="mt-1" placeholder="GTM-XXXXX" /></div>
          </div>
          <div><Label>Head Code (injected in &lt;head&gt;)</Label><Textarea value={editing.head_code || ""} onChange={e => setEditing({ ...editing, head_code: e.target.value })} rows={4} className="mt-1 font-mono text-xs" /></div>
          <div><Label>Body Code (injected in &lt;body&gt;)</Label><Textarea value={editing.body_code || ""} onChange={e => setEditing({ ...editing, body_code: e.target.value })} rows={4} className="mt-1 font-mono text-xs" /></div>
          <label className="flex items-center gap-2"><input type="checkbox" checked={editing.is_active} onChange={e => setEditing({ ...editing, is_active: e.target.checked })} /><span className="text-sm">Active</span></label>
          <div className="flex gap-2"><Button onClick={save} disabled={upsert.isPending}>Save</Button><Button variant="outline" onClick={close}>Cancel</Button></div>
        </div>
      )}

      <div className="bg-surface-white rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>ID</TableHead><TableHead>Active</TableHead><TableHead className="w-24">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {scripts?.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell><span className="text-xs bg-muted px-2 py-0.5 rounded uppercase font-semibold">{s.script_type}</span></TableCell>
                <TableCell className="text-muted-foreground text-sm font-mono">{s.script_id || "—"}</TableCell>
                <TableCell>{s.is_active ? <span className="text-success text-xs font-bold">Active</span> : <span className="text-destructive text-xs">Inactive</span>}</TableCell>
                <TableCell><div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => { if (confirm("Delete?")) remove.mutateAsync(s.id).then(() => toast.success("Deleted")); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div></TableCell>
              </TableRow>
            ))}
            {!scripts?.length && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No tracking scripts configured</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
