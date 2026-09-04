import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, MapPin, CheckCircle2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import ServiceCTA from "@/components/ServiceCTA";
import { Button } from "@/components/ui/button";
import { useGenericTable } from "@/hooks/useData";

function renderMarkdown(text?: string | null) {
  if (!text) return null;
  // Very small renderer: bold (**x**) + bullet lines (- ) + numbered (1. )
  const lines = text.split("\n");
  const blocks: JSX.Element[] = [];
  let list: string[] = [];
  let ordered = false;
  const flush = () => {
    if (list.length) {
      const items = list.map((l, i) => (
        <li key={i} className="flex gap-3"><CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" /><span dangerouslySetInnerHTML={{ __html: l.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") }} /></li>
      ));
      blocks.push(<ul key={blocks.length} className="space-y-3 my-4 text-muted-foreground">{items}</ul>);
      list = [];
    }
  };
  lines.forEach((raw) => {
    const line = raw.trim();
    if (!line) { flush(); return; }
    if (line.startsWith("- ")) { ordered = false; list.push(line.slice(2)); return; }
    if (/^\d+\.\s/.test(line)) { ordered = true; list.push(line.replace(/^\d+\.\s/, "")); return; }
    flush();
    blocks.push(
      <p key={blocks.length} className="text-muted-foreground leading-relaxed my-3"
        dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.+?)\*\*/g, "<strong class=\"text-foreground\">$1</strong>") }} />
    );
  });
  flush();
  return <div>{blocks}</div>;
}

export default function CityPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: rows, isLoading } = useGenericTable("city_pages", { filter: { slug } });
  const page: any = rows?.[0];

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse h-40 w-64 bg-muted rounded-xl" />
        </main>
        <Footer />
      </>
    );
  }

  if (!page) {
    return (
      <>
        <SEOHead title="Page not found" noindex />
        <Header />
        <main className="min-h-screen flex items-center justify-center text-center px-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Location page not found</h1>
            <p className="text-muted-foreground mb-6">It may have moved or been unpublished.</p>
            <Link to="/"><Button>Back home</Button></Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const canonical = `https://techhandlers.in/locations/${page.slug}`;
  const faqs: Array<{ q: string; a: string }> = Array.isArray(page.faqs) ? page.faqs : [];

  const localBusinessLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: `Tech Handlers — ${page.service} in ${page.city}`,
    description: page.meta_description || page.hero_subtitle,
    url: canonical,
    areaServed: { "@type": "City", name: page.city },
    address: { "@type": "PostalAddress", addressLocality: page.city, addressCountry: "IN" },
    telephone: "+91-98765-43210",
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://techhandlers.in/" },
      { "@type": "ListItem", position: 2, name: "Locations", item: "https://techhandlers.in/locations" },
      { "@type": "ListItem", position: 3, name: `${page.service} in ${page.city}`, item: canonical },
    ],
  };
  const faqLd = faqs.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      }
    : null;

  return (
    <>
      <SEOHead
        title={page.meta_title || `${page.h1} | Tech Handlers`}
        description={page.meta_description || page.hero_subtitle || undefined}
        canonical={canonical}
        ogImage={page.hero_image_url || undefined}
        jsonLd={faqLd ? [localBusinessLd, breadcrumbLd, faqLd] : [localBusinessLd, breadcrumbLd]}
      />
      <Header />
      <main>
        {/* Hero */}
        <section className="relative pt-28 pb-20 lg:pt-36 lg:pb-24 bg-background overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-20 right-[10%] w-80 h-80 rounded-full blur-3xl" style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.06), transparent 70%)" }} />
          </div>
          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-3xl">
              <span className="inline-flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4">
                <MapPin className="h-3.5 w-3.5" /> {page.city} · {page.service}
              </span>
              <h1 className="text-4xl lg:text-6xl font-display font-bold text-foreground leading-[1.08] mb-6">{page.h1}</h1>
              {page.hero_subtitle && <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed mb-8">{page.hero_subtitle}</p>}
              <Button size="lg" onClick={() => document.getElementById("service-cta")?.scrollIntoView({ behavior: "smooth" })} className="gradient-primary-accent text-primary-foreground">
                Get your free audit <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Intro / Why / Process */}
        {(page.intro || page.why_us || page.process) && (
          <section className="py-16 lg:py-24">
            <div className="container mx-auto px-4 lg:px-8 max-w-3xl space-y-12">
              {page.intro && (
                <div>
                  <h2 className="text-2xl lg:text-3xl font-display font-bold mb-4">About this service in {page.city}</h2>
                  {renderMarkdown(page.intro)}
                </div>
              )}
              {page.why_us && (
                <div>
                  <h2 className="text-2xl lg:text-3xl font-display font-bold mb-4">Why us</h2>
                  {renderMarkdown(page.why_us)}
                </div>
              )}
              {page.process && (
                <div>
                  <h2 className="text-2xl lg:text-3xl font-display font-bold mb-4">Our process</h2>
                  {renderMarkdown(page.process)}
                </div>
              )}
            </div>
          </section>
        )}

        {/* FAQs */}
        {faqs.length > 0 && (
          <section className="py-16 lg:py-20 bg-muted/30">
            <div className="container mx-auto px-4 lg:px-8 max-w-3xl">
              <h2 className="text-2xl lg:text-3xl font-display font-bold mb-8">Frequently asked questions</h2>
              <div className="space-y-4">
                {faqs.map((f, i) => (
                  <details key={i} className="bg-surface-white border border-border rounded-xl p-5 group">
                    <summary className="font-semibold cursor-pointer">{f.q}</summary>
                    <p className="text-muted-foreground mt-3 leading-relaxed">{f.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>
        )}

        <ServiceCTA
          heading={page.cta_heading || `Ready to grow your business in ${page.city}?`}
          description={page.cta_description || ""}
          buttonText="Get my free audit"
          service={`${page.service} — ${page.city}`}
        />
      </main>
      <Footer />
    </>
  );
}