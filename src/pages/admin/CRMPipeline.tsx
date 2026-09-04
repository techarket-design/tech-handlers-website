import { useState } from "react";
import { useAdminLeads, useUpdateRow, useTeamMembers } from "@/hooks/useData";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import AddLeadForm from "./AddLeadForm";
import {
  DragDropContext, Droppable, Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import {
  Search, Eye, Building2, Users, Archive,
  Flame, Thermometer, Snowflake, Calendar, Mail, Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";

const stages = [
  { key: "new", label: "New", color: "bg-primary/10 border-primary/30" },
  { key: "contacted", label: "Contacted", color: "bg-blue-50 border-blue-300" },
  { key: "qualified", label: "Qualified", color: "bg-accent/10 border-accent/30" },
  { key: "converted", label: "Converted", color: "bg-green-50 border-green-300" },
];
// "lost" is archived and lives in /admin/leads?view=archived — dragging a card
// onto the archive dropzone below moves it there in one step.

const priorityConfig: Record<string, { icon: typeof Flame; color: string; label: string }> = {
  hot: { icon: Flame, color: "text-red-500", label: "Hot" },
  warm: { icon: Thermometer, color: "text-orange-500", label: "Warm" },
  cold: { icon: Snowflake, color: "text-blue-400", label: "Cold" },
};

export default function CRMPipeline() {
  const { data: leads, isLoading } = useAdminLeads();
  const updateLead = useUpdateRow("leads");
  const { data: teamMembers } = useTeamMembers();
  const [search, setSearch] = useState("");

  const activeLeads = (leads || []).filter((l) => l.status !== "lost");
  const archivedCount = (leads || []).filter((l) => l.status === "lost").length;
  const filtered = activeLeads.filter((l) =>
    [l.name, l.email, l.company, (l as any).lead_label].some((f) => f?.toLowerCase().includes(search.toLowerCase()))
  );

  const moveToStage = async (id: string, status: string) => {
    try {
      await updateLead.mutateAsync({ id, status } as any);
      toast.success(status === "lost" ? "Lead archived" : `Lead moved to ${status}`);
    } catch {
      toast.error("Failed to move lead");
    }
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const newStage = result.destination.droppableId;
    const leadId = result.draggableId;
    const lead = activeLeads.find((l) => l.id === leadId);
    if (!lead || lead.status === newStage) return;
    moveToStage(leadId, newStage);
  };

  if (isLoading) return <div className="animate-pulse h-40 bg-muted rounded-xl" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-lead">CRM Pipeline</h1>
          <p className="text-sm text-muted-foreground">
            {activeLeads.length} active lead{activeLeads.length === 1 ? "" : "s"}
            {archivedCount > 0 && <> · {archivedCount} archived</>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search leads..." className="pl-10" />
          </div>
          <Link to="/admin/leads?view=archived">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Archive className="h-3.5 w-3.5" /> Archived
              <Badge variant="secondary" className="ml-1">{archivedCount}</Badge>
            </Button>
          </Link>
          <AddLeadForm />
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-4 gap-3 overflow-x-auto">
          {stages.map((stage) => {
            const stageLeads = filtered.filter(l => l.status === stage.key);
            return (
              <Droppable droppableId={stage.key} key={stage.key}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`rounded-xl border-2 ${stage.color} p-3 min-h-[400px] transition-colors ${snapshot.isDraggingOver ? "ring-2 ring-primary/40 bg-primary/5" : ""}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-display font-semibold text-sm text-lead">{stage.label}</h3>
                      <Badge variant="secondary" className="text-xs">{stageLeads.length}</Badge>
                    </div>
                    <div className="space-y-2">
                      {stageLeads.map((lead, index) => {
                        const p = priorityConfig[(lead as any).priority || "warm"];
                        const PIcon = p?.icon || Thermometer;
                        const isOverdue = (lead as any).follow_up_date && new Date((lead as any).follow_up_date) < new Date();
                        return (
                          <Draggable key={lead.id} draggableId={lead.id} index={index}>
                            {(dragProvided, dragSnapshot) => (
                              <div
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                {...dragProvided.dragHandleProps}
                                className={`bg-surface-white rounded-lg border p-3 shadow-sm transition-shadow ${isOverdue ? "border-destructive/40" : "border-border"} ${dragSnapshot.isDragging ? "shadow-lg ring-2 ring-primary/30" : "hover:shadow-md"}`}
                              >
                                <Link to={`/admin/leads/${lead.id}`} className="block">
                                  <div className="flex items-start justify-between mb-1.5">
                                    <span className="font-medium text-sm text-lead truncate flex-1">{lead.name}</span>
                                    <PIcon className={`h-3.5 w-3.5 shrink-0 ml-1 ${p?.color || ""}`} />
                                  </div>
                                  {lead.company && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                                      <Building2 className="h-3 w-3" /> {lead.company}
                                    </div>
                                  )}
                                  {lead.email && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1 truncate">
                                      <Mail className="h-3 w-3" /> {lead.email}
                                    </div>
                                  )}
                                  {(lead as any).lead_label && (
                                    <Badge variant="outline" className="text-[10px] mt-1 mr-1">
                                      <Tag className="h-2.5 w-2.5 mr-0.5" /> {(lead as any).lead_label}
                                    </Badge>
                                  )}
                                  {(lead as any).assigned_to && teamMembers && (
                                    <Badge variant="secondary" className="text-[10px] mt-1 mr-1">
                                      <Users className="h-2.5 w-2.5 mr-0.5" />
                                      {teamMembers.find(m => m.user_id === (lead as any).assigned_to)?.email?.split("@")[0] || "Assigned"}
                                    </Badge>
                                  )}
                                  {(lead as any).follow_up_date && (
                                    <div className={`flex items-center gap-1 text-xs font-medium mt-1 ${isOverdue ? "text-destructive" : "text-accent"}`}>
                                      <Calendar className="h-3 w-3" />
                                      {new Date((lead as any).follow_up_date).toLocaleDateString()}
                                      {isOverdue && " ⚠️"}
                                    </div>
                                  )}
                                </Link>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            );
          })}
        </div>

        {/* Archive drop zone — drag any card here to mark as lost & remove from board */}
        <Droppable droppableId="lost">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={cn(
                "mt-4 rounded-xl border-2 border-dashed p-4 text-center text-xs transition-colors",
                snapshot.isDraggingOver
                  ? "border-destructive/60 bg-destructive/10 text-destructive"
                  : "border-border/60 text-muted-foreground hover:border-destructive/40 hover:text-destructive/70"
              )}
            >
              <Archive className="inline-block h-3.5 w-3.5 mr-1.5 -mt-0.5" />
              Drop a lead here to archive it (marks as lost)
              <div style={{ display: "none" }}>{provided.placeholder}</div>
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
