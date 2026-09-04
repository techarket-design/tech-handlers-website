import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Search, Download, Eye, Flame, Thermometer, Snowflake, Calendar as CalendarIcon,
  Tag, Filter, X, Users, Zap, ArrowUp, ArrowDown, ArrowUpDown, TrendingUp,
  AlertTriangle, CheckCircle2, Sparkles, Trash2, UserCog, MoveRight, Clock,
  Archive, ArchiveRestore, Inbox,
} from "lucide-react";
import { useAdminLeads, useTeamMembers, useUpdateRow, useDeleteRow } from "@/hooks/useData";
import { Link } from "react-router-dom";
import AddLeadForm from "./AddLeadForm";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, formatDistanceToNowStrict, isThisMonth, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const statusColors: Record<string, string> = {
  new: "bg-primary/10 text-primary",
  contacted: "bg-blue-100 text-blue-700",
  qualified: "bg-accent/10 text-accent",
  converted: "bg-green-100 text-green-700",
  lost: "bg-destructive/10 text-destructive",
};

const priorityIcons: Record<string, { icon: typeof Flame; color: string }> = {
  hot: { icon: Flame, color: "text-red-500" },
  warm: { icon: Thermometer, color: "text-orange-500" },
  cold: { icon: Snowflake, color: "text-blue-400" },
};

const sourceOptions = ["website", "referral", "linkedin", "cold_call", "email_campaign", "social_media", "event", "other"];
// Stages shown in the working CRM. "lost" is intentionally excluded — lost
// leads live in the Archived view and never clutter day-to-day work.
const statusOptions = ["new", "contacted", "qualified", "converted"];
const priorityOptionsList = ["hot", "warm", "cold"];

type DatePreset = "all" | "today" | "7d" | "30d" | "90d" | "custom";
type SortKey = "created_at" | "name" | "follow_up_date" | "priority" | "last_contacted_at";
type SortDir = "asc" | "desc";

const priorityRank: Record<string, number> = { hot: 3, warm: 2, cold: 1 };

function dateFromPreset(preset: DatePreset): { from?: Date; to?: Date } {
  const now = new Date();
  const start = new Date(now); start.setHours(0, 0, 0, 0);
  if (preset === "today") return { from: start, to: now };
  if (preset === "7d") { const d = new Date(start); d.setDate(d.getDate() - 6); return { from: d, to: now }; }
  if (preset === "30d") { const d = new Date(start); d.setDate(d.getDate() - 29); return { from: d, to: now }; }
  if (preset === "90d") { const d = new Date(start); d.setDate(d.getDate() - 89); return { from: d, to: now }; }
  return {};
}

export default function ViewLeads() {
  const { data: leads, isLoading } = useAdminLeads();
  const { data: teamMembers } = useTeamMembers();
  const updateLead = useUpdateRow("leads");
  const deleteLead = useDeleteRow("leads");
  const [search, setSearch] = useState("");
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();
  const [salesperson, setSalesperson] = useState<string>("all");
  const [source, setSource] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [priority, setPriority] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode: "active" | "archived" =
    searchParams.get("view") === "archived" ? "archived" : "active";
  const setViewMode = (v: "active" | "archived") => {
    const next = new URLSearchParams(searchParams);
    if (v === "archived") next.set("view", "archived"); else next.delete("view");
    setSearchParams(next, { replace: true });
    setSelected(new Set());
  };

  const range = datePreset === "custom" ? { from: customFrom, to: customTo } : dateFromPreset(datePreset);

  const filteredRaw = useMemo(() => {
    if (!leads) return [];
    const q = search.trim().toLowerCase();
    return leads.filter((l: any) => {
      // Active view hides "lost" (archived). Archived view shows only "lost".
      if (viewMode === "active" && l.status === "lost") return false;
      if (viewMode === "archived" && l.status !== "lost") return false;
      if (q && ![l.name, l.email, l.phone, l.company, l.lead_label].some(f => f?.toLowerCase().includes(q))) return false;
      if (range.from && new Date(l.created_at) < range.from) return false;
      if (range.to) {
        const end = new Date(range.to); end.setHours(23, 59, 59, 999);
        if (new Date(l.created_at) > end) return false;
      }
      if (salesperson !== "all") {
        if (salesperson === "unassigned") { if (l.assigned_to) return false; }
        else if (l.assigned_to !== salesperson) return false;
      }
      if (source !== "all" && (l.source || "") !== source) return false;
      if (status !== "all" && l.status !== status) return false;
      if (priority !== "all" && (l.priority || "warm") !== priority) return false;
      return true;
    });
  }, [leads, search, range.from, range.to, salesperson, source, status, priority, viewMode]);

  const archivedCount = useMemo(
    () => (leads || []).filter((l: any) => l.status === "lost").length,
    [leads]
  );

  const filtered = useMemo(() => {
    const arr = [...filteredRaw];
    const dir = sortDir === "asc" ? 1 : -1;
    arr.sort((a: any, b: any) => {
      let av: any, bv: any;
      if (sortKey === "name") { av = (a.name || "").toLowerCase(); bv = (b.name || "").toLowerCase(); }
      else if (sortKey === "priority") { av = priorityRank[a.priority || "warm"] || 0; bv = priorityRank[b.priority || "warm"] || 0; }
      else { av = a[sortKey] ? new Date(a[sortKey]).getTime() : 0; bv = b[sortKey] ? new Date(b[sortKey]).getTime() : 0; }
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
    return arr;
  }, [filteredRaw, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir(key === "name" ? "asc" : "desc"); }
  };

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
    return sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
  };

  // Stats over the full lead set (not filtered) — Pipedrive-style KPIs
  const stats = useMemo(() => {
    const all = leads || [];
    const now = new Date();
    const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
    const newThisWeek = all.filter((l: any) => new Date(l.created_at) >= weekAgo).length;
    const hot = all.filter((l: any) => (l.priority || "") === "hot" && !["converted", "lost"].includes(l.status)).length;
    const overdue = all.filter((l: any) => l.follow_up_date && new Date(l.follow_up_date) < now && !["converted", "lost"].includes(l.status)).length;
    const convertedThisMonth = all.filter((l: any) => l.status === "converted" && isThisMonth(new Date(l.updated_at || l.created_at))).length;
    const closed = all.filter((l: any) => ["converted", "lost"].includes(l.status)).length;
    const won = all.filter((l: any) => l.status === "converted").length;
    const conversionRate = closed ? Math.round((won / closed) * 100) : 0;
    return { total: all.length, newThisWeek, hot, overdue, convertedThisMonth, conversionRate };
  }, [leads]);

  const activeCount = [
    datePreset !== "all",
    salesperson !== "all",
    source !== "all",
    status !== "all",
    priority !== "all",
  ].filter(Boolean).length;

  const clearFilters = () => {
    setDatePreset("all"); setCustomFrom(undefined); setCustomTo(undefined);
    setSalesperson("all"); setSource("all"); setStatus("all"); setPriority("all");
  };

  const salespersonLabel = (uid: string) => {
    const m = teamMembers?.find((t) => t.user_id === uid);
    return m?.email || uid.slice(0, 8);
  };

  // Bulk actions
  const allSelected = filtered.length > 0 && filtered.every((l) => selected.has(l.id));
  const toggleSelectAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map((l) => l.id)));
  };
  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };
  const bulkUpdate = async (patch: Record<string, any>, label: string) => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    try {
      await Promise.all(ids.map((id) => updateLead.mutateAsync({ id, ...patch } as any)));
      toast.success(`${label} for ${ids.length} lead${ids.length > 1 ? "s" : ""}`);
      setSelected(new Set());
    } catch { toast.error("Bulk update failed"); }
  };
  const bulkDelete = async () => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    try {
      await Promise.all(ids.map((id) => deleteLead.mutateAsync(id)));
      toast.success(`Deleted ${ids.length} lead${ids.length > 1 ? "s" : ""}`);
      setSelected(new Set());
      setConfirmDelete(false);
    } catch { toast.error("Bulk delete failed"); }
  };

  const exportCSV = () => {
    if (!filtered.length) return;
    const headers = ["Name", "Email", "Phone", "Company", "Designation", "Budget", "Service Interest", "Requirement", "Source", "Status", "Priority", "Label", "Assigned To", "Date"];
    const rows = filtered.map((l: any) => [l.name, l.email, l.phone, l.company, l.designation, l.budget, l.service_interest, l.requirement, l.source, l.status, l.priority, l.lead_label, l.assigned_to, new Date(l.created_at).toLocaleString()]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${(c || "").toString().replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "leads.csv"; a.click();
  };

  if (isLoading) return <div className="animate-pulse h-40 bg-muted rounded-xl" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-lead">
            {viewMode === "archived" ? "Archived Leads" : "All Leads"}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Showing <span className="font-semibold text-foreground">{filtered.length}</span> of {leads?.length || 0}
            {activeCount > 0 && <> · <span className="text-primary">{activeCount} filter{activeCount > 1 ? "s" : ""} active</span></>}
            {viewMode === "archived" && <> · showing leads marked as lost</>}
          </p>
        </div>
        <div className="flex gap-2">
          <AddLeadForm />
          <Link to="/admin/pipeline"><Button variant="outline" size="sm">Pipeline View</Button></Link>
          <Button variant="outline" onClick={exportCSV}><Download className="mr-2 h-4 w-4" /> Export CSV</Button>
        </div>
      </div>

      {/* Active / Archived tabs */}
      <div className="inline-flex items-center gap-1 p-1 rounded-lg border border-border bg-surface-white mb-4">
        <button
          onClick={() => setViewMode("active")}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition",
            viewMode === "active" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Inbox className="h-3.5 w-3.5" /> Active
          <span className={cn("ml-1 text-[10px] px-1.5 rounded-full", viewMode === "active" ? "bg-primary-foreground/20" : "bg-muted")}>
            {(leads?.length || 0) - archivedCount}
          </span>
        </button>
        <button
          onClick={() => setViewMode("archived")}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition",
            viewMode === "archived" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Archive className="h-3.5 w-3.5" /> Archived
          <span className={cn("ml-1 text-[10px] px-1.5 rounded-full", viewMode === "archived" ? "bg-primary-foreground/20" : "bg-muted")}>
            {archivedCount}
          </span>
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
        <StatCard icon={Users} label="Total leads" value={stats.total} tone="default" />
        <StatCard icon={Sparkles} label="New (7d)" value={stats.newThisWeek} tone="primary" />
        <StatCard icon={Flame} label="Hot & open" value={stats.hot} tone="hot" />
        <StatCard icon={AlertTriangle} label="Overdue" value={stats.overdue} tone="danger" onClick={() => { /* quick filter */ setStatus("all"); setPriority("all"); }} />
        <StatCard icon={CheckCircle2} label="Won this month" value={stats.convertedThisMonth} tone="success" />
        <StatCard icon={TrendingUp} label="Win rate" value={`${stats.conversionRate}%`} tone="accent" />
      </div>

      {/* Filters */}
      <div className="bg-surface-white border border-border rounded-xl p-3 mb-3 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground pr-2 border-r border-border">
            <Filter className="h-3.5 w-3.5" /> Filters
          </div>

          {/* Date preset */}
          <Select value={datePreset} onValueChange={(v) => setDatePreset(v as DatePreset)}>
            <SelectTrigger className="h-8 w-[150px] text-xs">
              <CalendarIcon className="h-3.5 w-3.5 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any date</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="custom">Custom range…</SelectItem>
            </SelectContent>
          </Select>

          {datePreset === "custom" && (
            <>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("h-8 text-xs justify-start font-normal", !customFrom && "text-muted-foreground")}>
                    <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                    {customFrom ? format(customFrom, "MMM d, yyyy") : "From"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={customFrom} onSelect={setCustomFrom} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("h-8 text-xs justify-start font-normal", !customTo && "text-muted-foreground")}>
                    <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                    {customTo ? format(customTo, "MMM d, yyyy") : "To"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={customTo} onSelect={setCustomTo} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </>
          )}

          {/* Salesperson */}
          <Select value={salesperson} onValueChange={setSalesperson}>
            <SelectTrigger className="h-8 w-[180px] text-xs">
              <Users className="h-3.5 w-3.5 mr-1" />
              <SelectValue placeholder="Salesperson" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All salespeople</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {teamMembers?.map((m) => (
                <SelectItem key={m.user_id} value={m.user_id}>{m.email}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Source */}
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger className="h-8 w-[160px] text-xs">
              <Zap className="h-3.5 w-3.5 mr-1" />
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              {sourceOptions.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status */}
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-8 w-[130px] text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stages</SelectItem>
              {statusOptions.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Priority */}
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="h-8 w-[130px] text-xs">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any priority</SelectItem>
              {priorityOptionsList.map((p) => (
                <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {activeCount > 0 && (
            <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-destructive" onClick={clearFilters}>
              <X className="h-3.5 w-3.5 mr-1" /> Clear
            </Button>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, company, label..." className="pl-10" />
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="mb-3 bg-primary/5 border border-primary/30 rounded-xl px-4 py-2.5 flex items-center gap-3 flex-wrap animate-in fade-in slide-in-from-top-1">
          <span className="text-sm font-semibold text-primary">{selected.size} selected</span>
          <div className="h-4 w-px bg-border" />
          <Select onValueChange={(v) => bulkUpdate({ status: v }, `Moved to "${v}"`)}>
            <SelectTrigger className="h-8 w-[150px] text-xs"><MoveRight className="h-3.5 w-3.5 mr-1" /><SelectValue placeholder="Change stage" /></SelectTrigger>
            <SelectContent>{statusOptions.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
          </Select>
          <Select onValueChange={(v) => bulkUpdate({ priority: v }, `Set priority to ${v}`)}>
            <SelectTrigger className="h-8 w-[140px] text-xs"><Flame className="h-3.5 w-3.5 mr-1" /><SelectValue placeholder="Set priority" /></SelectTrigger>
            <SelectContent>{priorityOptionsList.map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}</SelectContent>
          </Select>
          <Select onValueChange={(v) => bulkUpdate({ assigned_to: v === "__unassign__" ? null : v }, "Reassigned")}>
            <SelectTrigger className="h-8 w-[180px] text-xs"><UserCog className="h-3.5 w-3.5 mr-1" /><SelectValue placeholder="Reassign to" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__unassign__">Unassign</SelectItem>
              {teamMembers?.map((m) => <SelectItem key={m.user_id} value={m.user_id}>{m.email}</SelectItem>)}
            </SelectContent>
          </Select>
          {viewMode === "active" ? (
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => bulkUpdate({ status: "lost" }, "Archived")}>
              <Archive className="h-3.5 w-3.5 mr-1" /> Archive
            </Button>
          ) : (
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => bulkUpdate({ status: "new" }, "Restored")}>
              <ArchiveRestore className="h-3.5 w-3.5 mr-1" /> Restore
            </Button>
          )}
          <Button size="sm" variant="outline" className="h-8 text-xs text-destructive hover:text-destructive" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
          </Button>
          <Button size="sm" variant="ghost" className="h-8 text-xs ml-auto" onClick={() => setSelected(new Set())}>
            <X className="h-3.5 w-3.5 mr-1" /> Clear selection
          </Button>
        </div>
      )}

      <div className="bg-surface-white rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} aria-label="Select all" />
              </TableHead>
              <TableHead>
                <button onClick={() => toggleSort("name")} className="inline-flex items-center gap-1 hover:text-primary">
                  Name <SortIcon k="name" />
                </button>
              </TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Label</TableHead>
              <TableHead>
                <button onClick={() => toggleSort("priority")} className="inline-flex items-center gap-1 hover:text-primary">
                  Priority <SortIcon k="priority" />
                </button>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned</TableHead>
              <TableHead>
                <button onClick={() => toggleSort("last_contacted_at")} className="inline-flex items-center gap-1 hover:text-primary">
                  Last touch <SortIcon k="last_contacted_at" />
                </button>
              </TableHead>
              <TableHead>
                <button onClick={() => toggleSort("follow_up_date")} className="inline-flex items-center gap-1 hover:text-primary">
                  Follow-up <SortIcon k="follow_up_date" />
                </button>
              </TableHead>
              <TableHead>
                <button onClick={() => toggleSort("created_at")} className="inline-flex items-center gap-1 hover:text-primary">
                  Created <SortIcon k="created_at" />
                </button>
              </TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((l) => {
              const p = priorityIcons[(l as any).priority || "warm"];
              const PIcon = p?.icon || Thermometer;
              const isOverdue = (l as any).follow_up_date && new Date((l as any).follow_up_date) < new Date();
              const created = new Date(l.created_at);
              const ageDays = differenceInDays(new Date(), created);
              const lastTouch = (l as any).last_contacted_at ? new Date((l as any).last_contacted_at) : null;
              const staleDays = lastTouch ? differenceInDays(new Date(), lastTouch) : null;
              const isStale = !lastTouch && ageDays > 3 && !["converted", "lost"].includes(l.status);
              const isChecked = selected.has(l.id);
              return (
                <TableRow key={l.id} className={cn(isOverdue && "bg-destructive/5", isChecked && "bg-primary/5")}>
                  <TableCell>
                    <Checkbox checked={isChecked} onCheckedChange={() => toggleOne(l.id)} aria-label={`Select ${l.name}`} />
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-sm">{l.name}</span>
                        {isStale && <Badge variant="outline" className="text-[9px] border-orange-300 text-orange-600 h-4 px-1"><Clock className="h-2.5 w-2.5 mr-0.5" />stale</Badge>}
                      </div>
                      {l.email && <span className="block text-xs text-muted-foreground">{l.email}</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{l.company || "—"}</TableCell>
                  <TableCell>
                    {l.source ? (
                      <Badge variant="secondary" className="text-[10px] capitalize">{l.source.replace("_", " ")}</Badge>
                    ) : "—"}
                  </TableCell>
                  <TableCell>
                    {(l as any).lead_label ? (
                      <Badge variant="outline" className="text-[10px]"><Tag className="h-2.5 w-2.5 mr-0.5" /> {(l as any).lead_label}</Badge>
                    ) : "—"}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1 text-xs capitalize ${p?.color || ""}`}>
                      <PIcon className="h-3.5 w-3.5" /> {(l as any).priority || "warm"}
                    </span>
                  </TableCell>
                  <TableCell><span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${statusColors[l.status] || ""}`}>{l.status}</span></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{(l as any).assigned_to ? salespersonLabel((l as any).assigned_to) : "—"}</TableCell>
                  <TableCell className="text-xs">
                    {lastTouch ? (
                      <span className={cn("inline-flex items-center gap-1", staleDays! > 7 ? "text-orange-600 font-medium" : "text-muted-foreground")}>
                        <Clock className="h-3 w-3" /> {formatDistanceToNowStrict(lastTouch, { addSuffix: true })}
                      </span>
                    ) : <span className="text-muted-foreground/60">Never</span>}
                  </TableCell>
                  <TableCell>
                    {(l as any).follow_up_date ? (
                      <span className={`inline-flex items-center gap-1 text-xs ${isOverdue ? "text-destructive font-semibold" : "text-accent"}`}>
                        <CalendarIcon className="h-3 w-3" /> {new Date((l as any).follow_up_date).toLocaleDateString()}
                        {isOverdue && " ⚠️"}
                      </span>
                    ) : "—"}
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="text-foreground font-medium">{format(created, "MMM d, yyyy")}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {format(created, "h:mm a")} · {ageDays === 0 ? "today" : `${ageDays}d ago`}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Link to={`/admin/leads/${l.id}`}>
                      <Button size="icon" variant="ghost"><Eye className="h-4 w-4" /></Button>
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
            {!filtered.length && <TableRow><TableCell colSpan={12} className="text-center text-muted-foreground py-8">No leads match your filters</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selected.size} lead{selected.size > 1 ? "s" : ""}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the selected leads and their activity history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={bulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatCard({
  icon: Icon, label, value, tone, onClick,
}: {
  icon: any; label: string; value: number | string;
  tone: "default" | "primary" | "hot" | "danger" | "success" | "accent";
  onClick?: () => void;
}) {
  const tones: Record<string, string> = {
    default: "border-border bg-surface-white",
    primary: "border-primary/30 bg-primary/5",
    hot: "border-red-200 bg-red-50",
    danger: "border-destructive/30 bg-destructive/5",
    success: "border-green-200 bg-green-50",
    accent: "border-accent/30 bg-accent/5",
  };
  const iconTones: Record<string, string> = {
    default: "text-muted-foreground",
    primary: "text-primary",
    hot: "text-red-500",
    danger: "text-destructive",
    success: "text-green-600",
    accent: "text-accent",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border p-3 text-left transition-all hover:shadow-sm",
        tones[tone],
        !onClick && "cursor-default hover:shadow-none",
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon className={cn("h-3.5 w-3.5", iconTones[tone])} />
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">{label}</span>
      </div>
      <div className="text-xl font-display font-bold text-foreground">{value}</div>
    </button>
  );
}
