import PublicConsent from "@/components/PublicConsent";
import { lazy, Suspense } from "react";
import { StaticRouter } from "react-router-dom/server";
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import TrackingScripts from "@/components/TrackingScripts";
import ProtectedRoute from "@/components/ProtectedRoute";
import ScrollToTop from "@/components/ScrollToTop";
import MotionPolicy from "@/components/motion/MotionPolicy";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import DigitalMarketing from "./pages/services/DigitalMarketing.tsx";
import PerformanceMarketing from "./pages/services/PerformanceMarketing.tsx";
import WebDevelopment from "./pages/services/WebDevelopment.tsx";
import LinkedInAutomation from "./pages/services/LinkedInAutomation.tsx";
import SEO from "./pages/services/SEO.tsx";
import SocialMediaMarketing from "./pages/services/SocialMediaMarketing.tsx";
import About from "./pages/About.tsx";
import Blog from "./pages/Blog.tsx";
import BlogPost from "./pages/BlogPost.tsx";
import CaseStudies from "./pages/CaseStudies.tsx";
import CaseStudyDetail from "./pages/CaseStudyDetail.tsx";
const AdminLayout = lazy(() => import("./components/AdminLayout.tsx"));
const AdminLogin = lazy(() => import("./pages/admin/Login.tsx"));
const BlogConnection = lazy(() => import("./pages/admin/BlogConnection.tsx"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard.tsx"));
const ViewLeads = lazy(() => import("./pages/admin/ViewLeads.tsx"));
const BlogPosts = lazy(() => import("./pages/admin/BlogPosts.tsx"));
const CRMPipeline = lazy(() => import("./pages/admin/CRMPipeline.tsx"));
const LeadDetail = lazy(() => import("./pages/admin/LeadDetail.tsx"));
const TeamManagement = lazy(() => import("./pages/admin/TeamManagement.tsx"));
const FollowUpReminders = lazy(() => import("./pages/admin/FollowUpReminders.tsx"));
const AdminTracking = lazy(() => import("./pages/admin/Tracking.tsx"));
const AdminSettings = lazy(() => import("./pages/admin/Settings.tsx"));
const AdminNavLinks = lazy(() => import("./pages/admin/NavLinks.tsx"));
const AdminFooterLinks = lazy(() => import("./pages/admin/FooterLinks.tsx"));
const FileManager = lazy(() => import("./pages/admin/FileManager.tsx"));
const Tasks = lazy(() => import("./pages/admin/Tasks.tsx"));
const TaskProjects = lazy(() => import("./pages/admin/TaskProjects.tsx"));
const ProjectDetail = lazy(() => import("./pages/admin/ProjectDetail.tsx"));
const TaskDetail = lazy(() => import("./pages/admin/TaskDetail.tsx"));
const Customers = lazy(() => import("./pages/admin/Customers.tsx"));
const CustomerDetail = lazy(() => import("./pages/admin/CustomerDetail.tsx"));
const Invoices = lazy(() => import("./pages/admin/billing/Invoices.tsx"));
const InvoiceDetail = lazy(() => import("./pages/admin/billing/InvoiceDetail.tsx"));
const Payments = lazy(() => import("./pages/admin/billing/Payments.tsx"));
const BillingReports = lazy(() => import("./pages/admin/billing/Reports.tsx"));
const MyAccount = lazy(() => import("./pages/admin/MyAccount.tsx"));
const MyWorkspace = lazy(() => import("./pages/admin/MyWorkspace.tsx"));
const AdminCaseStudies = lazy(() => import("./pages/admin/CaseStudies.tsx"));
const AdminSocialPosts = lazy(() => import("./pages/admin/SocialPosts.tsx"));
const AdminCityPages = lazy(() => import("./pages/admin/CityPages.tsx"));
import CityPage from "./pages/CityPage.tsx";
import LegalPage from "./pages/LegalPage.tsx";
const TrustBadgesAdmin = lazy(() => import("./pages/admin/TrustBadges.tsx"));
const LegalPagesAdmin = lazy(() => import("./pages/admin/LegalPagesAdmin.tsx"));
const AdminVideoShowcase = lazy(() => import("./pages/admin/VideoShowcase.tsx"));
const FormSubmissions = lazy(() => import("./pages/admin/FormSubmissions.tsx"));

const AppErrorFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center p-8">
      <h1 className="text-2xl font-bold text-foreground mb-2">Something went wrong</h1>
      <p className="text-muted-foreground mb-4">Please refresh the page to try again.</p>
      <button onClick={() => window.location.reload()} className="px-4 py-2 bg-primary text-primary-foreground rounded-md">
        Refresh Page
      </button>
    </div>
  </div>
);

const App = ({ serverUrl, queryClient }: { serverUrl?: string; queryClient: QueryClient }) => {
  const Router = serverUrl ? StaticRouter : BrowserRouter;
  return (
  <ErrorBoundary fallback={<AppErrorFallback />}>
    <QueryClientProvider client={queryClient}>
      <AuthProvider><MotionPolicy>
        <TooltipProvider>
          <Toaster />
          <Sonner />
           <Router location={serverUrl}>
           <PublicConsent />
           <TrackingScripts />
            <Suspense fallback={<div role="status" className="p-8">Loading…</div>}>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/services/digital-marketing" element={<DigitalMarketing />} />
            <Route path="/services/performance-marketing" element={<PerformanceMarketing />} />
            <Route path="/services/web-development" element={<WebDevelopment />} />
            <Route path="/services/linkedin-automation" element={<LinkedInAutomation />} />
            <Route path="/services/seo" element={<SEO />} />
            <Route path="/services/social-media-marketing" element={<SocialMediaMarketing />} />
            <Route path="/about" element={<About />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/case-studies" element={<CaseStudies />} />
            <Route path="/case-studies/:slug" element={<CaseStudyDetail />} />
            <Route path="/locations/:slug" element={<CityPage />} />
            <Route path="/privacy-policy" element={<LegalPage />} />
            <Route path="/terms-of-service" element={<LegalPage />} />
            <Route path="/refund-policy" element={<LegalPage />} />
            <Route path="/cookie-policy" element={<LegalPage />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/blog-connection" element={<BlogConnection />} />
            <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
              <Route index element={<AdminDashboard />} />
              <Route path="leads" element={<ViewLeads />} />
              <Route path="form-submissions" element={<FormSubmissions />} />
              <Route path="leads/:id" element={<LeadDetail />} />
              <Route path="pipeline" element={<CRMPipeline />} />
              <Route path="reminders" element={<FollowUpReminders />} />
              <Route path="team" element={<TeamManagement />} />
              <Route path="blog" element={<BlogPosts />} />
              <Route path="tracking" element={<AdminTracking />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="nav-links" element={<AdminNavLinks />} />
              <Route path="footer-links" element={<AdminFooterLinks />} />
              <Route path="files" element={<FileManager />} />
              <Route path="tasks" element={<Tasks />} />
              <Route path="tasks/projects" element={<TaskProjects />} />
              <Route path="tasks/projects/:id" element={<ProjectDetail />} />
              <Route path="tasks/:id" element={<TaskDetail />} />
              <Route path="customers" element={<Customers />} />
              <Route path="customers/:id" element={<CustomerDetail />} />
              <Route path="billing/invoices" element={<Invoices />} />
              <Route path="billing/invoices/:id" element={<InvoiceDetail />} />
              <Route path="billing/payments" element={<Payments />} />
              <Route path="billing/reports" element={<BillingReports />} />
              <Route path="account" element={<MyAccount />} />
              <Route path="workspace" element={<MyWorkspace />} />
              <Route path="case-studies" element={<AdminCaseStudies />} />
              <Route path="social-posts" element={<AdminSocialPosts />} />
              <Route path="city-pages" element={<AdminCityPages />} />
              <Route path="trust-badges" element={<TrustBadgesAdmin />} />
              <Route path="legal-pages" element={<LegalPagesAdmin />} />
              <Route path="video-showcase" element={<AdminVideoShowcase />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
           </Router>
        </TooltipProvider>
      </MotionPolicy></AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);
};

export default App;
