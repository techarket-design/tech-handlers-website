import { useState } from "react";
import { useEditingDraft } from "@/hooks/useEditingDraft";
import { usePersistentState } from "@/hooks/usePersistentState";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useAdminHeroSlides, useUpsertRow, useDeleteRow } from "@/hooks/useData";

export default function AdminHeroSlides() {
  const { data: slides, isLoading } = useAdminHeroSlides();
  const upsert = useUpsertRow("hero_slides");
  const remove = useDeleteRow("hero_slides");
  const [editing, setEditing] = useEditingDraft<any>("hero_slides");
  const [showForm, setShowForm] = usePersistentState<boolean>("crm_show_form_hero_slides", false);

  const blank = { title: "", subtitle: "", cta_text: "Get Your Free Audit", cta_link: "#contact", graphic_type: "revenue", sort_order: 0, is_active: true };
  const openNew = () => { setEditing(blank); setShowForm(true); };
  const openEdit = (s: any) => { setEditing({ ...s }); setShowForm(true); };
  const close = () => { setEditing(null); setShowForm(false); };

  const save = async () => {
    if (!editing.title) return toast.error("Title required");
    await upsert.mutateAsync(editing);
    toast.success("Slide saved");
    close();
  };

  if (isLoading) return <div className="animate-pulse h-40 bg-muted rounded-xl" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold text-lead">Hero Slides</h1>
        <Button onClick={openNew} className="gradient-primary-accent text-primary-foreground"><Plus className="mr-2 h-4 w-4" /> Add Slide</Button>
      </div>

      {showForm && editing && (
        <div className="bg-surface-white rounded-xl border border-border p-6 mb-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label>Title</Label><Input value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} className="mt-1" /></div>
            <div><Label>Subtitle</Label><Input value={editing.subtitle || ""} onChange={e => setEditing({ ...editing, subtitle: e.target.value })} className="mt-1" /></div>
            <div><Label>CTA Text</Label><Input value={editing.cta_text || ""} onChange={e => setEditing({ ...editing, cta_text: e.target.value })} className="mt-1" /></div>
            <div><Label>CTA Link</Label><Input value={editing.cta_link || ""} onChange={e => setEditing({ ...editing, cta_link: e.target.value })} className="mt-1" /></div>
            <div>
              <Label>Graphic Type</Label>
              <select value={editing.graphic_type || "revenue"} onChange={e => setEditing({ ...editing, graphic_type: e.target.value })} className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="revenue">Revenue Growth</option>
                <option value="seo">SEO Rankings</option>
                <option value="leads">Lead Funnel</option>
                <option value="dashboard">Dashboard</option>
              </select>
            </div>
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
          <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Type</TableHead><TableHead>Order</TableHead><TableHead>Active</TableHead><TableHead className="w-24">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {slides?.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.title}</TableCell>
                <TableCell className="text-muted-foreground text-sm capitalize">{s.graphic_type}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{s.sort_order}</TableCell>
                <TableCell>{s.is_active ? <span className="text-success text-xs font-bold">Active</span> : <span className="text-destructive text-xs">Inactive</span>}</TableCell>
                <TableCell><div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => { if (confirm("Delete?")) remove.mutateAsync(s.id).then(() => toast.success("Deleted")); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div></TableCell>
              </TableRow>
            ))}
            {!slides?.length && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No slides yet</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
