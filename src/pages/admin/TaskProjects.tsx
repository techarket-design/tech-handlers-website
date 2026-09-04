import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Briefcase, Plus, Trash2, Archive, ArchiveRestore, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useEditingDraft } from "@/hooks/useEditingDraft";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#14b8a6"];

export default function TaskProjects() {
  const { hasModule } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const defaults = { name: "", client: "", description: "", color: COLORS[0] };
  const [draft, setDraft] = useEditingDraft<typeof defaults>("task_project_new", defaults);
  const form = draft ?? defaults;
  const update = (patch: Partial<typeof defaults>) => setDraft({ ...form, ...patch });
  const [showArchived, setShowArchived] = useState(false);

  const { data: projects, isLoading } = useQuery({
    queryKey: ["task_projects", showArchived],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_projects")
        .select("*, tasks(count)")
        .eq("is_archived", showArchived)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (!hasModule("tasks")) {
    return <div className="text-center py-12 text-muted-foreground">No access to Tasks module</div>;
  }

  const createProject = async () => {
    if (!form.name.trim()) return toast.error("Project name required");
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("task_projects").insert({
      name: form.name.trim(),
      client_name: form.client.trim() || null,
      description: form.description.trim() || null,
      color: form.color,
      created_by: u.user?.id,
    });
    if (error) return toast.error(error.message);
    toast.success("Project created");
    setDraft(null);
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["task_projects"] });
  };

  const toggleArchive = async (id: string, current: boolean) => {
    await supabase.from("task_projects").update({ is_archived: !current }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["task_projects"] });
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this project and all its tasks?")) return;
    const { error } = await supabase.from("task_projects").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Project deleted");
    qc.invalidateQueries({ queryKey: ["task_projects"] });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-lead mb-1">Task Projects</h1>
          <p className="text-sm text-muted-foreground">Group your team's work by client or initiative</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowArchived(!showArchived)}>
            {showArchived ? "Show Active" : "Show Archived"}
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> New Project</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Project</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Name *</Label>
                  <Input value={form.name} onChange={(e) => update({ name: e.target.value })} placeholder="e.g. Acme Corp Q2 Campaign" />
                </div>
                <div>
                  <Label>Client name</Label>
                  <Input value={form.client} onChange={(e) => update({ client: e.target.value })} placeholder="e.g. Acme Corp (optional)" />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={(e) => update({ description: e.target.value })} rows={3} />
                </div>
                <div>
                  <Label>Color</Label>
                  <div className="flex gap-2 mt-2">
                    {COLORS.map((c) => (
                      <button key={c} type="button" onClick={() => update({ color: c })}
                        className={`h-8 w-8 rounded-full border-2 ${form.color === c ? "border-foreground" : "border-transparent"}`}
                        style={{ background: c }} />
                    ))}
                  </div>
                </div>
                {draft && <p className="text-xs text-muted-foreground">Draft auto-saved — safe to switch tabs.</p>}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setDraft(null); setOpen(false); }}>Discard</Button>
                <Button onClick={createProject}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : !projects?.length ? (
        <div className="text-center py-12 bg-surface-white rounded-xl border border-border">
          <Briefcase className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">{showArchived ? "No archived projects" : "No projects yet — create your first one"}</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p: any) => (
            <div key={p.id} className="bg-surface-white rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-2" style={{ background: p.color }} />
              <div className="p-4">
                <Link to={`/admin/tasks/projects/${p.id}`} className="block">
                  <h3 className="font-display font-semibold text-lead mb-1">{p.name}</h3>
                  {p.client_name && <p className="text-xs text-muted-foreground">{p.client_name}</p>}
                  {p.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{p.description}</p>}
                  <p className="text-xs text-muted-foreground mt-3">{p.tasks?.[0]?.count ?? 0} tasks</p>
                </Link>
                <div className="flex gap-1 mt-3 pt-3 border-t border-border">
                  <Button size="sm" variant="ghost" asChild>
                    <Link to={`/admin/tasks/projects/${p.id}`}>
                      Journey <ArrowRight className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                  <Button size="sm" variant="ghost" asChild>
                    <Link to={`/admin/tasks?project=${p.id}`}>Tasks</Link>
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => toggleArchive(p.id, p.is_archived)}>
                    {p.is_archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(p.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}