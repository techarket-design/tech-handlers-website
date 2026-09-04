import { useState } from "react";
import { useEditingDraft } from "@/hooks/useEditingDraft";
import { usePersistentState } from "@/hooks/usePersistentState";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Upload, Image as ImageIcon } from "lucide-react";
import { useGenericTable, useUpsertRow, useDeleteRow } from "@/hooks/useData";
import { supabase } from "@/integrations/supabase/client";

const PLATFORMS = ["instagram", "facebook", "twitter", "linkedin", "youtube"];

const blank = {
  platform: "instagram",
  image_url: "",
  caption: "",
  link_url: "",
  author_name: "Tech Handlers",
  author_handle: "@techhandlers",
  likes: 0,
  comments: 0,
  sort_order: 0,
  is_active: true,
};

async function uploadMedia(file: File): Promise<string | null> {
  if (file.size > 8 * 1024 * 1024) { toast.error("Image must be under 8MB"); return null; }
  const ext = file.name.split(".").pop();
  const path = `social-posts/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, file);
  if (error) { toast.error(error.message); return null; }
  return supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
}

export default function AdminSocialPosts() {
  const { data: items, isLoading } = useGenericTable("social_posts" as any, { orderBy: "sort_order" });
  const upsert = useUpsertRow("social_posts" as any);
  const remove = useDeleteRow("social_posts" as any);
  const [editing, setEditing] = useEditingDraft<any>("social_posts");
  const [showForm, setShowForm] = usePersistentState<boolean>("crm_show_form_social_posts", false);

  const open = (row?: any) => { setEditing(row ? { ...blank, ...row } : { ...blank }); setShowForm(true); };
  const close = () => { setEditing(null); setShowForm(false); };

  const save = async () => {
    if (!editing) return;
    if (!editing.image_url) return toast.error("Please upload an image");
    await upsert.mutateAsync(editing);
    toast.success("Post saved");
    close();
  };

  const del = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    await remove.mutateAsync(id);
    toast.success("Deleted");
  };

  const onUpload = async (file: File) => {
    const url = await uploadMedia(file);
    if (url) setEditing((e: any) => ({ ...e, image_url: url }));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-lead">Social Showcase Posts</h1>
          <p className="text-sm text-muted-foreground">Manage the homepage social wall — Instagram, Facebook, LinkedIn and more.</p>
        </div>
        <Button onClick={() => open()} className="gradient-primary-accent text-primary-foreground">
          <Plus className="h-4 w-4 mr-2" /> New Post
        </Button>
      </div>

      {isLoading ? (
        <div className="animate-pulse h-40 bg-muted rounded-xl" />
      ) : (
        <div className="bg-surface-white rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Caption</TableHead>
                <TableHead>Engagement</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(items as any[])?.map((row: any) => (
                <TableRow key={row.id}>
                  <TableCell>
                    {row.image_url ? (
                      <img src={row.image_url} alt="" className="h-12 w-12 rounded object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{row.platform}</Badge></TableCell>
                  <TableCell className="max-w-[280px] truncate">{row.caption}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">♥ {row.likes} · 💬 {row.comments}</TableCell>
                  <TableCell>{row.sort_order}</TableCell>
                  <TableCell>{row.is_active ? <Badge>Live</Badge> : <Badge variant="secondary">Off</Badge>}</TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => open(row)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => del(row.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {!(items as any[])?.length && (
                <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">No posts yet — add your first one.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {showForm && editing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={close}>
          <div className="bg-surface-white rounded-2xl max-w-2xl w-full p-6 my-8" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-display font-bold text-lead mb-5">{editing.id ? "Edit Post" : "New Post"}</h2>
            <div className="space-y-4">
              <div>
                <Label>Image</Label>
                <div className="mt-2 flex items-center gap-3">
                  {editing.image_url ? (
                    <img src={editing.image_url} alt="" className="h-24 w-24 rounded-lg object-cover border border-border" />
                  ) : (
                    <div className="h-24 w-24 rounded-lg bg-muted flex items-center justify-center"><ImageIcon className="h-6 w-6 text-muted-foreground" /></div>
                  )}
                  <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-md border border-border hover:bg-muted text-sm">
                    <Upload className="h-4 w-4" /> Upload
                    <input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
                  </label>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label>Platform</Label>
                  <Select value={editing.platform} onValueChange={(v) => setEditing({ ...editing, platform: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PLATFORMS.map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Sort Order</Label>
                  <Input type="number" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} className="mt-1" />
                </div>
              </div>

              <div>
                <Label>Caption</Label>
                <Textarea value={editing.caption || ""} onChange={(e) => setEditing({ ...editing, caption: e.target.value })} rows={2} className="mt-1" />
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label>Author Name</Label>
                  <Input value={editing.author_name || ""} onChange={(e) => setEditing({ ...editing, author_name: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label>Author Handle</Label>
                  <Input value={editing.author_handle || ""} onChange={(e) => setEditing({ ...editing, author_handle: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label>Likes</Label>
                  <Input type="number" value={editing.likes} onChange={(e) => setEditing({ ...editing, likes: Number(e.target.value) })} className="mt-1" />
                </div>
                <div>
                  <Label>Comments</Label>
                  <Input type="number" value={editing.comments} onChange={(e) => setEditing({ ...editing, comments: Number(e.target.value) })} className="mt-1" />
                </div>
              </div>

              <div>
                <Label>Link URL (optional)</Label>
                <Input value={editing.link_url || ""} onChange={(e) => setEditing({ ...editing, link_url: e.target.value })} placeholder="https://instagram.com/..." className="mt-1" />
              </div>

              <div className="flex items-center gap-2">
                <Switch checked={editing.is_active} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} />
                <Label>Active (show on homepage)</Label>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={close}>Cancel</Button>
              <Button onClick={save} disabled={upsert.isPending} className="gradient-primary-accent text-primary-foreground">Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
