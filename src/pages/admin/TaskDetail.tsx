import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Trash2, AlertCircle, MessageSquare, Activity as ActivityIcon, FileText, Paperclip, X, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow, isPast, isToday } from "date-fns";
import { MentionTextarea, MentionText } from "@/components/admin/MentionTextarea";
import { useFileViewer } from "@/components/admin/FileViewer";
import { useCustomers } from "@/hooks/useCustomers";
import { LeadCombobox } from "@/components/admin/LeadCombobox";
import { pushNotify } from "@/lib/push";

const STATUSES = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "review", label: "Review" },
  { value: "done", label: "Done" },
];

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-slate-200 text-slate-700",
  medium: "bg-blue-200 text-blue-800",
  high: "bg-orange-200 text-orange-800",
  urgent: "bg-red-200 text-red-800",
};

export default function TaskDetail() {
  const { id: taskId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, hasModule } = useAuth();
  const { data: members = [] } = useTeamMembers();
  const { open: openFile } = useFileViewer();

  const [logNote, setLogNote] = useState("");
  const [logMentions, setLogMentions] = useState<string[]>([]);
  const [attachedFile, setAttachedFile] = useState<{ url: string; name: string } | null>(null);
  const [fileUploading, setFileUploading] = useState(false);

  const { data: projects } = useQuery({
    queryKey: ["task_projects_active"],
    queryFn: async () => {
      const { data } = await supabase.from("task_projects").select("id, name, color").eq("is_archived", false).order("name");
      return data || [];
    },
  });

  const { data: customers = [] } = useCustomers();
  const { data: leads = [] } = useQuery({
    queryKey: ["leads_minimal"],
    queryFn: async () => {
      const { data } = await supabase.from("leads").select("id, name, company").order("created_at", { ascending: false }).limit(500);
      return data || [];
    },
  });

  const { data: task, isLoading } = useQuery({
    queryKey: ["task_detail", taskId],
    enabled: !!taskId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*, project:task_projects(id, name, color), assignees:task_assignees(user_id)")
        .eq("id", taskId!).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: comments } = useQuery({
    queryKey: ["task_comments", taskId],
    enabled: !!taskId,
    queryFn: async () => {
      const { data } = await supabase.from("task_comments").select("*").eq("task_id", taskId!).order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: activities } = useQuery({
    queryKey: ["task_activities", taskId],
    enabled: !!taskId,
    queryFn: async () => {
      const { data } = await supabase.from("task_activities").select("*").eq("task_id", taskId!).order("created_at", { ascending: false }).limit(50);
      return data || [];
    },
  });

  if (!hasModule("tasks")) return <div className="text-center py-12 text-muted-foreground">No access to Tasks module</div>;
  if (isLoading || !task) return <div className="text-center py-12 text-muted-foreground">Loading task...</div>;

  const memberLabel = (id: string) => members.find((m) => m.user_id === id)?.email || id.slice(0, 8);
  const assigneeIds: string[] = (task.assignees || []).map((a: any) => a.user_id);

  const update = async (changes: any, actionLabel?: string) => {
    const { error } = await supabase.from("tasks").update(changes).eq("id", taskId!);
    if (error) return toast.error(error.message);
    if (user) {
      await supabase.from("task_activities").insert({
        task_id: taskId!, user_id: user.id, action: actionLabel || "updated", details: changes,
      });
    }
    qc.invalidateQueries({ queryKey: ["task_detail", taskId] });
    qc.invalidateQueries({ queryKey: ["tasks"] });
    qc.invalidateQueries({ queryKey: ["task_activities", taskId] });
  };

  const toggleAssignee = async (uid: string, current: boolean) => {
    if (current) {
      await supabase.from("task_assignees").delete().eq("task_id", taskId!).eq("user_id", uid);
    } else {
      await supabase.from("task_assignees").insert({ task_id: taskId!, user_id: uid });
      // notify newly assigned
      if (user && uid !== user.id) {
        await supabase.from("notifications").insert({
          user_id: uid, actor_id: user.id, type: "task_assigned",
          title: `${user.email?.split("@")[0] || "Someone"} assigned you to "${task.title}"`,
          link: `/admin/tasks/${taskId}`, task_id: taskId!,
        });
        void pushNotify({
          userIds: [uid],
          title: "You were assigned a task",
          body: task.title,
          url: `/admin/tasks/${taskId}`,
          category: "task_assigned",
        }).catch(() => undefined);
      }
    }
    if (user) {
      await supabase.from("task_activities").insert({
        task_id: taskId!, user_id: user.id,
        action: current ? "unassigned" : "assigned",
        details: { user_id: uid },
      });
    }
    qc.invalidateQueries({ queryKey: ["task_detail", taskId] });
    qc.invalidateQueries({ queryKey: ["task_activities", taskId] });
  };

  const postLogNote = async () => {
    if ((!logNote.trim() && !attachedFile) || !user) return;
    const { error } = await supabase.from("task_comments").insert({
      task_id: taskId!,
      user_id: user.id,
      content: logNote.trim() || (attachedFile ? `📎 ${attachedFile.name}` : ""),
      mentioned_users: logMentions,
      ...(attachedFile ? { attachment_url: attachedFile.url, attachment_name: attachedFile.name } as any : {}),
    } as any);
    if (error) return toast.error(error.message);
    await supabase.from("task_activities").insert({ task_id: taskId!, user_id: user.id, action: "logged_note" });

    // Send notifications to mentioned users (not self)
    const targets = logMentions.filter((id) => id !== user.id);
    if (targets.length > 0) {
      const senderName = user.email?.split("@")[0] || "Someone";
      const preview = logNote.trim().slice(0, 140);
      await supabase.from("notifications").insert(
        targets.map((uid) => ({
          user_id: uid, actor_id: user.id, type: "mention",
          title: `${senderName} mentioned you in "${task.title}"`,
          body: preview, link: `/admin/tasks/${taskId}`, task_id: taskId!,
        }))
      );
      void pushNotify({
        userIds: targets,
        title: `${senderName} mentioned you`,
        body: `${task.title}: ${preview}`,
        url: `/admin/tasks/${taskId}`,
        category: "mention",
      }).catch(() => undefined);
    }

    setLogNote(""); setLogMentions([]); setAttachedFile(null);
    qc.invalidateQueries({ queryKey: ["task_comments", taskId] });
    qc.invalidateQueries({ queryKey: ["task_activities", taskId] });
    toast.success(targets.length ? `Note posted · ${targets.length} notified` : "Note posted");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) { toast.error("File must be under 25MB"); return; }
    setFileUploading(true);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `tasks/${taskId}/${Date.now()}-${safeName}`;
    const { error } = await supabase.storage.from("media").upload(path, file);
    if (error) { toast.error("Upload failed"); setFileUploading(false); e.target.value = ""; return; }
    const { data: urlData } = supabase.storage.from("media").getPublicUrl(path);
    setAttachedFile({ url: urlData.publicUrl, name: file.name });
    setFileUploading(false);
    e.target.value = "";
    toast.success(`Attached: ${file.name}`);
  };

  const deleteTask = async () => {
    if (!confirm("Delete this task and all its log notes?")) return;
    const { error } = await supabase.from("tasks").delete().eq("id", taskId!);
    if (error) return toast.error(error.message);
    toast.success("Task deleted");
    navigate("/admin/tasks");
  };

  const overdue = task.due_date && task.status !== "done" && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date));

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin/tasks"><ArrowLeft className="h-4 w-4 mr-1" /> All Tasks</Link>
        </Button>
        {task.project && (
          <>
            <span className="text-muted-foreground">/</span>
            <Link to={`/admin/tasks?project=${task.project.id}`} className="text-sm flex items-center gap-1.5 hover:underline">
              <span className="h-2 w-2 rounded-full" style={{ background: task.project.color }} />
              {task.project.name}
            </Link>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-surface-white border border-border rounded-xl p-5">
            <Input
              defaultValue={task.title}
              onBlur={(e) => e.target.value !== task.title && e.target.value.trim() && update({ title: e.target.value.trim() }, "renamed")}
              className="text-2xl font-display font-bold border-0 focus-visible:ring-1 px-2 -mx-2 h-auto py-1"
            />
            {overdue && (
              <p className="text-xs text-destructive mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Overdue</p>
            )}
          </div>

          <div className="bg-surface-white border border-border rounded-xl">
            <Tabs defaultValue="log_notes">
              <TabsList className="m-3">
                <TabsTrigger value="description"><FileText className="h-3.5 w-3.5 mr-1.5" /> Description</TabsTrigger>
                <TabsTrigger value="log_notes"><MessageSquare className="h-3.5 w-3.5 mr-1.5" /> Log Notes ({comments?.length || 0})</TabsTrigger>
                <TabsTrigger value="activity"><ActivityIcon className="h-3.5 w-3.5 mr-1.5" /> Activity</TabsTrigger>
              </TabsList>

              <TabsContent value="description" className="px-5 pb-5">
                <Textarea
                  defaultValue={task.description || ""}
                  onBlur={(e) => e.target.value !== (task.description || "") && update({ description: e.target.value || null })}
                  rows={8}
                  placeholder="Describe the work, context, links, acceptance criteria..."
                />
              </TabsContent>

              <TabsContent value="log_notes" className="px-5 pb-5">
                <div className="border border-border rounded-lg p-3 bg-muted/20">
                  <Label className="text-xs text-muted-foreground">New log note · type @ to mention a teammate</Label>
                  <MentionTextarea
                    value={logNote}
                    onChange={setLogNote}
                    onMentionsChange={setLogMentions}
                    members={members}
                    placeholder="Add a log note. Use @ to notify someone..."
                    rows={3}
                    className="mt-1"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <label className="inline-flex items-center gap-1.5 text-xs cursor-pointer px-2 py-1 rounded border border-border hover:bg-muted">
                        <Paperclip className="h-3.5 w-3.5" />
                        {fileUploading ? "Uploading…" : "Attach file"}
                        <input type="file" className="hidden" onChange={handleFileUpload} disabled={fileUploading} />
                      </label>
                      {attachedFile && (
                        <span className="inline-flex items-center gap-1.5 text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          <Paperclip className="h-3 w-3" />
                          <span className="truncate max-w-[180px]">{attachedFile.name}</span>
                          <button onClick={() => setAttachedFile(null)} className="hover:text-destructive">
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {logMentions.length > 0 ? `· ${logMentions.length} will be notified` : ""}
                      </span>
                    </div>
                    <Button onClick={postLogNote} disabled={(!logNote.trim() && !attachedFile) || fileUploading} size="sm">Log note</Button>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {!comments?.length && <p className="text-sm text-muted-foreground text-center py-6">No log notes yet</p>}
                  {comments?.map((c: any) => (
                    <div key={c.id} className="border border-border rounded-lg p-3 bg-surface-white">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-xs text-lead">{memberLabel(c.user_id)}</span>
                        <span className="text-[10px] text-muted-foreground">{format(new Date(c.created_at), "MMM d, yyyy · h:mm a")}</span>
                      </div>
                      <div className="text-sm text-foreground"><MentionText text={c.content} /></div>
                      {c.attachment_url && (
                        <button
                          type="button"
                          onClick={() => openFile({ url: c.attachment_url, name: c.attachment_name || "Attachment" })}
                          className="mt-2 inline-flex items-center gap-1.5 text-xs bg-muted hover:bg-muted/70 text-foreground px-2 py-1 rounded border border-border"
                        >
                          <Paperclip className="h-3 w-3" />
                          <span className="truncate max-w-[240px]">{c.attachment_name || "Attachment"}</span>
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        </button>
                      )}
                      {c.mentioned_users?.length > 0 && (
                        <div className="mt-2 flex items-center gap-1 flex-wrap">
                          <span className="text-[10px] text-muted-foreground">notified:</span>
                          {c.mentioned_users.map((uid: string) => (
                            <span key={uid} className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                              @{(members.find((m) => m.user_id === uid)?.email || uid).split("@")[0]}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="activity" className="px-5 pb-5">
                <div className="space-y-2">
                  {!activities?.length && <p className="text-sm text-muted-foreground text-center py-6">No activity yet</p>}
                  {activities?.map((a: any) => (
                    <div key={a.id} className="flex items-center gap-2 text-xs py-2 border-b border-border last:border-0">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                      <span className="font-semibold text-lead">{memberLabel(a.user_id || "")}</span>
                      <span className="text-muted-foreground">{a.action.replace(/_/g, " ")}</span>
                      {a.details?.to && <span className="text-muted-foreground">→ {String(a.details.to).replace("_", " ")}</span>}
                      <span className="ml-auto text-muted-foreground">{formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-surface-white border border-border rounded-xl p-4 space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select
                value={task.status}
                onValueChange={(v) => update({ status: v, completed_at: v === "done" ? new Date().toISOString() : null }, "status_changed")}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Priority</Label>
              <Select value={task.priority} onValueChange={(v) => update({ priority: v }, "priority_changed")}>
                <SelectTrigger>
                  <SelectValue>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium}`}>{task.priority || "medium"}</span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Project</Label>
              <Select
                value={task.project_id || "none"}
                onValueChange={(v) => update({ project_id: v === "none" ? null : v }, "moved_project")}
              >
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No project</SelectItem>
                  {projects?.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Due date</Label>
              <Input
                type="datetime-local"
                defaultValue={task.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : ""}
                onBlur={(e) => update({ due_date: e.target.value ? new Date(e.target.value).toISOString() : null }, "due_date_changed")}
              />
            </div>
          </div>

          <div className="bg-surface-white border border-border rounded-xl p-4 space-y-3">
            <div className="text-xs font-semibold text-lead uppercase tracking-wide">Related to</div>
            <div>
              <Label className="text-xs text-muted-foreground">Customer</Label>
              <Select
                value={task.customer_id || "none"}
                onValueChange={(v) => update({ customer_id: v === "none" ? null : v }, "linked_customer")}
              >
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No customer</SelectItem>
                  {customers.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}
                </SelectContent>
              </Select>
              {task.customer_id && (
                <Link to={`/admin/customers/${task.customer_id}`} className="text-[11px] text-primary hover:underline inline-block mt-1">
                  Open customer →
                </Link>
              )}
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Lead</Label>
              <LeadCombobox
                value={task.lead_id || null}
                onChange={(v) => update({ lead_id: v }, "linked_lead")}
                leads={leads as any}
                placeholder="Search lead by name…"
              />
              {task.lead_id && (
                <Link to={`/admin/leads/${task.lead_id}`} className="text-[11px] text-primary hover:underline inline-block mt-1">
                  Open lead →
                </Link>
              )}
            </div>
          </div>

          <div className="bg-surface-white border border-border rounded-xl p-4">
            <Label className="text-xs text-muted-foreground">Assignees</Label>
            <div className="mt-2 space-y-1.5 max-h-64 overflow-y-auto">
              {members.map((m) => {
                const checked = assigneeIds.includes(m.user_id);
                return (
                  <label key={m.user_id} className="flex items-center gap-2 cursor-pointer text-sm py-1 hover:bg-muted/40 rounded px-1">
                    <Checkbox checked={checked} onCheckedChange={() => toggleAssignee(m.user_id, checked)} />
                    <span className="truncate flex-1">{m.email}</span>
                  </label>
                );
              })}
              {!members.length && <p className="text-xs text-muted-foreground">No team members</p>}
            </div>
          </div>

          <Button variant="outline" className="w-full text-destructive hover:text-destructive" onClick={deleteTask}>
            <Trash2 className="h-4 w-4 mr-2" /> Delete Task
          </Button>
        </div>
      </div>
    </div>
  );
}