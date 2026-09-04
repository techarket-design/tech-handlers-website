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
import { useAdminFaqs, useUpsertRow, useDeleteRow } from "@/hooks/useData";

export default function AdminFAQs() {
  const { data: items, isLoading } = useAdminFaqs();
  const upsert = useUpsertRow("faqs");
  const remove = useDeleteRow("faqs");
  const [editing, setEditing] = useEditingDraft<any>("faqs");
  const [showForm, setShowForm] = usePersistentState<boolean>("crm_show_form_faqs", false);

  const blank = { question: "", answer: "", category: "general", sort_order: 0, is_active: true };
  const openNew = () => { setEditing(blank); setShowForm(true); };
  const openEdit = (f: any) => { setEditing({ ...f }); setShowForm(true); };
  const close = () => { setEditing(null); setShowForm(false); };

  const save = async () => {
    if (!editing.question || !editing.answer) return toast.error("Question and answer required");
    await upsert.mutateAsync(editing);
    toast.success("FAQ saved");
    close();
  };

  if (isLoading) return <div className="animate-pulse h-40 bg-muted rounded-xl" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold text-lead">FAQs</h1>
        <Button onClick={openNew} className="gradient-primary-accent text-primary-foreground"><Plus className="mr-2 h-4 w-4" /> Add FAQ</Button>
      </div>

      {showForm && editing && (
        <div className="bg-surface-white rounded-xl border border-border p-6 mb-6 space-y-4">
          <div><Label>Question</Label><Input value={editing.question} onChange={e => setEditing({ ...editing, question: e.target.value })} className="mt-1" /></div>
          <div><Label>Answer</Label><Textarea value={editing.answer} onChange={e => setEditing({ ...editing, answer: e.target.value })} rows={3} className="mt-1" /></div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label>Category</Label><Input value={editing.category || ""} onChange={e => setEditing({ ...editing, category: e.target.value })} className="mt-1" /></div>
            <div><Label>Sort Order</Label><Input type="number" value={editing.sort_order} onChange={e => setEditing({ ...editing, sort_order: parseInt(e.target.value) || 0 })} className="mt-1" /></div>
          </div>
          <label className="flex items-center gap-2"><input type="checkbox" checked={editing.is_active} onChange={e => setEditing({ ...editing, is_active: e.target.checked })} /><span className="text-sm">Active</span></label>
          <div className="flex gap-2"><Button onClick={save} disabled={upsert.isPending}>Save</Button><Button variant="outline" onClick={close}>Cancel</Button></div>
        </div>
      )}

      <div className="bg-surface-white rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead>Question</TableHead><TableHead>Category</TableHead><TableHead>Active</TableHead><TableHead className="w-24">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {items?.map((f) => (
              <TableRow key={f.id}>
                <TableCell className="font-medium max-w-xs truncate">{f.question}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{f.category}</TableCell>
                <TableCell>{f.is_active ? <span className="text-success text-xs font-bold">Active</span> : <span className="text-destructive text-xs">Inactive</span>}</TableCell>
                <TableCell><div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(f)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => { if (confirm("Delete?")) remove.mutateAsync(f.id).then(() => toast.success("Deleted")); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div></TableCell>
              </TableRow>
            ))}
            {!items?.length && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No FAQs yet</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
