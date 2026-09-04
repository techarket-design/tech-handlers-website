import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAdminLeads, useLeadActivities, useCreateLeadActivity, useUpdateRow, useTeamMembers, useLeadAssignees, syncLeadAssignees } from "@/hooks/useData";
import MultiAssigneeSelect from "@/components/admin/MultiAssigneeSelect";
import { useFileViewer } from "@/components/admin/FileViewer";
import { useAuth } from "@/hooks/useAuth";
import { useDraftPersistence } from "@/hooks/useDraftPersistence";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Phone, Mail, Building2, Globe, DollarSign,
  CalendarIcon, Flame, Thermometer, Snowflake,
  MessageSquare, PhoneCall, MailIcon, Users, Clock,
  CheckCircle2, Tag, Briefcase, FileText,
  ArrowRightCircle, Edit2, Save, X, Upload, Paperclip, ExternalLink, ClipboardList, Plus,
  ChevronLeft, ChevronRight,
} from "lucide-react";

const activityTypes = [
  { value: "note", label: "Note", icon: MessageSquare },
  { value: "call", label: "Call", icon: PhoneCall },
  { value: "email", label: "Email", icon: MailIcon },
  { value: "meeting", label: "Meeting", icon: Users },
  { value: "follow_up", label: "Follow-up", icon: Clock },
  { value: "proposal_sent", label: "Proposal Sent", icon: FileText },
  { value: "status_change", label: "Status Change", icon: ArrowRightCircle },
];

const priorityOptions = [
  { value: "hot", label: "Hot", icon: Flame, color: "text-red-500 bg-red-50" },
  { value: "warm", label: "Warm", icon: Thermometer, color: "text-orange-500 bg-orange-50" },
  { value: "cold", label: "Cold", icon: Snowflake, color: "text-blue-400 bg-blue-50" },
];

const statusOptions = ["new", "contacted", "qualified", "converted", "lost"];

const leadLabels = [
  "Hot Lead", "Low Budget", "Follow-up", "Decision Maker",
  "Needs Proposal", "Not Interested", "Competitor", "Referral", "Inbound", "Outbound",
];

type LeadEditForm = {
  name: string;
  email: string;
  phone: string;
  company: string;
  designation: string;
  website_url: string;
  budget: string;
  service_interest: string;
  requirement: string;
  message: string;
};

type LeadActivityDraft = {
  activityType: string;
  description: string;
  attachedFile: string;
  scheduleNext: boolean;
  nextDate: string;
};

const emptyLeadEditForm: LeadEditForm = {
  name: "",
  email: "",
  phone: "",
  company: "",
  designation: "",
  website_url: "",
  budget: "",
  service_interest: "",
  requirement: "",
  message: "",
};

const defaultActivityDraft: LeadActivityDraft = {
  activityType: "note",
  description: "",
  attachedFile: "",
  scheduleNext: false,
  nextDate: "",
};

const buildLeadEditForm = (lead: any): LeadEditForm => ({
  name: lead.name || "",
  email: lead.email || "",
  phone: lead.phone || "",
  company: lead.company || "",
  designation: lead.designation || "",
  website_url: lead.website_url || "",
  budget: lead.budget || "",
  service_interest: lead.service_interest || "",
  requirement: lead.requirement || "",
  message: lead.message || "",
});

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { open: openFile } = useFileViewer();
  const { data: leads, isLoading } = useAdminLeads();
  const { data: activities, isLoading: activitiesLoading } = useLeadActivities(id);
  const createActivity = useCreateLeadActivity();
  const update = useUpdateRow("leads");
  const { data: teamMembers } = useTeamMembers();
  const { data: leadAssignees } = useLeadAssignees(id);
  const qc = useQueryClient();
  const lead = leads?.find(l => l.id === id) as any;
  // Sibling leads for prev/next navigation — respect the archived vs active
  // context the user came from so keyboard/shortcut nav stays intuitive.
  const siblingLeads = useMemo(() => {
    if (!leads) return [] as any[];
    if (!lead) return leads as any[];
    const isArchived = lead.status === "lost";
    return (leads as any[]).filter(l => (l.status === "lost") === isArchived);
  }, [leads, lead]);
  const currentIndex = useMemo(
    () => siblingLeads.findIndex(l => l.id === id),
    [siblingLeads, id]
  );
  const prevLead = currentIndex > 0 ? siblingLeads[currentIndex - 1] : null;
  const nextLead = currentIndex >= 0 && currentIndex < siblingLeads.length - 1
    ? siblingLeads[currentIndex + 1]
    : null;
  const leadDefaults = useMemo(() => buildLeadEditForm(lead ?? {}), [lead]);
  const [followUpDate, setFollowUpDate] = useState<Date | undefined>();
  const [fileUploading, setFileUploading] = useState(false);
  const leadEditDraft = useDraftPersistence<LeadEditForm>(`lead_edit_${id ?? "unknown"}`, leadDefaults);
  const activityDraft = useDraftPersistence<LeadActivityDraft>(`activity_${id ?? "unknown"}`, defaultActivityDraft);
  const [editingInfo, setEditingInfo] = useState(leadEditDraft.hasDraft);

  const activityType = activityDraft.form.activityType;
  const description = activityDraft.form.description;
  const attachedFile = activityDraft.form.attachedFile || null;
  const scheduleNext = activityDraft.form.scheduleNext;
  const nextDate = activityDraft.form.nextDate ? new Date(activityDraft.form.nextDate) : undefined;

  useEffect(() => {
    setEditingInfo(leadEditDraft.hasDraft);
  }, [id, leadEditDraft.hasDraft]);

  // Keyboard shortcuts: ← / → (or j / k) to jump between leads.
  // Skip when the user is typing in an input, textarea, or contentEditable.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      const tag = t.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || t.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if ((e.key === "ArrowLeft" || e.key === "j") && prevLead) {
        e.preventDefault();
        navigate(`/admin/leads/${prevLead.id}`);
      } else if ((e.key === "ArrowRight" || e.key === "k") && nextLead) {
        e.preventDefault();
        navigate(`/admin/leads/${nextLead.id}`);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prevLead, nextLead, navigate]);

  if (isLoading) return <div className="animate-pulse h-40 bg-muted rounded-xl" />;
  if (!lead) return <div className="text-center py-12 text-muted-foreground">Lead not found</div>;

  const updateLead = async (updates: Record<string, any>) => {
    await update.mutateAsync({ id: lead.id, ...updates } as any);
    toast.success("Lead updated");
  };

  const startEditing = () => {
    if (!leadEditDraft.hasDraft) {
      leadEditDraft.setForm(buildLeadEditForm(lead));
    }

    setEditingInfo(true);
  };

  const saveEditing = async () => {
    await update.mutateAsync({ id: lead.id, ...leadEditDraft.form } as any);
    setEditingInfo(false);
    leadEditDraft.clearDraft();
    toast.success("Lead info updated");
  };

  const cancelEditing = () => {
    setEditingInfo(false);
    leadEditDraft.clearDraft();
  };

  const updateEditField = (field: keyof LeadEditForm, value: string) => leadEditDraft.update(field, value);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return toast.error("File must be under 10MB");
    setFileUploading(true);
    const ext = file.name.split(".").pop();
    const path = `crm/${lead.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error } = await supabase.storage.from("media").upload(path, file);
    if (error) { toast.error("Upload failed"); setFileUploading(false); return; }
    const { data: urlData } = supabase.storage.from("media").getPublicUrl(path);
    activityDraft.update("attachedFile", urlData.publicUrl);
    setFileUploading(false);
    toast.success(`File attached: ${file.name}`);
    e.target.value = "";
  };

  const addActivity = async () => {
    if (!description.trim() && !attachedFile) return toast.error("Add a description or attach a file");
    const activityData: any = {
      lead_id: lead.id,
      activity_type: activityType,
      description: description.trim() + (attachedFile ? `\n[Attachment: ${attachedFile}]` : ""),
      created_by: user?.email || "admin",
    };
    // Store file_url separately if the column exists
    if (attachedFile) {
      await supabase.from("lead_activities" as any).insert({
        ...activityData,
        file_url: attachedFile,
      });
      qc.invalidateQueries({ queryKey: ["lead_activities", lead.id] });
      qc.invalidateQueries({ queryKey: ["leads"] });
    } else {
      await createActivity.mutateAsync(activityData);
    }
    if (activityType === "call" || activityType === "email") {
      await update.mutateAsync({ id: lead.id, last_contacted_at: new Date().toISOString() } as any);
    }
    if (scheduleNext && nextDate) {
      await update.mutateAsync({ id: lead.id, follow_up_date: nextDate.toISOString() } as any);
    }
    activityDraft.clearDraft();
    toast.success("Activity logged" + (scheduleNext && nextDate ? " & follow-up scheduled" : ""));
  };

  const markActivityDone = async (activityId: string) => {
    const { error } = await supabase
      .from("lead_activities" as any)
      .update({ is_completed: true, completed_at: new Date().toISOString() })
      .eq("id", activityId);
    if (error) toast.error("Failed to mark done");
    else { toast.success("Marked as done ✓"); qc.invalidateQueries({ queryKey: ["lead_activities", id] }); }
  };

  const scheduleNextDay = async () => {
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); tomorrow.setHours(10, 0, 0, 0);
    await update.mutateAsync({ id: lead.id, follow_up_date: tomorrow.toISOString() } as any);
    toast.success("Follow-up scheduled for tomorrow");
  };

  const setFollowUp = async () => {
    if (!followUpDate) return;
    await update.mutateAsync({ id: lead.id, follow_up_date: followUpDate.toISOString() } as any);
    setFollowUpDate(undefined);
    toast.success("Follow-up date set");
  };

  const activityIcon = (type: string) => {
    const found = activityTypes.find(a => a.value === type);
    return found ? <found.icon className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />;
  };

  // Extract file URL from activity description or file_url field
  const getActivityFileUrl = (activity: any): string | null => {
    if (activity.file_url) return activity.file_url;
    const match = activity.description?.match(/\[Attachment: (https?:\/\/[^\]]+)\]/);
    return match ? match[1] : null;
  };

  const getCleanDescription = (desc: string) => {
    return desc?.replace(/\n?\[Attachment: https?:\/\/[^\]]+\]/g, "").trim() || "";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <Link
          to={lead.status === "lost" ? "/admin/leads?view=archived" : "/admin/pipeline"}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-lead"
        >
          <ArrowLeft className="h-4 w-4" />
          {lead.status === "lost" ? "Back to Archived" : "Back to Pipeline"}
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:inline">
            {currentIndex >= 0 ? `${currentIndex + 1} of ${siblingLeads.length}` : ""}
          </span>
          <Button
            size="sm"
            variant="outline"
            className="gap-1"
            disabled={!prevLead}
            onClick={() => prevLead && navigate(`/admin/leads/${prevLead.id}`)}
            title={prevLead ? `Previous: ${prevLead.name} (←)` : "No previous lead"}
          >
            <ChevronLeft className="h-4 w-4" /> Prev
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1"
            disabled={!nextLead}
            onClick={() => nextLead && navigate(`/admin/leads/${nextLead.id}`)}
            title={nextLead ? `Next: ${nextLead.name} (→)` : "No next lead"}
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left column - Lead info */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-surface-white rounded-xl border border-border p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h1 className="text-xl font-display font-bold text-lead">{lead.name}</h1>
                {lead.designation && <p className="text-sm text-muted-foreground">{lead.designation}</p>}
              </div>
              <Button size="icon" variant="ghost" onClick={editingInfo ? () => setEditingInfo(false) : startEditing}>
                {editingInfo ? <X className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
              </Button>
            </div>

            {editingInfo ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div><Label className="text-xs">Name</Label><Input value={leadEditDraft.form.name} onChange={e => updateEditField("name", e.target.value)} className="mt-1 h-8 text-sm" /></div>
                  <div><Label className="text-xs">Designation</Label><Input value={leadEditDraft.form.designation} onChange={e => updateEditField("designation", e.target.value)} className="mt-1 h-8 text-sm" /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label className="text-xs">Email</Label><Input value={leadEditDraft.form.email} onChange={e => updateEditField("email", e.target.value)} className="mt-1 h-8 text-sm" /></div>
                  <div><Label className="text-xs">Phone</Label><Input value={leadEditDraft.form.phone} onChange={e => updateEditField("phone", e.target.value)} className="mt-1 h-8 text-sm" /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label className="text-xs">Company</Label><Input value={leadEditDraft.form.company} onChange={e => updateEditField("company", e.target.value)} className="mt-1 h-8 text-sm" /></div>
                  <div><Label className="text-xs">Website</Label><Input value={leadEditDraft.form.website_url} onChange={e => updateEditField("website_url", e.target.value)} className="mt-1 h-8 text-sm" /></div>
                </div>
                <div><Label className="text-xs">Budget</Label><Input value={leadEditDraft.form.budget} onChange={e => updateEditField("budget", e.target.value)} className="mt-1 h-8 text-sm" /></div>
                <div><Label className="text-xs">Service Interest</Label><Input value={leadEditDraft.form.service_interest} onChange={e => updateEditField("service_interest", e.target.value)} className="mt-1 h-8 text-sm" /></div>
                <div><Label className="text-xs">Requirement</Label><Textarea value={leadEditDraft.form.requirement} onChange={e => updateEditField("requirement", e.target.value)} rows={2} className="mt-1 text-sm" /></div>
                <div><Label className="text-xs">Notes</Label><Textarea value={leadEditDraft.form.message} onChange={e => updateEditField("message", e.target.value)} rows={2} className="mt-1 text-sm" /></div>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" onClick={saveEditing}><Save className="h-3.5 w-3.5 mr-1" /> Save Changes</Button>
                  <Button size="sm" variant="outline" onClick={cancelEditing}><X className="h-3.5 w-3.5 mr-1" /> Cancel</Button>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2 text-sm">
                  {lead.email && <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-4 w-4 shrink-0" /><a href={`mailto:${lead.email}`} className="hover:text-primary truncate">{lead.email}</a></div>}
                  {lead.phone && <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4 shrink-0" /><a href={`tel:${lead.phone}`} className="hover:text-primary">{lead.phone}</a></div>}
                  {lead.company && <div className="flex items-center gap-2 text-muted-foreground"><Building2 className="h-4 w-4 shrink-0" />{lead.company}</div>}
                  {lead.website_url && <div className="flex items-center gap-2 text-muted-foreground"><Globe className="h-4 w-4 shrink-0" /><a href={lead.website_url} target="_blank" rel="noreferrer" className="hover:text-primary truncate">{lead.website_url}</a></div>}
                  {lead.budget && <div className="flex items-center gap-2 text-muted-foreground"><DollarSign className="h-4 w-4 shrink-0" />{lead.budget}</div>}
                  {lead.service_interest && <div className="flex items-center gap-2 text-muted-foreground"><Briefcase className="h-4 w-4 shrink-0" />{lead.service_interest}</div>}
                </div>
                {lead.requirement && (
                  <div className="mt-3 border-t border-border pt-3">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">REQUIREMENT</p>
                    <p className="text-sm text-foreground">{lead.requirement}</p>
                  </div>
                )}
                {lead.message && (
                  <div className="mt-3 border-t border-border pt-3">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">NOTES</p>
                    <p className="text-sm text-foreground">{lead.message}</p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-3">Source: {lead.source} · Added {new Date(lead.created_at).toLocaleDateString()}</p>
              </>
            )}
          </div>

          {/* Lead Label */}
          <div className="bg-surface-white rounded-xl border border-border p-5">
            <h3 className="font-display font-semibold text-sm text-lead mb-3 flex items-center gap-2"><Tag className="h-4 w-4" /> Lead Label</h3>
            <div className="flex flex-wrap gap-1.5">
              {leadLabels.map(l => (
                <Button key={l} size="sm" variant={lead.lead_label === l ? "default" : "outline"} className="text-[11px] h-7" onClick={() => updateLead({ lead_label: l })}>{l}</Button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="bg-surface-white rounded-xl border border-border p-5">
            <h3 className="font-display font-semibold text-sm text-lead mb-3">Pipeline Stage</h3>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map(s => (
                <Button key={s} size="sm" variant={lead.status === s ? "default" : "outline"} className="capitalize text-xs" onClick={() => updateLead({ status: s })}>{s}</Button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div className="bg-surface-white rounded-xl border border-border p-5">
            <h3 className="font-display font-semibold text-sm text-lead mb-3">Priority</h3>
            <div className="flex gap-2">
              {priorityOptions.map(p => (
                <Button key={p.value} size="sm" variant="outline" className={cn("text-xs capitalize flex-1", lead.priority === p.value && p.color)} onClick={() => updateLead({ priority: p.value })}>
                  <p.icon className="h-3.5 w-3.5 mr-1" /> {p.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Assigned to (multi) */}
          <div className="bg-surface-white rounded-xl border border-border p-5">
            <h3 className="font-display font-semibold text-sm text-lead mb-3">Assigned To</h3>
            <MultiAssigneeSelect
              value={leadAssignees || []}
              onChange={async (next) => {
                await syncLeadAssignees(lead.id, next);
                await update.mutateAsync({ id: lead.id, assigned_to: next[0] || null } as any);
                qc.invalidateQueries({ queryKey: ["lead_assignees", lead.id] });
                toast.success("Assignees updated");
              }}
            />
            <p className="text-[11px] text-muted-foreground mt-2">Only assigned team members (and admins) can view this lead.</p>
          </div>

          {/* Follow-up scheduling */}
          <div className="bg-surface-white rounded-xl border border-border p-5">
            <h3 className="font-display font-semibold text-sm text-lead mb-3">Follow-up Schedule</h3>
            {lead.follow_up_date && (
              <div className={cn(
                "flex items-center gap-2 p-2 rounded-lg mb-3 text-sm font-medium",
                new Date(lead.follow_up_date) < new Date() ? "bg-destructive/10 text-destructive" : "bg-accent/10 text-accent"
              )}>
                <CalendarIcon className="h-4 w-4" />
                {new Date(lead.follow_up_date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                {new Date(lead.follow_up_date) < new Date() && <Badge variant="destructive" className="text-[10px] ml-auto">OVERDUE</Badge>}
              </div>
            )}
            <div className="flex gap-2 mb-2">
              <Button size="sm" variant="outline" className="text-xs flex-1" onClick={scheduleNextDay}>
                <CalendarIcon className="h-3.5 w-3.5 mr-1" /> Tomorrow
              </Button>
              <Button size="sm" variant="outline" className="text-xs flex-1" onClick={async () => {
                const d = new Date(); d.setDate(d.getDate() + 3); d.setHours(10, 0, 0, 0);
                await update.mutateAsync({ id: lead.id, follow_up_date: d.toISOString() } as any);
                toast.success("Scheduled in 3 days");
              }}>+3 Days</Button>
              <Button size="sm" variant="outline" className="text-xs flex-1" onClick={async () => {
                const d = new Date(); d.setDate(d.getDate() + 7); d.setHours(10, 0, 0, 0);
                await update.mutateAsync({ id: lead.id, follow_up_date: d.toISOString() } as any);
                toast.success("Scheduled in 1 week");
              }}>+1 Week</Button>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("text-xs w-full justify-start", !followUpDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                  {followUpDate ? format(followUpDate, "PPP") : "Pick custom date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={followUpDate} onSelect={setFollowUpDate} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
            {followUpDate && <Button size="sm" className="mt-2 w-full text-xs" onClick={setFollowUp}>Set Follow-up</Button>}
          </div>
        </div>

        {/* Right column - Activity log */}
        <div className="lg:col-span-2 space-y-4">
          {/* Log new activity */}
          <div className="bg-surface-white rounded-xl border border-border p-5">
            <h3 className="font-display font-semibold text-lead mb-3">Log Activity</h3>
            <div className="flex gap-2 mb-3 flex-wrap">
              {activityTypes.map(a => (
                <Button key={a.value} size="sm" variant={activityType === a.value ? "default" : "outline"} className="text-xs" onClick={() => activityDraft.update("activityType", a.value)}>
                  <a.icon className="h-3.5 w-3.5 mr-1" /> {a.label}
                </Button>
              ))}
            </div>
            <Textarea value={description} onChange={e => activityDraft.update("description", e.target.value)} placeholder="What happened? Describe the interaction in detail..." rows={3} />

            {/* File attachment */}
            <div className="mt-3 flex items-center gap-3">
              <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 border border-dashed rounded-lg text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                <Paperclip className="h-3.5 w-3.5" />
                {fileUploading ? "Uploading…" : "Attach File"}
                <input type="file" className="hidden" onChange={handleFileUpload} disabled={fileUploading} />
              </label>
              {attachedFile && (
                <div className="flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-1.5 text-xs">
                  <FileText className="h-3.5 w-3.5 text-primary" />
                  <span className="truncate max-w-[200px]">{attachedFile.split("/").pop()}</span>
                  <button onClick={() => activityDraft.update("attachedFile", "")} className="text-muted-foreground hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Schedule next follow-up */}
            <div className="mt-3 flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border">
              <input type="checkbox" checked={scheduleNext} onChange={e => activityDraft.update("scheduleNext", e.target.checked)} className="rounded" id="schedule-next" />
              <label htmlFor="schedule-next" className="text-xs text-muted-foreground cursor-pointer flex-1">
                Schedule next follow-up after logging this activity
              </label>
              {scheduleNext && (
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" className="text-[10px] h-6 px-2" onClick={() => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(10, 0, 0, 0); activityDraft.update("nextDate", d.toISOString()); }}>Tomorrow</Button>
                  <Button size="sm" variant="outline" className="text-[10px] h-6 px-2" onClick={() => { const d = new Date(); d.setDate(d.getDate() + 3); d.setHours(10, 0, 0, 0); activityDraft.update("nextDate", d.toISOString()); }}>+3 Days</Button>
                  {nextDate && <Badge variant="secondary" className="text-[10px]">{format(nextDate, "MMM d")}</Badge>}
                </div>
              )}
            </div>

            <Button className="mt-3" size="sm" onClick={addActivity} disabled={createActivity.isPending || fileUploading}>
              {createActivity.isPending ? "Logging..." : "Log Activity"}
            </Button>
          </div>

          <LinkedTasksCard leadId={lead.id} onOpen={(tid) => navigate(`/admin/tasks/${tid}`)} />

          {/* Activity timeline */}
          <div className="bg-surface-white rounded-xl border border-border p-5">
            <h3 className="font-display font-semibold text-lead mb-4">Activity Timeline ({activities?.length || 0})</h3>
            {activitiesLoading ? (
              <div className="animate-pulse h-20 bg-muted rounded" />
            ) : !activities?.length ? (
              <p className="text-sm text-muted-foreground text-center py-6">No activities yet. Log your first touchpoint above.</p>
            ) : (
              <div className="space-y-1">
                {activities.map((a: any) => {
                  const fileUrl = getActivityFileUrl(a);
                  const cleanDesc = getCleanDescription(a.description);
                  return (
                    <div key={a.id} className={cn("flex gap-3 p-3 rounded-lg transition-colors", a.is_completed ? "bg-muted/20" : "hover:bg-muted/30")}>
                      <div className="flex flex-col items-center">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                          a.is_completed ? "bg-green-100 text-green-600" : "bg-primary/10 text-primary"
                        )}>
                          {a.is_completed ? <CheckCircle2 className="h-4 w-4" /> : activityIcon(a.activity_type)}
                        </div>
                        <div className="w-px flex-1 bg-border mt-1" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge variant={a.is_completed ? "outline" : "secondary"} className="text-[10px] capitalize">
                            {a.activity_type.replace("_", " ")}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                          {a.created_by && <span className="text-xs text-muted-foreground">by {a.created_by}</span>}
                          {a.is_completed && <Badge variant="outline" className="text-[10px] text-green-600 border-green-300">Done</Badge>}
                        </div>
                        {cleanDesc && <p className={cn("text-sm", a.is_completed ? "text-muted-foreground line-through" : "text-foreground")}>{cleanDesc}</p>}
                        {fileUrl && (
                          <button
                            type="button"
                            onClick={() => openFile({ url: fileUrl, name: fileUrl.split("/").pop() })}
                            className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-1 rounded-md bg-primary/5 text-primary text-xs hover:bg-primary/10 transition-colors"
                          >
                            <Paperclip className="h-3 w-3" />
                            {fileUrl.split("/").pop()?.substring(0, 30)}
                            <ExternalLink className="h-3 w-3" />
                          </button>
                        )}
                        {a.completed_at && <p className="text-[10px] text-muted-foreground mt-1">Completed: {new Date(a.completed_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>}
                      </div>
                      {!a.is_completed && (
                        <Button size="sm" variant="ghost" className="text-xs h-8 shrink-0" onClick={() => markActivityDone(a.id)}>
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Done
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function LinkedTasksCard({ leadId, onOpen }: { leadId: string; onOpen: (id: string) => void }) {
  const { data: tasks } = useQuery({
    queryKey: ["lead_tasks", leadId],
    queryFn: async () => {
      const { data } = await supabase
        .from("tasks")
        .select("id, title, status, priority, due_date")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });
  return (
    <div className="bg-surface-white rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-semibold text-lead flex items-center gap-2">
          <ClipboardList className="h-4 w-4" /> Linked Tasks ({tasks?.length || 0})
        </h3>
        <Link to={`/admin/tasks?lead=${leadId}`} className="text-xs text-primary hover:underline inline-flex items-center gap-1">
          <Plus className="h-3 w-3" /> Manage in Tasks
        </Link>
      </div>
      {!tasks?.length ? (
        <p className="text-xs text-muted-foreground text-center py-3">No tasks linked to this lead</p>
      ) : (
        <div className="space-y-1.5">
          {tasks.map((t: any) => (
            <button
              key={t.id}
              onClick={() => onOpen(t.id)}
              className="w-full text-left flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-muted/40 transition-colors"
            >
              <span className="text-sm font-medium text-foreground truncate">{t.title}</span>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className="capitalize text-[10px]">{t.status.replace("_", " ")}</Badge>
                {t.due_date && <span className="text-[10px] text-muted-foreground">{format(new Date(t.due_date), "MMM d")}</span>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
