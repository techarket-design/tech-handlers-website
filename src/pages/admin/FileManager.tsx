import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Upload, Trash2, Copy, Search, Image, FileText, File, FolderOpen } from "lucide-react";

const BUCKET = "media";

function getFileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return Image;
  if (["pdf", "doc", "docx", "txt"].includes(ext)) return FileText;
  return File;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export default function FileManager() {
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [folder, setFolder] = useState("");

  const { data: files, isLoading } = useQuery({
    queryKey: ["storage_files", folder],
    queryFn: async () => {
      const { data, error } = await supabase.storage.from(BUCKET).list(folder || undefined, {
        limit: 200,
        sortBy: { column: "created_at", order: "desc" },
      });
      if (error) throw error;
      return data || [];
    },
  });

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList?.length) return;
    setUploading(true);
    let uploaded = 0;
    for (const file of Array.from(fileList)) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 10MB limit`);
        continue;
      }
      const path = `${folder ? folder + "/" : ""}${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file);
      if (error) toast.error(`Failed: ${file.name}`);
      else uploaded++;
    }
    if (uploaded) toast.success(`${uploaded} file(s) uploaded`);
    qc.invalidateQueries({ queryKey: ["storage_files"] });
    setUploading(false);
    e.target.value = "";
  }, [folder, qc]);

  const deleteFile = async (name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    const path = folder ? `${folder}/${name}` : name;
    const { error } = await supabase.storage.from(BUCKET).remove([path]);
    if (error) toast.error("Delete failed");
    else { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["storage_files"] }); }
  };

  const copyUrl = (name: string) => {
    const path = folder ? `${folder}/${name}` : name;
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    navigator.clipboard.writeText(data.publicUrl);
    toast.success("URL copied to clipboard");
  };

  const isImage = (name: string) => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(name);

  const filtered = files?.filter(f =>
    !f.name?.startsWith(".") && f.name?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const folders = filtered.filter(f => !f.metadata);
  const items = filtered.filter(f => f.metadata);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold text-lead">File Manager</h1>
        <label className="cursor-pointer">
          <Button asChild disabled={uploading}>
            <span><Upload className="mr-2 h-4 w-4" />{uploading ? "Uploading…" : "Upload Files"}</span>
          </Button>
          <input type="file" multiple className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      {folder && (
        <button onClick={() => setFolder("")} className="text-sm text-primary hover:underline mb-3 flex items-center gap-1">
          <FolderOpen className="h-3.5 w-3.5" /> ← Back to root
        </button>
      )}

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search files…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 max-w-sm" />
      </div>

      {isLoading ? (
        <div className="animate-pulse h-40 bg-muted rounded-xl" />
      ) : (
        <>
          {folders.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-6">
              {folders.map(f => (
                <button key={f.name} onClick={() => setFolder(f.name)} className="p-4 rounded-xl border border-border bg-surface-white hover:border-primary transition-colors text-center">
                  <FolderOpen className="h-8 w-8 mx-auto text-primary mb-2" />
                  <p className="text-xs font-medium truncate">{f.name}</p>
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {items.map(f => {
              const Icon = getFileIcon(f.name);
              const path = folder ? `${folder}/${f.name}` : f.name;
              const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
              return (
                <div key={f.name} className="rounded-xl border border-border bg-surface-white overflow-hidden group">
                  <div className="aspect-square bg-muted/30 flex items-center justify-center relative overflow-hidden">
                    {isImage(f.name) ? (
                      <img src={urlData.publicUrl} alt={f.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <Icon className="h-12 w-12 text-muted-foreground/50" />
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => copyUrl(f.name)}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => deleteFile(f.name)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-medium truncate" title={f.name}>{f.name}</p>
                    <p className="text-[10px] text-muted-foreground">{formatSize(f.metadata?.size || 0)}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {!items.length && !folders.length && (
            <div className="text-center py-12 text-muted-foreground">
              <File className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No files yet. Upload your first file above.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
