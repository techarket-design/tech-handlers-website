import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, CheckSquare, Calendar, Users as UsersIcon, MessageSquare, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { format, isPast, isToday } from "date-fns";
import { useCustomers } from "@/hooks/useCustomers";
import { LeadCombobox } from "@/components/admin/LeadCombobox";

type Status = "todo" | "in_progress" | "review" | "done";
type Priority = "low" | "medium" | "high" | "urgent";
const STATUSES: { value: Status; label: string; color: string }[] = [
  { value: "todo", label: "To Do", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200" },
  { value: "in_progress", label: "In Progress", color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200" },
  { value: "review", label: "Review", color: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200" },
  { value: "done", label: "Done", color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200" },
];
const PRIORITY_COLORS: Record<Priority, string> = {
  low: "bg-slate-200 text-slate-700",
  medium: "bg-blue-200 text-blue-800",
  high: "bg-orange-200 text-orange-800",
  urgent: "bg-red-200 text-red-800",
};

export default function Tasks() {
  const { hasModule, user } = useAuth();
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [createOpen, setCreateOpen] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // Filters
  const projectFilter = params.get("project") || "all";
  const assigneeFilter = params.get("assignee") || "all";
  const customerFilter = params.get("customer") || "all";
  const leadFilter = params.get("lead") || "all";

  const { data: members } = useTeamMembers();
  const { data: customers = [] } = useCustomers();
  const { data: leads = [] } = useQuery({
    queryKey: ["leads_minimal"],
    queryFn: async () => {
      const { data } = await supabase.from("leads").select("id, name, company").order("created_at", { ascending: false }).limit(500);
      return data || [];
    },
  });
  const { data: projects } = useQuery({
    queryKey: ["task_projects_active"],
    queryFn: async () => {
      const { data, error } = await supabase.from("task_projects").select("id, name, color, client_name").eq("is_archived", false).order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["tasks", projectFilter, assigneeFilter, customerFilter, leadFilter],
    queryFn: async () => {
      let query = supabase
        .from("tasks")
        .select("*, project:task_projects(id, name, color), assignees:task_assignees(user_id)")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (projectFilter !== "all") query = query.eq("project_id", projectFilter);
      if (customerFilter !== "all") query = query.eq("customer_id", customerFilter);
      if (leadFilter !== "all") query = query.eq("lead_id", leadFilter);
      const { data, error } = await query;
      if (error) throw error;
      let result = data as any[];
      if (assigneeFilter !== "all") {
        result = result.filter(t => t.assignees?.some((a: any) => a.user_id === assigneeFilter));
      }
      return result;
    },
  });

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value === "all") next.delete(key);
    else next.set(key, value);
    setParams(next);
  };

  if (!hasModule("tasks")) {
    return <div className="text-center py-12 text-muted-foreground">No access to Tasks module</div>;
  }

  const updateStatus = async (taskId: string, newStatus: Status) => {
    const updates: any = { status: newStatus };
    if (newStatus === "done") updates.completed_at = new Date().toISOString();
    else updates.completed_at = null;
    const { error } = await supabase.from("tasks").update(updates).eq("id", taskId);
    if (error) return toast.error(error.message);
    if (user) {
      await supabase.from("task_activities").insert({ task_id: taskId, user_id: user.id, action: "status_changed", details: { to: newStatus } });
    }
    qc.invalidateQueries({ queryKey: ["tasks"] });
  };

  const memberLabel = (id: string) => {
    const m = members?.find(x => x.user_id === id);
    return m?.email?.split("@")[0] || id.slice(0, 6);
  };

  const tasksByStatus = useMemo(() => {
    const map: Record<Status, any[]> = { todo: [], in_progress: [], review: [], done: [] };
    (tasks || []).forEach(t => map[t.status as Status]?.push(t));
    return map;
  }, [tasks]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-lead mb-1">Tasks</h1>
          <p className="text-sm text-muted-foreground">Assign work, set deadlines, track progress</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <Tabs value={view} onValueChange={(v) => setView(v as any)}>
            <TabsList>
              <TabsTrigger value="kanban">Kanban</TabsTrigger>
              <TabsTrigger value="list">List</TabsTrigger>
            </TabsList>
          </Tabs>
          <Select value={projectFilter} onValueChange={(v) => setFilter("project", v)}>
            <SelectTrigger className="w-44"><SelectValue placeholder="All projects" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All projects</SelectItem>
              {projects?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={assigneeFilter} onValueChange={(v) => setFilter("assignee", v)}>
            <SelectTrigger className="w-44"><SelectValue placeholder="All assignees" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All assignees</SelectItem>
              {members?.map(m => <SelectItem key={m.user_id} value={m.user_id}>{m.email}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={customerFilter} onValueChange={(v) => setFilter("customer", v)}>
            <SelectTrigger className="w-44"><SelectValue placeholder="All customers" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All customers</SelectItem>
              {customers.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="w-56">
            <LeadCombobox
              value={leadFilter === "all" ? null : leadFilter}
              onChange={(v) => setFilter("lead", v ?? "all")}
              leads={leads as any}
              placeholder="Filter by lead name…"
            />
          </div>
          <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-2" /> New Task</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading tasks...</div>
      ) : view === "kanban" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {STATUSES.map(s => (
            <div key={s.value}
              className="bg-muted/30 rounded-xl p-3 min-h-[400px]"
              onDragOver={(e) => { e.preventDefault(); }}
              onDrop={() => { if (draggingId) { updateStatus(draggingId, s.value); setDraggingId(null); } }}
            >
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${s.color}`}>{s.label}</span>
                  <span className="text-xs text-muted-foreground">{tasksByStatus[s.value].length}</span>
                </div>
              </div>
              <div className="space-y-2">
                {tasksByStatus[s.value].map((t: any) => (
                  <div key={t.id}
                    draggable
                    onDragStart={() => setDraggingId(t.id)}
                    onDragEnd={() => setDraggingId(null)}
                    onClick={() => navigate(`/admin/tasks/${t.id}`)}
                    className="bg-surface-white p-3 rounded-lg border border-border cursor-pointer hover:shadow-sm transition-shadow"
                  >
                    {t.project && (
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ background: t.project.color }} />
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">{t.project.name}</span>
                      </div>
                    )}
                    <p className="text-sm font-medium text-lead line-clamp-2">{t.title}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${PRIORITY_COLORS[t.priority as Priority] || PRIORITY_COLORS.medium}`}>{t.priority || "medium"}</span>
                      {t.due_date && (
                        <span className={`text-[10px] flex items-center gap-1 ${
                          t.status !== "done" && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date))
                            ? "text-destructive font-semibold" : "text-muted-foreground"
                        }`}>
                          <Calendar className="h-3 w-3" /> {format(new Date(t.due_date), "MMM d")}
                        </span>
                      )}
                      {t.assignees?.length > 0 && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <UsersIcon className="h-3 w-3" /> {t.assignees.length}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {tasksByStatus[s.value].length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-6">Drop tasks here</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-surface-white rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Assignees</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks?.map((t: any) => (
                <TableRow key={t.id} className="cursor-pointer" onClick={() => navigate(`/admin/tasks/${t.id}`)}>
                  <TableCell className="font-medium">{t.title}</TableCell>
                  <TableCell>
                    {t.project ? (
                      <span className="flex items-center gap-1.5 text-sm">
                        <span className="h-2 w-2 rounded-full" style={{ background: t.project.color }} />
                        {t.project.name}
                      </span>
                    ) : <span className="text-muted-foreground text-xs">—</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">{(t.status || "todo").replace("_", " ")}</Badge>
                  </TableCell>
                  <TableCell><span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${PRIORITY_COLORS[t.priority as Priority] || PRIORITY_COLORS.medium}`}>{t.priority || "medium"}</span></TableCell>
                  <TableCell className="text-xs">
                    {t.due_date ? (
                      <span className={t.status !== "done" && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date)) ? "text-destructive font-semibold" : ""}>
                        {format(new Date(t.due_date), "MMM d, yyyy")}
                      </span>
                    ) : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {t.assignees?.map((a: any) => memberLabel(a.user_id)).join(", ") || "—"}
                  </TableCell>
                </TableRow>
              ))}
              {!tasks?.length && (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No tasks yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <CreateTaskDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        projects={projects || []}
        members={members || []}
        customers={customers}
        leads={leads}
        defaultProjectId={projectFilter !== "all" ? projectFilter : undefined}
        defaultCustomerId={customerFilter !== "all" ? customerFilter : undefined}
        defaultLeadId={leadFilter !== "all" ? leadFilter : undefined}
      />
    </div>
  );
}

/* ------------ Create Task Dialog ------------ */
function CreateTaskDialog({ open, onOpenChange, projects, members, customers = [], leads = [], defaultProjectId, defaultCustomerId, defaultLeadId }: any) {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState<string | undefined>(defaultProjectId);
  const [customerId, setCustomerId] = useState<string | undefined>(defaultCustomerId);
  const [leadId, setLeadId] = useState<string | undefined>(defaultLeadId);
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [assignees, setAssignees] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const create = async () => {
    if (!title.trim()) return toast.error("Title required");
    setSaving(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const { data: task, error } = await supabase.from("tasks").insert({
        title: title.trim(),
        description: description.trim() || null,
        project_id: projectId || null,
        customer_id: customerId || null,
        lead_id: leadId || null,
        priority,
        due_date: dueDate || null,
        created_by: u.user?.id,
      }).select().single();
      if (error) throw error;
      if (assignees.length > 0) {
        await supabase.from("task_assignees").insert(assignees.map(uid => ({ task_id: task.id, user_id: uid })));
        // Notify assignees (excluding self)
        if (u.user) {
          const senderName = u.user.email?.split("@")[0] || "Someone";
          const targets = assignees.filter((id) => id !== u.user!.id);
          if (targets.length > 0) {
            await supabase.from("notifications").insert(
              targets.map((uid) => ({
                user_id: uid, actor_id: u.user!.id, type: "task_assigned",
                title: `${senderName} assigned you to "${task.title}"`,
                link: `/admin/tasks/${task.id}`, task_id: task.id,
              }))
            );
          }
        }
      }
      if (u.user) {
        await supabase.from("task_activities").insert({ task_id: task.id, user_id: u.user.id, action: "created" });
      }
      toast.success("Task created");
      setTitle(""); setDescription(""); setDueDate(""); setAssignees([]); setPriority("medium");
      setCustomerId(defaultCustomerId); setLeadId(defaultLeadId);
      onOpenChange(false);
      qc.invalidateQueries({ queryKey: ["tasks"] });
    } catch (err: any) {
      toast.error(err.message);
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Create Task</DialogTitle></DialogHeader>
        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          <div>
            <Label>Title *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs to be done?" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Project</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  {projects.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Customer</Label>
              <Select value={customerId || "none"} onValueChange={(v) => setCustomerId(v === "none" ? undefined : v)}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No customer</SelectItem>
                  {customers.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Lead</Label>
              <LeadCombobox
                value={leadId ?? null}
                onChange={(v) => setLeadId(v ?? undefined)}
                leads={leads as any}
                placeholder="Search lead by name…"
              />
            </div>
          </div>
          <div>
            <Label>Due date</Label>
            <Input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div>
            <Label>Assignees</Label>
            <div className="border border-border rounded-lg p-3 max-h-40 overflow-y-auto space-y-2 mt-1">
              {members.length === 0 && <p className="text-xs text-muted-foreground">No team members found</p>}
              {members.map((m: any) => (
                <label key={m.user_id} className="flex items-center gap-2 cursor-pointer text-sm">
                  <Checkbox
                    checked={assignees.includes(m.user_id)}
                    onCheckedChange={(c) => setAssignees(prev => c ? [...prev, m.user_id] : prev.filter(x => x !== m.user_id))}
                  />
                  <span>{m.email} <span className="text-xs text-muted-foreground">({m.role})</span></span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={create} disabled={saving}>{saving ? "Creating..." : "Create Task"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

