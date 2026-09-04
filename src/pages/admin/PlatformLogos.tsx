import { useState } from "react";
import { useEditingDraft } from "@/hooks/useEditingDraft";
import { usePersistentState } from "@/hooks/usePersistentState";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useGenericTable, useUpsertGenericRow, useDeleteGenericRow } from "@/hooks/useData";

export default function AdminPlatformLogos() {
  const { data: logos, isLoading } = useGenericTable("platform_logos", { orderBy: "sort_order" });
  const upsert = useUpsertGenericRow("platform_logos");
  const remove = useDeleteGenericRow("platform_logos");
  const [editing, setEditing] = useEditingDraft<any>("platform_logos");
  const [showForm, setShowForm] = usePersistentState<boolean>("crm_show_form_platform_logos", false);

  const blank = { name: "", logo_url: "", website_url: "", sort_order: 0, is_active: true };
  const openNew = () => { setEditing(blank); setShowForm(true); };
  const openEdit = (b: any) => { setEditing({ ...b }); setShowForm(true); };
  const close = () => { setEditing(null); setShowForm(false); };

  const save = async () => {
    if (!editing.name) return toast.error("Name is required");
    await upsert.mutateAsync(editing);
    toast.success("Platform saved");
    close();
  };

  if (isLoading) return <div className="animate-pulse h-40 bg-muted rounded-xl" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold text-lead">Platform Logos</h1>
        <Button onClick={openNew} className="gradient-primary-accent text-primary-foreground"><Plus className="mr-2 h-4 w-4" /> Add Platform</Button>
      </div>

      {showForm && editing && (
        <div className="bg-surface-white rounded-xl border border-border p-6 mb-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label>Name</Label><Input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} className="mt-1" /></div>
            <div><Label>Logo URL</Label><Input value={editing.logo_url || ""} onChange={e => setEditing({ ...editing, logo_url: e.target.value })} className="mt-1" /></div>
            <div><Label>Website URL</Label><Input value={editing.website_url || ""} onChange={e => setEditing({ ...editing, website_url: e.target.value })} className="mt-1" /></div>
            <div><Label>Sort Order</Label><Input type="number" value={editing.sort_order} onChange={e => setEditing({ ...editing, sort_order: parseInt(e.target.value) || 0 })} className="mt-1" /></div>
          </div>
          <label className="flex items-center gap-2"><input type="checkbox" checked={editing.is_active} onChange={e => setEditing({ ...editing, is_active: e.target.checked })} /><span className="text-sm">Active</span></label>
          <div className="flex gap-2">
            <Button onClick={save} disabled={upsert.isPending}>Save</Button>
            <Button variant="outline" onClick={close}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="bg-surface-white rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Logo</TableHead><TableHead>Active</TableHead><TableHead className="w-24">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {(logos as any[])?.map((b: any) => (
              <TableRow key={b.id}>
                <TableCell className="font-medium">{b.name}</TableCell>
                <TableCell>{b.logo_url ? <img src={b.logo_url} alt={b.name} className="h-6" /> : <span className="text-muted-foreground text-xs">No logo</span>}</TableCell>
                <TableCell>{b.is_active ? <span className="text-success text-xs font-bold">Active</span> : <span className="text-destructive text-xs">Inactive</span>}</TableCell>
                <TableCell><div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(b)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => { if (confirm("Delete?")) remove.mutateAsync(b.id).then(() => toast.success("Deleted")); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div></TableCell>
              </TableRow>
            ))}
            {!logos?.length && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No platforms yet</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
