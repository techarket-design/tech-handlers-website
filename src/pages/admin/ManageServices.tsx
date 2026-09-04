import { useState } from "react";
import { useEditingDraft } from "@/hooks/useEditingDraft";
import { usePersistentState } from "@/hooks/usePersistentState";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import { useAdminServices, useUpsertRow, useDeleteRow } from "@/hooks/useData";

export default function ManageServices() {
  const { data: services, isLoading } = useAdminServices();
  const upsert = useUpsertRow("services");
  const remove = useDeleteRow("services");
  const [editing, setEditing] = useEditingDraft<any>("services");
  const [showForm, setShowForm] = usePersistentState<boolean>("crm_show_form_services", false);

  const blank = { name: "", slug: "", short_description: "", full_description: "", icon_name: "Settings", sort_order: 0, is_active: true, meta_title: "", meta_description: "" };

  const openNew = () => { setEditing(blank); setShowForm(true); };
  const openEdit = (s: any) => { setEditing({ ...s }); setShowForm(true); };
  const close = () => { setEditing(null); setShowForm(false); };

  const save = async () => {
    if (!editing.name || !editing.slug) return toast.error("Name and slug are required");
    await upsert.mutateAsync(editing);
    toast.success("Service saved");
    close();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this service?")) return;
    await remove.mutateAsync(id);
    toast.success("Service deleted");
  };

  if (isLoading) return <div className="animate-pulse h-40 bg-muted rounded-xl" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold text-lead">Services</h1>
        <Button onClick={openNew} className="gradient-primary-accent text-primary-foreground">
          <Plus className="mr-2 h-4 w-4" /> Add Service
        </Button>
      </div>

      {showForm && editing && (
        <div className="bg-surface-white rounded-xl border border-border p-6 mb-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label>Name</Label><Input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} className="mt-1" /></div>
            <div><Label>Slug</Label><Input value={editing.slug} onChange={e => setEditing({ ...editing, slug: e.target.value })} className="mt-1" /></div>
            <div><Label>Icon (Lucide name)</Label><Input value={editing.icon_name || ""} onChange={e => setEditing({ ...editing, icon_name: e.target.value })} className="mt-1" /></div>
            <div><Label>Sort Order</Label><Input type="number" value={editing.sort_order} onChange={e => setEditing({ ...editing, sort_order: parseInt(e.target.value) || 0 })} className="mt-1" /></div>
          </div>
          <div><Label>Short Description</Label><Textarea value={editing.short_description || ""} onChange={e => setEditing({ ...editing, short_description: e.target.value })} className="mt-1" /></div>
          <div><Label>Full Description</Label><Textarea value={editing.full_description || ""} onChange={e => setEditing({ ...editing, full_description: e.target.value })} rows={4} className="mt-1" /></div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label>Meta Title</Label><Input value={editing.meta_title || ""} onChange={e => setEditing({ ...editing, meta_title: e.target.value })} className="mt-1" /></div>
            <div><Label>Meta Description</Label><Input value={editing.meta_description || ""} onChange={e => setEditing({ ...editing, meta_description: e.target.value })} className="mt-1" /></div>
          </div>
          <label className="flex items-center gap-2"><input type="checkbox" checked={editing.is_active} onChange={e => setEditing({ ...editing, is_active: e.target.checked })} /><span className="text-sm">Active</span></label>
          <div className="flex gap-2"><Button onClick={save} disabled={upsert.isPending}>Save</Button><Button variant="outline" onClick={close}>Cancel</Button></div>
        </div>
      )}

      <div className="bg-surface-white rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead className="w-10">#</TableHead><TableHead>Name</TableHead><TableHead>Slug</TableHead><TableHead>Active</TableHead><TableHead className="w-24">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {services?.map((s) => (
              <TableRow key={s.id}>
                <TableCell><GripVertical className="h-4 w-4 text-muted-foreground" /></TableCell>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{s.slug}</TableCell>
                <TableCell>{s.is_active ? <span className="text-success text-xs font-bold">Active</span> : <span className="text-destructive text-xs">Inactive</span>}</TableCell>
                <TableCell><div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div></TableCell>
              </TableRow>
            ))}
            {!services?.length && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No services yet</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
