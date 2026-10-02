import { Outlet, Link, useLocation } from "react-router-dom";
import { useQueryClient, useIsFetching } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import {
  SidebarProvider, SidebarTrigger, Sidebar, SidebarContent,
  SidebarGroup, SidebarGroupLabel, SidebarGroupContent,
  SidebarMenu, SidebarMenuItem, SidebarMenuButton, useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import { useAuth, type ModuleKey } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import ErrorBoundary from "@/components/ErrorBoundary";
import { NotificationBell } from "@/components/admin/NotificationBell";
import { EnableNotificationsBanner } from "@/components/admin/EnableNotificationsBanner";
import { UploadResumeBanner } from "@/components/admin/UploadResumeBanner";
import { SyncStatusIndicator } from "@/components/admin/SyncStatusIndicator";
import { FileViewerProvider } from "@/components/admin/FileViewer";
import { useRealtimeTables } from "@/hooks/useRealtimeTable";
import {
  LayoutDashboard, Settings, Users, FileText, TrendingUp,
  BarChart3, Code, LogOut, FolderOpen, CheckSquare, Briefcase,
  Building2, Receipt, Wallet, PieChart, Sparkles, UserCircle,
  Trophy, Instagram, MapPin, ShieldCheck, FileLock, RefreshCw,
  Film,
} from "lucide-react";
import logoImg from "@/assets/logo.png";

type NavItem = { title: string; url: string; icon: any; isLabel?: boolean; module?: ModuleKey };
const navItems: NavItem[] = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "My Workspace", url: "/admin/workspace", icon: Sparkles },
  { title: "— CRM —", url: "", icon: Users, isLabel: true, module: "crm" },
  { title: "Pipeline", url: "/admin/pipeline", icon: TrendingUp, module: "crm" },
  { title: "All Leads", url: "/admin/leads", icon: Users, module: "crm" },
  { title: "Form Submissions", url: "/admin/form-submissions", icon: FileText, module: "crm" },
  { title: "Reminders", url: "/admin/reminders", icon: BarChart3, module: "crm" },
  { title: "— Tasks —", url: "", icon: CheckSquare, isLabel: true, module: "tasks" },
  { title: "Projects", url: "/admin/tasks/projects", icon: Briefcase, module: "tasks" },
  { title: "All Tasks", url: "/admin/tasks", icon: CheckSquare, module: "tasks" },
  { title: "— Business —", url: "", icon: Building2, isLabel: true, module: "customers" },
  { title: "Customers", url: "/admin/customers", icon: Building2, module: "customers" },
  { title: "Invoices", url: "/admin/billing/invoices", icon: Receipt, module: "billing" },
  { title: "Payments", url: "/admin/billing/payments", icon: Wallet, module: "billing" },
  { title: "Reports", url: "/admin/billing/reports", icon: PieChart, module: "billing" },
  { title: "— Content —", url: "", icon: FileText, isLabel: true, module: "content" },
  { title: "Blog Posts", url: "/admin/blog", icon: FileText, module: "content" },
  { title: "Gemini Blog Connection", url: "/admin/blog-connection", icon: Sparkles, module: "content" },
  { title: "Case Studies", url: "/admin/case-studies", icon: Trophy, module: "content" },
  { title: "Social Showcase", url: "/admin/social-posts", icon: Instagram, module: "content" },
  { title: "Video Showcase", url: "/admin/video-showcase", icon: Film, module: "content" },
  { title: "City Pages (SEO)", url: "/admin/city-pages", icon: MapPin, module: "content" },
  { title: "Trust Badges", url: "/admin/trust-badges", icon: ShieldCheck, module: "content" },
  { title: "Legal Pages", url: "/admin/legal-pages", icon: FileLock, module: "content" },
  { title: "File Manager", url: "/admin/files", icon: FolderOpen, module: "content" },
  { title: "— Settings —", url: "", icon: Settings, isLabel: true, module: "settings" },
  { title: "Team", url: "/admin/team", icon: Users, module: "team" },
  { title: "Nav Links", url: "/admin/nav-links", icon: Settings, module: "settings" },
  { title: "Footer Links", url: "/admin/footer-links", icon: Settings, module: "settings" },
  { title: "Tracking", url: "/admin/tracking", icon: Code, module: "tracking" },
  { title: "Settings", url: "/admin/settings", icon: Settings, module: "settings" },
  { title: "My Account", url: "/admin/account", icon: UserCircle },
];

function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut, hasModule } = useAuth();
  const visibleItems = navItems.filter((item) => !item.module || hasModule(item.module));

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="p-4 flex items-center gap-2">
          <img src={logoImg} alt="Tech Handlers" className="h-8 w-auto" />
          {!collapsed && <span className="font-display text-sm font-bold text-sidebar-foreground">Tech Handlers</span>}
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>Admin</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) =>
                (item as any).isLabel ? (
                  !collapsed ? (
                    <li key={item.title} className="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/40">{item.title.replace(/—/g, "").trim()}</li>
                  ) : null
                ) : (
                  <SidebarMenuItem key={item.title + item.url}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} end={item.url === "/admin"} className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                        <item.icon className="mr-2 h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <div className="mt-auto p-4">
          <Button variant="ghost" size="sm" className="w-full justify-start text-sidebar-foreground/60 hover:text-sidebar-foreground" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            {!collapsed && "Sign Out"}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

function SyncButton() {
  const qc = useQueryClient();
  const fetching = useIsFetching();
  const handleSync = async () => {
    try {
      await qc.invalidateQueries();
      await qc.refetchQueries({ type: "active" });
      toast({ title: "Synced", description: "Data refreshed from server." });
    } catch (e: any) {
      toast({ title: "Sync failed", description: e?.message || "Try again.", variant: "destructive" });
    }
  };
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleSync}
      disabled={fetching > 0}
      title="Refresh data from server"
      className="gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${fetching > 0 ? "animate-spin" : ""}`} />
      <span className="hidden sm:inline">Sync</span>
    </Button>
  );
}

export default function AdminLayout() {
  // One shared realtime channel for high-traffic admin tables — panels update
  // instantly across tabs and teammates with no refresh.
  useRealtimeTables([
    "leads", "lead_activities", "lead_assignees",
    "tasks", "task_projects", "task_assignees", "task_comments", "task_activities",
    "project_journey_entries", "project_milestones", "project_files",
    "notifications", "customers", "invoices", "payments",
    "video_showcase_items",
  ]);
  return (
    <SidebarProvider>
      <FileViewerProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b border-border px-4 bg-surface-white">
            <SidebarTrigger className="mr-4" />
            <Link to="/" className="text-sm text-muted-foreground hover:text-lead">← Back to Site</Link>
            <div className="ml-auto flex items-center gap-2">
              <SyncStatusIndicator />
              <SyncButton />
              <NotificationBell />
            </div>
          </header>
          <EnableNotificationsBanner />
          <UploadResumeBanner />
          <main className="flex-1 p-6 bg-background">
            <ErrorBoundary
              fallback={
                <div className="max-w-lg mx-auto mt-12 p-6 rounded-xl border border-border bg-surface-white text-center">
                  <h2 className="font-display text-lg font-bold text-lead mb-2">Something went wrong on this page</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    A glitch prevented this view from rendering. Your work is safe — try syncing or reloading.
                  </p>
                  <Button onClick={() => window.location.reload()} className="gradient-primary-accent text-primary-foreground">
                    Reload page
                  </Button>
                </div>
              }
            >
              <Outlet />
            </ErrorBoundary>
          </main>
        </div>
      </div>
      </FileViewerProvider>
    </SidebarProvider>
  );
}
