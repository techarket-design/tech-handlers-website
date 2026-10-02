import InternationalDelivery from "@/components/InternationalDelivery";
import { useMemo, lazy, Suspense } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import VideoShowcaseSection from "@/components/VideoShowcaseSection";
import WhatsAppWidget from "@/components/WhatsAppWidget";
import Footer from "@/components/Footer";
import ErrorBoundary from "@/components/ErrorBoundary";
import SEOHead from "@/components/SEOHead";
import { useHomepageSections } from "@/hooks/useData";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load all below-fold sections for faster initial paint
const MetricsSection = lazy(() => import("@/components/MetricsSection"));
const ServicesSection = lazy(() => import("@/components/ServicesSection"));
const ProcessSection = lazy(() => import("@/components/ProcessSection"));
const CaseStudiesSection = lazy(() => import("@/components/CaseStudiesSection"));

const PlatformExpertiseSection = lazy(() => import("@/components/PlatformExpertiseSection"));
const TestimonialsSection = lazy(() => import("@/components/TestimonialsSection"));
const WhyUsSection = lazy(() => import("@/components/WhyUsSection"));
const CTABanner = lazy(() => import("@/components/CTABanner"));
const SocialShowcaseSection = lazy(() => import("@/components/SocialShowcaseSection"));
const FAQSection = lazy(() => import("@/components/FAQSection"));
const ContactSection = lazy(() => import("@/components/ContactSection"));
const TrustBadgesSection = lazy(() => import("@/components/TrustBadgesStrip"));
import CookieConsentBanner from "@/components/CookieConsentBanner";
import StickyConversionBar from "@/components/StickyConversionBar";

const SECTION_MAP: Record<string, React.ComponentType> = {
  hero: HeroSection,
  metrics: MetricsSection,
  services: ServicesSection,
  process: ProcessSection,
  case_studies: CaseStudiesSection,
  
  testimonials: TestimonialsSection,
  why_us: WhyUsSection,
  cta: CTABanner,
  social_showcase: SocialShowcaseSection,
  faq: FAQSection,
  contact: ContactSection,
  platform_expertise: PlatformExpertiseSection,
  trust_badges: TrustBadgesSection,
  video_showcase: VideoShowcaseSection,
};

const DEFAULT_ORDER = [
  "hero", "video_showcase", "trust_badges", "metrics", "services", "process",
  "case_studies", "testimonials", "why_us", "cta", "social_showcase", "platform_expertise", "faq", "contact",
];

function SectionFallback() {
  return (
    <div className="py-16 px-4">
      <div className="container mx-auto max-w-5xl space-y-6">
        <Skeleton className="h-10 w-72 mx-auto" />
        <Skeleton className="h-5 w-96 mx-auto" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

const Index = () => {
  const { data: dbSections } = useHomepageSections();

  const orderedSections = useMemo(() => {
    const rows = (dbSections as any[]) || [];
    const byKey = new Map<string, { sort_order: number; is_visible: boolean }>();
    rows.forEach((r: any) => byKey.set(r.section_key, { sort_order: r.sort_order, is_visible: r.is_visible }));
    // Merge: every DEFAULT_ORDER key is rendered (visible unless DB explicitly hides it),
    // and any extra DB-only keys are appended.
    const merged = DEFAULT_ORDER.map((key, i) => {
      const db = byKey.get(key);
      return { key, visible: db ? db.is_visible : true, sort_order: db ? db.sort_order : (i + 1) * 10 };
    });
    rows.forEach((r: any) => {
      if (!DEFAULT_ORDER.includes(r.section_key)) {
        merged.push({ key: r.section_key, visible: r.is_visible, sort_order: r.sort_order });
      }
    });
    return merged.sort((a, b) => a.sort_order - b.sort_order);
  }, [dbSections]);

  return (
    <>
      <SEOHead
        title="Tech Handlers | Digital Marketing & Web Development Agency"
        description="India-based digital marketing and web development for businesses worldwide. Explore SEO, performance marketing and website services, and discuss your project."
        canonical="https://www.techhandlers.in/"
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Tech Handlers",
            url: "https://www.techhandlers.in/",
            potentialAction: {
              "@type": "SearchAction",
              target: "https://www.techhandlers.in/blog?search={search_term_string}",
              "query-input": "required name=search_term_string",
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Tech Handlers",
            url: "https://www.techhandlers.in/",
            logo: "https://www.techhandlers.in/og-image.png",
            contactPoint: {
              "@type": "ContactPoint",
              contactType: "customer service"
            }
          }
        ]}
      />
      <Header />
      <main>
        {orderedSections.map(({ key, visible }) => {
          if (!visible) return null;
          const Component = SECTION_MAP[key];
          if (!Component) return null;
          // Hero renders eagerly, everything else lazy-loaded
          if (key === "hero") return <ErrorBoundary key={key}><Component /></ErrorBoundary>;
          return (
            <ErrorBoundary key={key}>
              <Suspense fallback={<SectionFallback />}>
                <Component />
              </Suspense>
            </ErrorBoundary>
          );
        })}
        <InternationalDelivery />
      </main>
      <Footer />
      <WhatsAppWidget />
      <StickyConversionBar />
    </>
  );
};

export default Index;
