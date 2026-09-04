import { motion } from "framer-motion";
import { ArrowRight, Search, Globe, FileText, BarChart3, Link2, Smartphone, MapPin, Code2, HelpCircle, TrendingUp, Shield, Clock, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { servicePageSchemas } from "@/lib/seo/schema";
import ServiceCTA from "@/components/ServiceCTA";
import { useState } from "react";

const scrollToCTA = () => document.getElementById("service-cta")?.scrollIntoView({ behavior: "smooth" });

const services = [
  { icon: Search, title: "On-Page SEO", desc: "Keyword research, meta optimization, content structure, internal linking, and schema markup. We optimize every page element to rank for the right search queries." },
  { icon: Link2, title: "Off-Page SEO & Link Building", desc: "Quality backlink acquisition through guest posting, digital PR, broken link building, and niche outreach. We focus on authoritative, relevant links." },
  { icon: Code2, title: "Technical SEO", desc: "Site speed optimization, crawlability fixes, XML sitemaps, robots.txt, structured data, HTTPS, mobile-friendliness, and Core Web Vitals improvements." },
  { icon: MapPin, title: "Local SEO", desc: "Google Business Profile optimization, local citations, review management, and location-specific content to dominate local search results in your area." },
  { icon: FileText, title: "Content Strategy & Creation", desc: "SEO-driven content planning with topic clusters, pillar pages, blog articles, and landing pages that attract organic traffic and convert visitors." },
  { icon: BarChart3, title: "SEO Audits & Reporting", desc: "Comprehensive technical audits, competitor analysis, keyword gap reports, and monthly performance tracking with actionable recommendations." },
];

const results = [
  { metric: "85%", label: "Avg organic traffic growth" },
  { metric: "Top 10", label: "Rankings achieved for target keywords" },
  { metric: "3-6 mo", label: "Typical time to see meaningful results" },
  { metric: "20+", label: "SEO projects delivered" },
];

const detailedProcess = [
  { step: "SEO Audit & Competitor Analysis", desc: "Complete technical, on-page, and off-page audit of your website. We also analyze your top competitors to identify ranking opportunities." },
  { step: "Keyword Research & Strategy", desc: "In-depth keyword research to find high-intent, achievable keywords. We map keywords to pages and plan content gaps." },
  { step: "On-Page Optimization", desc: "Optimizing title tags, meta descriptions, headers, content, images, internal links, and schema markup across your entire site." },
  { step: "Technical Fixes", desc: "Resolving crawl errors, improving site speed, fixing broken links, implementing structured data, and ensuring mobile optimization." },
  { step: "Content Development", desc: "Creating high-quality, keyword-targeted content — blog posts, landing pages, FAQs, and pillar pages that build topical authority." },
  { step: "Link Building & Monitoring", desc: "Strategic backlink acquisition and continuous monitoring of rankings, traffic, and technical health with monthly reporting." },
];

const seoTools = [
  "Google Search Console", "Google Analytics", "Ahrefs", "SEMrush",
  "Screaming Frog", "Surfer SEO", "Google PageSpeed Insights", "Schema.org",
  "Google Business Profile", "Moz", "Yoast SEO", "Rank Math",
];

const faqs = [
  { q: "How long does SEO take to show results?", a: "SEO is a long-term strategy. You'll typically start seeing improvements in rankings and traffic within 3-6 months. Competitive keywords may take longer. We set realistic expectations upfront." },
  { q: "Do you guarantee first page rankings?", a: "No ethical SEO agency can guarantee specific rankings — Google's algorithm considers hundreds of factors. What we guarantee is a systematic, best-practice approach that has consistently improved rankings for our clients." },
  { q: "How much does SEO cost?", a: "Our SEO packages start from ₹20,000/month for basic local SEO and go up to ₹75,000+/month for comprehensive national/international campaigns. We'll recommend the right plan after understanding your goals." },
  { q: "Is SEO a one-time thing or ongoing?", a: "SEO requires ongoing effort. Search engines constantly update algorithms, competitors change strategies, and new content opportunities emerge. We recommend a minimum 6-month commitment for meaningful results." },
  { q: "Do you follow Google's guidelines?", a: "Absolutely. We only use white-hat SEO techniques that comply with Google's Webmaster Guidelines. No shortcuts, no black-hat tricks — just sustainable strategies that build long-term value." },
  { q: "Can you help with a website that was penalized by Google?", a: "Yes. We've helped recover websites from both manual and algorithmic penalties. We conduct a thorough audit, identify the issues, and create a recovery plan." },
];

export default function SEO() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  return (
    <>
      <SEOHead
        title="SEO Services India | Tech Handlers"
        description="Professional SEO services — on-page, off-page, technical SEO, local SEO, and content strategy. Improve your Google rankings and drive organic traffic."
        canonical="https://techhandlers.in/services/seo"
        jsonLd={servicePageSchemas({ name: "SEO Services", description: "Professional SEO services — on-page, off-page, technical SEO, local SEO, and content strategy. Improve your Google rankings and drive organic traffic.", path: "/services/seo" }, [faqJsonLd])}
      />
      <Header />
      <main>
        {/* Hero */}
        <section className="relative pt-28 pb-20 lg:pt-36 lg:pb-28 bg-background overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-20 right-[10%] w-80 h-80 rounded-full blur-3xl" style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.06), transparent 70%)" }} />
          </div>
          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="max-w-3xl">
              <span className="inline-block text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4">Search Engine Optimization</span>
              <h1 className="text-4xl lg:text-6xl font-display font-bold text-foreground leading-[1.08] mb-6">
                Rank Higher. <span className="text-primary">Get Found.</span> Grow Organically.
              </h1>
              <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed mb-8">
                SEO that drives real business results — not just rankings. We build organic traffic engines that bring qualified visitors to your website month after month.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="gradient-primary-accent text-primary-foreground font-semibold shadow-xl h-12 px-8" onClick={scrollToCTA}>
                  Get an SEO Consultation <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" className="h-12 px-8" onClick={scrollToCTA}>
                  View Our Approach
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Services */}
        <section className="py-20 lg:py-28 section-white">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-display font-bold text-lead mb-4">Our SEO Services</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">A complete SEO solution covering every aspect of search engine optimization.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((s, i) => (
                <motion.div key={s.title} className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow"
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                  <div className="w-12 h-12 rounded-xl bg-primary/[0.08] flex items-center justify-center mb-4">
                    <s.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold text-lead text-lg mb-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Results */}
        <section className="py-20 lg:py-28 bg-foreground">
          <div className="container mx-auto px-4 lg:px-8">
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-background text-center mb-12">SEO Results</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {results.map((r, i) => (
                <motion.div key={i} className="text-center" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                  <p className="text-4xl lg:text-5xl font-display font-bold text-primary mb-2">{r.metric}</p>
                  <p className="text-sm text-background/60">{r.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Process */}
        <section className="py-20 lg:py-28 section-white">
          <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-display font-bold text-lead mb-4">Our SEO Process</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">A systematic, transparent approach to improving your search engine visibility.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {detailedProcess.map((p, i) => (
                <motion.div key={i} className="flex gap-4 p-6 bg-card rounded-2xl border border-border"
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                  <div className="w-10 h-10 rounded-full gradient-primary-accent flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary-foreground">{i + 1}</span>
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-lead mb-1">{p.step}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Tools */}
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4 lg:px-8">
            <h2 className="text-2xl font-display font-bold text-lead text-center mb-8">Tools & Platforms We Use</h2>
            <div className="flex flex-wrap justify-center gap-3">
              {seoTools.map((tool, i) => (
                <motion.span key={tool} className="px-4 py-2 bg-card border border-border rounded-full text-sm font-medium text-muted-foreground"
                  initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}>
                  {tool}
                </motion.span>
              ))}
            </div>
          </div>
        </section>

        {/* CTA mid-page */}
        <section className="py-20 lg:py-28 section-white">
          <div className="container mx-auto px-4 lg:px-8 max-w-3xl text-center">
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-lead mb-4">Ready to Improve Your Search Rankings?</h2>
            <p className="text-muted-foreground mb-8">Let us analyze your current SEO performance and recommend a strategy tailored to your business goals.</p>
            <Button size="lg" className="gradient-primary-accent text-primary-foreground font-semibold shadow-xl h-12 px-8" onClick={scrollToCTA}>
              Get SEO Consultation <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </section>

        {/* FAQs */}
        <section className="py-20 lg:py-28 bg-muted/50">
          <div className="container mx-auto px-4 lg:px-8 max-w-3xl">
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-lead text-center mb-12">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <FAQItem key={i} q={faq.q} a={faq.a} />
              ))}
            </div>
          </div>
        </section>

        <ServiceCTA
          heading="Let's Boost Your Organic Traffic"
          description="Share your website and goals. We'll analyze your current SEO and suggest a plan to improve rankings."
          buttonText="Send Inquiry"
          service="SEO"
        />
      </main>
      <Footer />
    </>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div className="bg-card border border-border rounded-xl overflow-hidden" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between gap-4 p-5 text-left">
        <span className="font-display font-semibold text-lead text-sm">{q}</span>
        <HelpCircle className={`h-4 w-4 text-primary shrink-0 transition-transform ${open ? "rotate-45" : ""}`} />
      </button>
      <motion.div initial={false} animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }} className="overflow-hidden">
        <p className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">{a}</p>
      </motion.div>
    </motion.div>
  );
}
