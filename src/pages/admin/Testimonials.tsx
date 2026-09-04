import { useState, useRef } from "react";
import { useEditingDraft } from "@/hooks/useEditingDraft";
import { usePersistentState } from "@/hooks/usePersistentState";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Upload, X } from "lucide-react";
import { useAdminTestimonials, useUpsertRow, useDeleteRow } from "@/hooks/useData";
import { supabase } from "@/integrations/supabase/client";

export default function AdminTestimonials() {
  const { data: items, isLoading } = useAdminTestimonials();
  const upsert = useUpsertRow("testimonials");
  const remove = useDeleteRow("testimonials");
  const [editing, setEditing] = useEditingDraft<any>("testimonials");
  const [showForm, setShowForm] = usePersistentState<boolean>("crm_show_form_testimonials", false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const blank = { name: "", company: "", role: "", content: "", rating: 5, sort_order: 0, is_active: true, avatar_url: "" };
  const openNew = () => { setEditing(blank); setShowForm(true); };
  const openEdit = (t: any) => { setEditing({ ...t }); setShowForm(true); };
  const close = () => { setEditing(null); setShowForm(false); };

  const uploadAvatar = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `testimonials/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("media").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("media").getPublicUrl(path);
      setEditing((prev: any) => ({ ...prev, avatar_url: urlData.publicUrl }));
      toast.success("Photo uploaded");
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!editing.name || !editing.content) return toast.error("Name and content required");
    await upsert.mutateAsync(editing);
    toast.success("Testimonial saved");
    close();
  };

  if (isLoading) return <div className="animate-pulse h-40 bg-muted rounded-xl" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold text-lead">Testimonials</h1>
        <Button onClick={openNew} className="gradient-primary-accent text-primary-foreground"><Plus className="mr-2 h-4 w-4" /> Add Testimonial</Button>
      </div>

      {showForm && editing && (
        <div className="bg-surface-white rounded-xl border border-border p-6 mb-6 space-y-4">
          {/* Avatar upload */}
          <div>
            <Label>Photo</Label>
            <div className="mt-1 flex items-center gap-4">
              {editing.avatar_url ? (
                <div className="relative">
                  <img src={editing.avatar_url} alt="avatar" className="w-16 h-16 rounded-full object-cover border border-border" />
                  <button onClick={() => setEditing({ ...editing, avatar_url: "" })} className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground border border-dashed border-border">
                  <Upload className="h-5 w-5" />
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) uploadAvatar(e.target.files[0]); }} />
              <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
                {uploading ? "Uploading..." : "Upload Photo"}
              </Button>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div><Label>Name</Label><Input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} className="mt-1" /></div>
            <div><Label>Company</Label><Input value={editing.company || ""} onChange={e => setEditing({ ...editing, company: e.target.value })} className="mt-1" /></div>
            <div><Label>Role</Label><Input value={editing.role || ""} onChange={e => setEditing({ ...editing, role: e.target.value })} className="mt-1" /></div>
          </div>
          <div><Label>Content</Label><Textarea value={editing.content} onChange={e => setEditing({ ...editing, content: e.target.value })} rows={3} className="mt-1" /></div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label>Rating (1-5)</Label><Input type="number" min={1} max={5} value={editing.rating} onChange={e => setEditing({ ...editing, rating: parseInt(e.target.value) || 5 })} className="mt-1" /></div>
            <div><Label>Sort Order</Label><Input type="number" value={editing.sort_order} onChange={e => setEditing({ ...editing, sort_order: parseInt(e.target.value) || 0 })} className="mt-1" /></div>
          </div>
          <label className="flex items-center gap-2"><input type="checkbox" checked={editing.is_active} onChange={e => setEditing({ ...editing, is_active: e.target.checked })} /><span className="text-sm">Active</span></label>
          <div className="flex gap-2"><Button onClick={save} disabled={upsert.isPending}>Save</Button><Button variant="outline" onClick={close}>Cancel</Button></div>
        </div>
      )}

      <div className="bg-surface-white rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead>Photo</TableHead><TableHead>Name</TableHead><TableHead>Company</TableHead><TableHead>Rating</TableHead><TableHead>Active</TableHead><TableHead className="w-24">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {items?.map((t) => (
              <TableRow key={t.id}>
                <TableCell>
                  {t.avatar_url ? (
                    <img src={t.avatar_url} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                      {t.name.split(" ").map((n: string) => n[0]).join("")}
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{t.name}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{t.company}</TableCell>
                <TableCell>{"⭐".repeat(t.rating || 5)}</TableCell>
                <TableCell>{t.is_active ? <span className="text-success text-xs font-bold">Active</span> : <span className="text-destructive text-xs">Inactive</span>}</TableCell>
                <TableCell><div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(t)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => { if (confirm("Delete?")) remove.mutateAsync(t.id).then(() => toast.success("Deleted")); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div></TableCell>
              </TableRow>
            ))}
            {!items?.length && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No testimonials yet</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
