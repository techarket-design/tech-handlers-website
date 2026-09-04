import { useAdminLeads, useAdminServices, useAdminBlogPosts } from "@/hooks/useData";
import { BarChart3, Users, TrendingUp, FileText, Settings, Globe, Flame, CalendarIcon, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { data: leads } = useAdminLeads();
  const { data: services } = useAdminServices();
  const { data: posts } = useAdminBlogPosts();

  const newLeads = leads?.filter(l => l.status === "new").length || 0;
  const totalLeads = leads?.length || 0;
  const activeServices = services?.filter(s => s.is_active).length || 0;
  const publishedPosts = posts?.filter(p => p.is_published).length || 0;
  const hotLeads = leads?.filter(l => (l as any).priority === "hot").length || 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const followUpsDueToday = leads?.filter(l => {
    const d = (l as any).follow_up_date;
    if (!d) return false;
    const fd = new Date(d);
    fd.setHours(0, 0, 0, 0);
    return fd <= today;
  }).length || 0;

  const stats = [
    { label: "Total Leads", value: totalLeads.toString(), icon: Users, change: `${newLeads} new`, link: "/admin/leads" },
    { label: "Hot Leads", value: hotLeads.toString(), icon: Flame, change: "high priority", link: "/admin/pipeline" },
    { label: "Follow-ups Due", value: followUpsDueToday.toString(), icon: CalendarIcon, change: "today/overdue", link: "/admin/pipeline" },
    { label: "Conversion Rate", value: totalLeads > 0 ? `${((leads?.filter(l => l.status === "converted").length || 0) / totalLeads * 100).toFixed(1)}%` : "—", icon: TrendingUp, change: "of all leads", link: "/admin/pipeline" },
  ];

  const pipelineStats = [
    { label: "New", count: leads?.filter(l => l.status === "new").length || 0 },
    { label: "Contacted", count: leads?.filter(l => l.status === "contacted").length || 0 },
    { label: "Qualified", count: leads?.filter(l => l.status === "qualified").length || 0 },
    { label: "Converted", count: leads?.filter(l => l.status === "converted").length || 0 },
    { label: "Lost", count: leads?.filter(l => l.status === "lost").length || 0 },
  ];

  const recentLeads = leads?.slice(0, 5) || [];

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-lead mb-1">Dashboard</h1>
      <p className="text-sm text-muted-foreground mb-6">Welcome back{user?.email ? `, ${user.email}` : ""}</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s, i) => (
          <Link key={i} to={s.link} className="bg-surface-white rounded-xl p-5 border border-border shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <s.icon className="h-4 w-4 text-primary" />
            </div>
            <p className="text-2xl font-display font-bold text-lead">{s.value}</p>
            <span className="text-xs text-accent font-medium">{s.change}</span>
          </Link>
        ))}
      </div>

      {/* Pipeline summary */}
      <div className="bg-surface-white rounded-xl p-6 border border-border shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-lead">Pipeline Overview</h2>
          <Link to="/admin/pipeline" className="text-xs text-primary font-semibold hover:underline">Open Pipeline →</Link>
        </div>
        <div className="flex gap-2">
          {pipelineStats.map(p => (
            <div key={p.label} className="flex-1 text-center p-3 rounded-lg bg-muted/30">
              <p className="text-lg font-display font-bold text-lead">{p.count}</p>
              <p className="text-xs text-muted-foreground">{p.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-surface-white rounded-xl p-6 border border-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-lead">Recent Leads</h2>
            <Link to="/admin/leads" className="text-xs text-primary font-semibold hover:underline">View All →</Link>
          </div>
          <div className="space-y-3">
            {recentLeads.map((l) => (
              <Link key={l.id} to={`/admin/leads/${l.id}`} className="flex items-center gap-3 py-2 border-b border-border last:border-0 hover:bg-muted/20 rounded px-1 -mx-1 transition-colors">
                <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-lead block truncate">{l.name}</span>
                  <span className="text-xs text-muted-foreground">{l.email || l.phone || "No contact"}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">{new Date(l.created_at).toLocaleDateString()}</span>
              </Link>
            ))}
            {!recentLeads.length && <p className="text-sm text-muted-foreground text-center py-4">No leads yet</p>}
          </div>
        </div>

        <div className="bg-surface-white rounded-xl p-6 border border-border shadow-sm">
          <h2 className="font-display font-semibold text-lead mb-4">Quick Links</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Pipeline", to: "/admin/pipeline", icon: BarChart3 },
              { label: "Services", to: "/admin/services", icon: Settings },
              { label: "Blog", to: "/admin/blog", icon: FileText },
              { label: "Tracking", to: "/admin/tracking", icon: Globe },
            ].map((link) => (
              <Link key={link.to} to={link.to} className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                <link.icon className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-lead">{link.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
