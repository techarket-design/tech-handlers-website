import { useState } from "react";
import { useEditingDraft } from "@/hooks/useEditingDraft";
import { usePersistentState } from "@/hooks/usePersistentState";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Upload, Loader2, Video as VideoIcon, Image as ImageIcon } from "lucide-react";
import { useGenericTable, useUpsertGenericRow } from "@/hooks/useData";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

type VideoRow = {
  id?: string;
  title: string;
  description?: string;
  poster_url?: string;
  video_url: string;
  video_url_hd?: string;
  video_url_sd?: string;
  sort_order: number;
  is_active: boolean;
};

const blank: VideoRow = {
  title: "",
  description: "",
  poster_url: "",
  video_url: "",
  video_url_hd: "",
  video_url_sd: "",
  sort_order: 0,
  is_active: true,
};

export default function AdminVideoShowcase() {
  const { data: items, isLoading } = useGenericTable("video_showcase_items", { orderBy: "sort_order", ascending: true });
  const upsert = useUpsertGenericRow("video_showcase_items");
  const qc = useQueryClient();
  const [editing, setEditing] = useEditingDraft<VideoRow | null>("video_showcase_items");
  const [showForm, setShowForm] = usePersistentState<boolean>("crm_show_form_video_showcase", false);
  const [uploading, setUploading] = useState<null | "video" | "video_hd" | "video_sd" | "poster">(null);

  const openNew = () => { setEditing(blank); setShowForm(true); };
  const openEdit = (s: VideoRow) => { setEditing({ ...s }); setShowForm(true); };
  const close = () => { setEditing(null); setShowForm(false); };

  const upload = async (file: File, kind: "video" | "video_hd" | "video_sd" | "poster") => {
    if (!editing) return;
    if (file.size > 200 * 1024 * 1024) return toast.error("File must be under 200MB");
    setUploading(kind);
    const ext = file.name.split(".").pop();
    const path = `video-showcase/${Date.now()}-${kind}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(path, file, {
      cacheControl: "31536000",
      upsert: false,
      contentType: file.type,
    });
    if (error) { toast.error(`Upload failed: ${error.message}`); setUploading(null); return; }
    const { data } = supabase.storage.from("media").getPublicUrl(path);
    const field = kind === "poster" ? "poster_url" : kind === "video" ? "video_url" : kind === "video_hd" ? "video_url_hd" : "video_url_sd";
    setEditing({ ...editing, [field]: data.publicUrl } as VideoRow);
    setUploading(null);
    toast.success(`${kind === "poster" ? "Poster" : "Video"} uploaded`);
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.title.trim()) return toast.error("Title required");
    if (!editing.video_url) return toast.error("Upload a video (or paste a URL)");
    await upsert.mutateAsync(editing as any);
    toast.success("Video saved");
    close();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this video?")) return;
    const { error } = await supabase.from("video_showcase_items" as any).delete().eq("id", id);
    if (error) return toast.error("Delete failed");
    qc.invalidateQueries({ queryKey: ["video_showcase_items"] });
    toast.success("Deleted");
  };

  if (isLoading) return <div className="animate-pulse h-40 bg-muted rounded-xl" />;

  const FileButton = ({ kind, label, accept }: { kind: "video" | "video_hd" | "video_sd" | "poster"; label: string; accept: string }) => (
    <label className="inline-flex items-center gap-2 cursor-pointer text-xs px-3 py-2 rounded-md border border-border bg-surface-white hover:bg-muted transition-colors">
      {uploading === kind ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
      {uploading === kind ? "Uploading..." : label}
      <input type="file" accept={accept} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f, kind); e.target.value = ""; }} />
    </label>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-lead">Video Showcase</h1>
          <p className="text-sm text-muted-foreground">Videos shown on the homepage right after the hero. Upload multiple qualities so slow connections auto-load a lighter file.</p>
        </div>
        <Button onClick={openNew} className="gradient-primary-accent text-primary-foreground"><Plus className="mr-2 h-4 w-4" /> Add Video</Button>
      </div>

      {showForm && editing && (
        <div className="bg-surface-white rounded-xl border border-border p-6 mb-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Title</Label>
              <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>Sort Order</Label>
              <Input type="number" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: parseInt(e.target.value) || 0 })} className="mt-1" />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={2} className="mt-1" />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-dashed border-border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5"><VideoIcon className="h-4 w-4" /> Video (Best quality) *</Label>
                <FileButton kind="video" label="Upload video" accept="video/mp4,video/webm,video/quicktime" />
              </div>
              <Input placeholder="or paste video URL" value={editing.video_url} onChange={(e) => setEditing({ ...editing, video_url: e.target.value })} />
              {editing.video_url && <p className="text-[11px] text-success truncate">✓ {editing.video_url}</p>}
            </div>
            <div className="rounded-lg border border-dashed border-border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5"><ImageIcon className="h-4 w-4" /> Poster image</Label>
                <FileButton kind="poster" label="Upload poster" accept="image/*" />
              </div>
              <Input placeholder="or paste image URL" value={editing.poster_url || ""} onChange={(e) => setEditing({ ...editing, poster_url: e.target.value })} />
              {editing.poster_url && <img src={editing.poster_url} alt="" className="mt-2 h-20 w-full object-cover rounded" />}
            </div>
            <div className="rounded-lg border border-dashed border-border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5"><VideoIcon className="h-4 w-4" /> HD (medium) — optional</Label>
                <FileButton kind="video_hd" label="Upload HD" accept="video/mp4,video/webm" />
              </div>
              <Input placeholder="URL for 720p / medium bitrate" value={editing.video_url_hd || ""} onChange={(e) => setEditing({ ...editing, video_url_hd: e.target.value })} />
              {editing.video_url_hd && <p className="text-[11px] text-success truncate">✓ {editing.video_url_hd}</p>}
            </div>
            <div className="rounded-lg border border-dashed border-border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5"><VideoIcon className="h-4 w-4" /> SD (data saver) — optional</Label>
                <FileButton kind="video_sd" label="Upload SD" accept="video/mp4,video/webm" />
              </div>
              <Input placeholder="URL for 480p / low bitrate" value={editing.video_url_sd || ""} onChange={(e) => setEditing({ ...editing, video_url_sd: e.target.value })} />
              {editing.video_url_sd && <p className="text-[11px] text-success truncate">✓ {editing.video_url_sd}</p>}
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground">
            Tip: Best quality is required. HD and SD versions are auto-picked when a visitor is on a slower connection or has Data Saver on.
          </p>

          <label className="flex items-center gap-2">
            <input type="checkbox" checked={editing.is_active} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} />
            <span className="text-sm">Active (visible on homepage)</span>
          </label>
          <div className="flex gap-2">
            <Button onClick={save} disabled={upsert.isPending || !!uploading}>Save</Button>
            <Button variant="outline" onClick={close}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="bg-surface-white rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Preview</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Qualities</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(items as any[])?.map((s: VideoRow) => (
              <TableRow key={s.id}>
                <TableCell>
                  {s.poster_url ? (
                    <img src={s.poster_url} alt="" className="h-12 w-20 object-cover rounded" />
                  ) : (
                    <div className="h-12 w-20 rounded bg-muted flex items-center justify-center"><VideoIcon className="h-4 w-4 text-muted-foreground" /></div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{s.title}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {[s.video_url && "Best", s.video_url_hd && "HD", s.video_url_sd && "SD"].filter(Boolean).join(" · ") || "—"}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{s.sort_order}</TableCell>
                <TableCell>{s.is_active ? <span className="text-success text-xs font-bold">Active</span> : <span className="text-destructive text-xs">Inactive</span>}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => s.id && remove(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!(items as any[])?.length && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No videos yet — click "Add Video" to upload your first showcase reel.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}