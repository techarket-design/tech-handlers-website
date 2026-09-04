import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import TrackingScripts from "@/components/TrackingScripts";
import ProtectedRoute from "@/components/ProtectedRoute";
import ScrollToTop from "@/components/ScrollToTop";
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
import AdminLayout from "./components/AdminLayout.tsx";
import AdminLogin from "./pages/admin/Login.tsx";
import AdminDashboard from "./pages/admin/Dashboard.tsx";
import ViewLeads from "./pages/admin/ViewLeads.tsx";
import BlogPosts from "./pages/admin/BlogPosts.tsx";
import CRMPipeline from "./pages/admin/CRMPipeline.tsx";
import LeadDetail from "./pages/admin/LeadDetail.tsx";
import TeamManagement from "./pages/admin/TeamManagement.tsx";
import FollowUpReminders from "./pages/admin/FollowUpReminders.tsx";
import AdminTracking from "./pages/admin/Tracking.tsx";
import AdminSettings from "./pages/admin/Settings.tsx";
import AdminNavLinks from "./pages/admin/NavLinks.tsx";
import AdminFooterLinks from "./pages/admin/FooterLinks.tsx";
import FileManager from "./pages/admin/FileManager.tsx";
import Tasks from "./pages/admin/Tasks.tsx";
import TaskProjects from "./pages/admin/TaskProjects.tsx";
import ProjectDetail from "./pages/admin/ProjectDetail.tsx";
import TaskDetail from "./pages/admin/TaskDetail.tsx";
import Customers from "./pages/admin/Customers.tsx";
import CustomerDetail from "./pages/admin/CustomerDetail.tsx";
import Invoices from "./pages/admin/billing/Invoices.tsx";
import InvoiceDetail from "./pages/admin/billing/InvoiceDetail.tsx";
import Payments from "./pages/admin/billing/Payments.tsx";
import BillingReports from "./pages/admin/billing/Reports.tsx";
import MyAccount from "./pages/admin/MyAccount.tsx";
import MyWorkspace from "./pages/admin/MyWorkspace.tsx";
import AdminCaseStudies from "./pages/admin/CaseStudies.tsx";
import AdminSocialPosts from "./pages/admin/SocialPosts.tsx";
import AdminCityPages from "./pages/admin/CityPages.tsx";
import CityPage from "./pages/CityPage.tsx";
import LegalPage from "./pages/LegalPage.tsx";
import TrustBadgesAdmin from "./pages/admin/TrustBadges.tsx";
import LegalPagesAdmin from "./pages/admin/LegalPagesAdmin.tsx";
import AdminVideoShowcase from "./pages/admin/VideoShowcase.tsx";
import FormSubmissions from "./pages/admin/FormSubmissions.tsx";
import OAuthConsent from "./pages/OAuthConsent.tsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Odoo-like behaviour: load once, keep cached, refresh only via the Sync button
      // or after a mutation invalidates the relevant query.
      staleTime: Infinity,
      gcTime: Infinity,
      retry: 2,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

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

const App = () => (
  <ErrorBoundary fallback={<AppErrorFallback />}>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <TrackingScripts />
          <BrowserRouter>
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
            <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
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
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
