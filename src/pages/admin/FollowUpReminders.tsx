import { useAdminLeads } from "@/hooks/useData";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Bell, AlertTriangle, Calendar, Clock, ArrowRight, Flame } from "lucide-react";

export default function FollowUpReminders() {
  const { data: leads, isLoading } = useAdminLeads();

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const leadsWithFollowUp = leads?.filter(l => (l as any).follow_up_date) || [];

  const overdue = leadsWithFollowUp.filter(l => {
    const d = new Date((l as any).follow_up_date);
    d.setHours(0, 0, 0, 0);
    return d < now;
  }).sort((a, b) => new Date((a as any).follow_up_date).getTime() - new Date((b as any).follow_up_date).getTime());

  const today = leadsWithFollowUp.filter(l => {
    const d = new Date((l as any).follow_up_date);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === now.getTime();
  });

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const upcoming = leadsWithFollowUp.filter(l => {
    const d = new Date((l as any).follow_up_date);
    d.setHours(0, 0, 0, 0);
    return d > now;
  }).sort((a, b) => new Date((a as any).follow_up_date).getTime() - new Date((b as any).follow_up_date).getTime()).slice(0, 10);

  if (isLoading) return <div className="animate-pulse h-40 bg-muted rounded-xl" />;

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-lead mb-1">Follow-up Reminders</h1>
      <p className="text-sm text-muted-foreground mb-6">Stay on top of your lead follow-ups</p>

      {/* Summary cards */}
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-destructive/5 rounded-xl p-4 border-2 border-destructive/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <span className="font-display font-semibold text-destructive">Overdue</span>
          </div>
          <p className="text-3xl font-display font-bold text-destructive">{overdue.length}</p>
          <p className="text-xs text-destructive/70">Need immediate attention</p>
        </div>
        <div className="bg-orange-50 rounded-xl p-4 border-2 border-orange-200">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="h-5 w-5 text-orange-600" />
            <span className="font-display font-semibold text-orange-700">Due Today</span>
          </div>
          <p className="text-3xl font-display font-bold text-orange-700">{today.length}</p>
          <p className="text-xs text-orange-600/70">Follow up before end of day</p>
        </div>
        <div className="bg-primary/5 rounded-xl p-4 border-2 border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-5 w-5 text-primary" />
            <span className="font-display font-semibold text-primary">Upcoming</span>
          </div>
          <p className="text-3xl font-display font-bold text-primary">{upcoming.length}</p>
          <p className="text-xs text-primary/70">Scheduled follow-ups</p>
        </div>
      </div>

      {/* Overdue leads */}
      {overdue.length > 0 && (
        <div className="bg-surface-white rounded-xl border-2 border-destructive/20 p-5 mb-6">
          <h2 className="font-display font-semibold text-destructive mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Overdue Follow-ups
          </h2>
          <div className="space-y-2">
            {overdue.map(l => (
              <Link key={l.id} to={`/admin/leads/${l.id}`} className="flex items-center justify-between p-3 rounded-lg border border-destructive/10 hover:bg-destructive/5 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                  <div>
                    <span className="font-medium text-sm text-lead">{l.name}</span>
                    {l.company && <span className="text-xs text-muted-foreground ml-2">{l.company}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" className="text-[10px]">
                    <Clock className="h-3 w-3 mr-1" />
                    {Math.ceil((now.getTime() - new Date((l as any).follow_up_date).getTime()) / 86400000)}d overdue
                  </Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Today's follow-ups */}
      {today.length > 0 && (
        <div className="bg-surface-white rounded-xl border-2 border-orange-200 p-5 mb-6">
          <h2 className="font-display font-semibold text-orange-700 mb-3 flex items-center gap-2">
            <Bell className="h-4 w-4" /> Due Today
          </h2>
          <div className="space-y-2">
            {today.map(l => (
              <Link key={l.id} to={`/admin/leads/${l.id}`} className="flex items-center justify-between p-3 rounded-lg border border-orange-100 hover:bg-orange-50 transition-colors">
                <div className="flex items-center gap-3">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <div>
                    <span className="font-medium text-sm text-lead">{l.name}</span>
                    {l.company && <span className="text-xs text-muted-foreground ml-2">{l.company}</span>}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming */}
      <div className="bg-surface-white rounded-xl border border-border p-5">
        <h2 className="font-display font-semibold text-lead mb-3 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" /> Upcoming Follow-ups
        </h2>
        {upcoming.length > 0 ? (
          <div className="space-y-2">
            {upcoming.map(l => (
              <Link key={l.id} to={`/admin/leads/${l.id}`} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-primary/60" />
                  <div>
                    <span className="font-medium text-sm text-lead">{l.name}</span>
                    {l.company && <span className="text-xs text-muted-foreground ml-2">{l.company}</span>}
                  </div>
                </div>
                <Badge variant="secondary" className="text-[10px]">
                  {new Date((l as any).follow_up_date).toLocaleDateString()}
                </Badge>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-6">No upcoming follow-ups scheduled</p>
        )}
      </div>
    </div>
  );
}
