import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Trash2, FileUp, MessageSquare, Flag, Clock, CheckCircle2, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { useEditingDraft } from "@/hooks/useEditingDraft";
import { useServerDraft } from "@/hooks/useServerDraft";
import { queueAndUpload } from "@/hooks/useResumableUpload";
import { useFileViewer } from "@/components/admin/FileViewer";

const MILESTONE_STATUS = [
  { value: "planned", label: "Planned", color: "bg-slate-200 text-slate-700" },
  { value: "in_progress", label: "In progress", color: "bg-blue-100 text-blue-700" },
  { value: "done", label: "Done", color: "bg-emerald-100 text-emerald-700" },
  { value: "blocked", label: "Blocked", color: "bg-red-100 text-red-700" },
];

const ENTRY_ICON: Record<string, any> = {
  note: MessageSquare, update: MessageSquare, status_change: Flag,
  milestone: CheckCircle2, file: FileUp, event: Clock,
};

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { hasModule } = useAuth();
  const { open: openFile } = useFileViewer();

  const { data: project, isLoading } = useQuery({
    queryKey: ["task_project", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("task_projects").select("*").eq("id", id!).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: journey } = useQuery({
    queryKey: ["project_journey", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("project_journey_entries" as any)
        .select("*").eq("project_id", id!).order("occurred_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!id,
  });

  const { data: milestones } = useQuery({
    queryKey: ["project_milestones", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("project_milestones" as any)
        .select("*").eq("project_id", id!).order("sort_order").order("created_at");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!id,
  });

  const { data: files } = useQuery({
    queryKey: ["project_files", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("project_files" as any)
        .select("*").eq("project_id", id!).order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!id,
  });

  // Realtime: refresh journey when new entries land
  useEffect(() => {
    if (!id) return;
    const ch = supabase.channel(`project-journey-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "project_journey_entries", filter: `project_id=eq.${id}` },
        () => qc.invalidateQueries({ queryKey: ["project_journey", id] }))
      .on("postgres_changes", { event: "*", schema: "public", table: "project_milestones", filter: `project_id=eq.${id}` },
        () => qc.invalidateQueries({ queryKey: ["project_milestones", id] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id, qc]);

  if (!hasModule("tasks")) return <div className="text-center py-12 text-muted-foreground">No access</div>;
  if (isLoading) return <div className="text-center py-12 text-muted-foreground">Loading…</div>;
  if (!project) return <div className="text-center py-12 text-muted-foreground">Project not found or no access</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin/tasks/projects")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Projects
        </Button>
      </div>
      <div className="bg-surface-white rounded-xl border border-border overflow-hidden">
        <div className="h-2" style={{ background: project.color }} />
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-display font-bold text-lead">{project.name}</h1>
              {project.client_name && <p className="text-sm text-muted-foreground mt-1">{project.client_name}</p>}
              {project.description && <p className="text-sm mt-3 text-foreground/80">{project.description}</p>}
            </div>
            {project.is_archived && <Badge variant="secondary">Archived</Badge>}
          </div>
        </div>
      </div>

      <Tabs defaultValue="timeline">
        <TabsList>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-4">
          <JourneyComposer projectId={id!} />
          <div className="space-y-3">
            {(journey ?? []).map((e: any) => {
              const Icon = ENTRY_ICON[e.entry_type] ?? Clock;
              const storagePath = e?.metadata?.storage_path as string | undefined;
              const fileUrl = storagePath
                ? supabase.storage.from("media").getPublicUrl(storagePath).data.publicUrl
                : null;
              return (
                <div key={e.id} className="bg-surface-white rounded-xl border border-border p-4 flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-medium text-lead">{e.title || e.entry_type}</p>
                      <p className="text-xs text-muted-foreground shrink-0">{new Date(e.occurred_at).toLocaleString()}</p>
                    </div>
                    {e.body && <p className="text-sm text-foreground/80 mt-1 whitespace-pre-wrap">{e.body}</p>}
                    {fileUrl && (
                      <button
                        onClick={() => openFile({ url: fileUrl, name: e.title?.replace(/^File uploaded:\s*/, "") || "file" })}
                        className="mt-2 text-xs text-primary hover:underline inline-flex items-center gap-1"
                      >
                        <FileUp className="h-3 w-3" /> Open file in app
                      </button>
                    )}
                    <Badge variant="outline" className="mt-2 text-[10px] uppercase">{e.entry_type}</Badge>
                  </div>
                </div>
              );
            })}
            {!journey?.length && <div className="text-center py-12 text-muted-foreground">No entries yet — add the first note above.</div>}
          </div>
        </TabsContent>

        <TabsContent value="milestones">
          <MilestonesTab projectId={id!} milestones={milestones ?? []} />
        </TabsContent>

        <TabsContent value="files">
          <FilesTab projectId={id!} files={files ?? []} />
        </TabsContent>

        <TabsContent value="overview">
          <OverviewTab project={project} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ---------------- Composer ---------------- */
function JourneyComposer({ projectId }: { projectId: string }) {
  const qc = useQueryClient();
  const defaults = { title: "", body: "", entry_type: "note" as const };
  const [draft, setDraft] = useEditingDraft<typeof defaults>(`project_note_${projectId}`, defaults);
  const form = draft ?? defaults;
  const { serverDraft, save: saveServer, clear: clearServer, saving } = useServerDraft<typeof defaults>("project_note", projectId);
  const [restored, setRestored] = useState(false);

  // Offer restore if server has a newer draft than local
  useEffect(() => {
    if (serverDraft?.payload && !restored && !draft) {
      setDraft(serverDraft.payload as any);
      setRestored(true);
      toast.info("Restored your last draft note");
    }
  }, [serverDraft, restored, draft, setDraft]);

  const update = (patch: Partial<typeof defaults>) => {
    const next = { ...form, ...patch };
    setDraft(next);
    saveServer(next);
  };

  const submit = async () => {
    if (!form.body.trim() && !form.title.trim()) return toast.error("Add a title or body");
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("project_journey_entries" as any).insert({
      project_id: projectId,
      entry_type: form.entry_type,
      title: form.title.trim() || null,
      body: form.body.trim() || null,
      author_id: u.user?.id,
    });
    if (error) return toast.error(error.message);
    setDraft(null);
    await clearServer();
    toast.success("Added to timeline");
    qc.invalidateQueries({ queryKey: ["project_journey", projectId] });
  };

  return (
    <div className="bg-surface-white rounded-xl border border-border p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Select value={form.entry_type} onValueChange={(v) => update({ entry_type: v as any })}>
          <SelectTrigger className="w-40 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="note">Note</SelectItem>
            <SelectItem value="update">Update</SelectItem>
            <SelectItem value="event">Event</SelectItem>
          </SelectContent>
        </Select>
        <Input value={form.title} onChange={(e) => update({ title: e.target.value })} placeholder="Optional title" className="h-8" />
        {saving && <span className="text-xs text-muted-foreground flex items-center gap-1"><Save className="h-3 w-3 animate-pulse" /> Saving draft…</span>}
      </div>
      <Textarea value={form.body} onChange={(e) => update({ body: e.target.value })} placeholder="What happened? Decision made, blocker, milestone hit, next step…" rows={3} />
      <div className="flex justify-between">
        <Button size="sm" variant="ghost" onClick={async () => { setDraft(null); await clearServer(); }}>Discard draft</Button>
        <Button size="sm" onClick={submit}>Post to timeline</Button>
      </div>
    </div>
  );
}

/* ---------------- Milestones ---------------- */
function MilestonesTab({ projectId, milestones }: { projectId: string; milestones: any[] }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const defaults = { title: "", description: "", target_date: "", status: "planned" };
  const [form, setForm] = useEditingDraft<typeof defaults>(`milestone_new_${projectId}`, defaults);
  const v = form ?? defaults;

  const create = async () => {
    if (!v.title.trim()) return toast.error("Title required");
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("project_milestones" as any).insert({
      project_id: projectId,
      title: v.title.trim(),
      description: v.description.trim() || null,
      target_date: v.target_date || null,
      status: v.status,
      created_by: u.user?.id,
    });
    if (error) return toast.error(error.message);
    setForm(null);
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["project_milestones", projectId] });
  };

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("project_milestones" as any).update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["project_milestones", projectId] });
  };
  const setProgress = async (id: string, progress: number) => {
    await supabase.from("project_milestones" as any).update({ progress }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["project_milestones", projectId] });
  };
  const remove = async (id: string) => {
    if (!confirm("Delete milestone?")) return;
    await supabase.from("project_milestones" as any).delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["project_milestones", projectId] });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> Milestone</Button>
      </div>
      {!milestones.length && <div className="text-center py-12 text-muted-foreground bg-surface-white rounded-xl border border-border">No milestones — add key checkpoints of the project.</div>}
      <div className="grid gap-3">
        {milestones.map((m: any) => {
          const st = MILESTONE_STATUS.find(s => s.value === m.status)!;
          return (
            <div key={m.id} className="bg-surface-white rounded-xl border border-border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-lead">{m.title}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded ${st.color}`}>{st.label}</span>
                    {m.target_date && <span className="text-xs text-muted-foreground">due {new Date(m.target_date).toLocaleDateString()}</span>}
                  </div>
                  {m.description && <p className="text-sm text-muted-foreground mt-1">{m.description}</p>}
                  <div className="flex items-center gap-3 mt-3">
                    <Progress value={m.progress} className="flex-1 h-2" />
                    <input type="number" min={0} max={100} value={m.progress}
                      onChange={(e) => setProgress(m.id, Number(e.target.value))}
                      className="w-16 h-7 text-xs border border-border rounded px-2" />
                    <span className="text-xs text-muted-foreground">%</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <Select value={m.status} onValueChange={(v) => setStatus(m.id, v)}>
                    <SelectTrigger className="w-32 h-7 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MILESTONE_STATUS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="ghost" className="text-destructive h-7" onClick={() => remove(m.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New milestone</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Title *</Label><Input value={v.title} onChange={(e) => setForm({ ...v, title: e.target.value })} /></div>
            <div><Label>Description</Label><Textarea value={v.description} onChange={(e) => setForm({ ...v, description: e.target.value })} rows={2} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Target date</Label><Input type="date" value={v.target_date} onChange={(e) => setForm({ ...v, target_date: e.target.value })} /></div>
              <div><Label>Status</Label>
                <Select value={v.status} onValueChange={(x) => setForm({ ...v, status: x })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{MILESTONE_STATUS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Draft auto-saves as you type — switch tabs freely.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setForm(null); setOpen(false); }}>Discard</Button>
            <Button onClick={create}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------------- Files ---------------- */
function FilesTab({ projectId, files }: { projectId: string; files: any[] }) {
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const { open: openFile } = useFileViewer();

  const onFiles = async (fileList: FileList | null) => {
    if (!fileList?.length) return;
    setUploading(true);
    const { data: u } = await supabase.auth.getUser();
    for (const file of Array.from(fileList)) {
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `project-files/${projectId}/${Date.now()}_${safe}`;
      try {
        await queueAndUpload({
          file, path,
          meta: { projectId },
          onDone: async () => {
            await supabase.from("project_files" as any).insert({
              project_id: projectId,
              file_name: file.name,
              storage_path: path,
              mime_type: file.type || null,
              size_bytes: file.size,
              uploaded_by: u.user?.id,
            });
            qc.invalidateQueries({ queryKey: ["project_files", projectId] });
            qc.invalidateQueries({ queryKey: ["project_journey", projectId] });
          },
        });
      } catch (e: any) {
        toast.error(e?.message || "Upload failed — queued for retry");
      }
    }
    setUploading(false);
    toast.success("Uploads complete (or queued to resume)");
  };

  const remove = async (row: any) => {
    if (!confirm(`Delete ${row.file_name}?`)) return;
    await supabase.storage.from("media").remove([row.storage_path]);
    await supabase.from("project_files" as any).delete().eq("id", row.id);
    qc.invalidateQueries({ queryKey: ["project_files", projectId] });
  };

  return (
    <div className="space-y-4">
      <label className="block bg-surface-white rounded-xl border border-dashed border-border p-6 text-center cursor-pointer hover:bg-muted/30">
        <FileUp className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm">{uploading ? <span className="inline-flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> Queuing…</span> : "Drop files or click to upload"}</p>
        <p className="text-xs text-muted-foreground mt-1">Uploads survive tab switches and reloads — resume from the banner if interrupted.</p>
        <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
      </label>
      {!files.length && <div className="text-center py-8 text-muted-foreground">No files yet</div>}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
        {files.map((f: any) => {
          const url = supabase.storage.from("media").getPublicUrl(f.storage_path).data.publicUrl;
          return (
            <div key={f.id} className="bg-surface-white rounded-xl border border-border p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <button type="button" onClick={() => openFile({ url, name: f.file_name })} className="text-sm font-medium text-lead truncate hover:underline text-left">{f.file_name}</button>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => remove(f)}><Trash2 className="h-3 w-3" /></Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {(f.size_bytes / 1024).toFixed(1)} KB · {new Date(f.created_at).toLocaleString()}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Overview ---------------- */
function OverviewTab({ project }: { project: any }) {
  const qc = useQueryClient();
  const defaults = { name: project.name, client_name: project.client_name ?? "", description: project.description ?? "", color: project.color };
  const [form, setForm] = useEditingDraft<typeof defaults>(`project_edit_${project.id}`, defaults);
  const v = form ?? defaults;

  const save = async () => {
    const { error } = await supabase.from("task_projects").update({
      name: v.name.trim(), client_name: v.client_name.trim() || null,
      description: v.description.trim() || null, color: v.color,
    }).eq("id", project.id);
    if (error) return toast.error(error.message);
    setForm(null);
    toast.success("Saved");
    qc.invalidateQueries({ queryKey: ["task_project", project.id] });
    qc.invalidateQueries({ queryKey: ["task_projects"] });
  };

  return (
    <div className="bg-surface-white rounded-xl border border-border p-6 space-y-4 max-w-xl">
      <div><Label>Name</Label><Input value={v.name} onChange={(e) => setForm({ ...v, name: e.target.value })} /></div>
      <div><Label>Client</Label><Input value={v.client_name} onChange={(e) => setForm({ ...v, client_name: e.target.value })} /></div>
      <div><Label>Description</Label><Textarea value={v.description} onChange={(e) => setForm({ ...v, description: e.target.value })} rows={4} /></div>
      <div><Label>Color</Label><Input type="color" value={v.color} onChange={(e) => setForm({ ...v, color: e.target.value })} className="h-10 w-24 p-1" /></div>
      <div className="flex justify-between">
        <Button variant="ghost" size="sm" onClick={() => setForm(null)}>Reset draft</Button>
        <Button onClick={save}>Save changes</Button>
      </div>
    </div>
  );
}