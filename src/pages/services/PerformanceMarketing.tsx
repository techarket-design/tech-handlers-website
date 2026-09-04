import { motion } from "framer-motion";
import { ArrowRight, Target, BarChart3, Zap, DollarSign, LineChart, Layers, CheckCircle2, HelpCircle, TrendingUp, Shield, Clock, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { servicePageSchemas } from "@/lib/seo/schema";
import ServiceCTA from "@/components/ServiceCTA";
import { useState } from "react";

const scrollToCTA = () => document.getElementById("service-cta")?.scrollIntoView({ behavior: "smooth" });

const services = [
  { icon: Target, title: "Google Ads (PPC)", desc: "Search, display, shopping, and YouTube campaigns managed by certified specialists. We optimize for conversions, not just clicks, ensuring every rupee drives real business outcomes." },
  { icon: Layers, title: "Meta Ads (Facebook & Instagram)", desc: "Precision audience targeting with creative-first campaigns. From awareness to retargeting, we build full-funnel strategies that turn scrollers into buyers." },
  { icon: LineChart, title: "LinkedIn Advertising", desc: "B2B lead generation with sponsored content, InMail campaigns, and lead gen forms. Reach CXOs and decision-makers with compelling messaging." },
  { icon: Zap, title: "Programmatic & Display Advertising", desc: "Automated, AI-driven ad buying across premium networks. Maximize reach with real-time bidding, contextual targeting, and brand-safe placements." },
  { icon: DollarSign, title: "Retargeting & Remarketing", desc: "Re-engage visitors who didn't convert with personalized ads across Google, Meta, and display networks. Our retargeting sequences bring back warm leads efficiently." },
  { icon: BarChart3, title: "Conversion Rate Optimization (CRO)", desc: "A/B testing, landing page optimization, heatmap analysis, and funnel audits to squeeze maximum conversions from your existing traffic." },
];

const results = [
  { metric: "30%", label: "Avg reduction in cost per acquisition" },
  { metric: "₹2Cr+", label: "Total ad spend managed" },
  { metric: "3x", label: "Avg return on ad spend" },
  { metric: "40+", label: "Campaigns delivered" },
];

const platforms = [
  "Google Ads", "Meta Ads", "LinkedIn Ads", "YouTube Ads",
  "Twitter/X Ads", "Amazon Ads", "Programmatic (DV360)", "Google Analytics",
  "Google Tag Manager", "Hotjar", "Unbounce", "HubSpot",
];

const detailedProcess = [
  { step: "Account & Competitor Audit", desc: "We analyze your existing ad accounts, competitor campaigns, and market landscape to identify quick wins and long-term opportunities." },
  { step: "Strategy & Channel Mix", desc: "Custom strategy with recommended platforms, budget allocation, audience segments, and campaign structures tailored to your business goals." },
  { step: "Creative Development", desc: "Ad copy, visuals, video scripts, and landing page designs — all optimized for conversion. We test multiple creative variations from day one." },
  { step: "Campaign Launch & Setup", desc: "Proper tracking setup (GTM, conversion pixels, UTMs), campaign structure, bid strategies, and audience targeting — every detail matters." },
  { step: "Daily Optimization", desc: "Active bid management, search term optimization, audience refinement, and budget reallocation based on real-time performance data." },
  { step: "Reporting & Scaling", desc: "Weekly performance summaries and monthly deep-dive reports. We scale winning campaigns and sunset underperformers." },
];

const whyUs = [
  { icon: TrendingUp, title: "Revenue-First Mindset", desc: "We optimize for your actual business metrics — leads, sales, and revenue — not vanity numbers like impressions." },
  { icon: Shield, title: "Full Transparency", desc: "You own your ad accounts. We provide full access to dashboards and never hide data behind opaque reports." },
  { icon: Clock, title: "Fast Response Times", desc: "Dedicated account managers who respond within hours, not days. Your campaigns get the attention they deserve." },
  { icon: Award, title: "Certified Team", desc: "Google and Meta certified professionals who stay current with platform updates and industry best practices." },
];

const faqs = [
  { q: "How much should I budget for performance marketing?", a: "It depends on your industry, competition, and goals. We typically recommend starting with ₹50,000-₹1,00,000/month in ad spend plus management fees. We'll help you determine the right budget during our strategy call." },
  { q: "How quickly will I see results from paid ads?", a: "Unlike SEO, paid campaigns can start generating traffic immediately. However, we recommend a 2-4 week optimization period to refine targeting and creatives before expecting consistent performance." },
  { q: "Do I own the ad accounts?", a: "Yes, absolutely. We always set up campaigns in your own ad accounts. If you ever part ways with us, you retain full ownership of accounts, data, and campaign history." },
  { q: "What's the difference between performance marketing and digital marketing?", a: "Performance marketing is a subset of digital marketing focused specifically on paid channels with measurable, direct-response outcomes. It's all about ROI — every rupee spent can be tracked to a specific result." },
  { q: "Can you work with my existing ad accounts?", a: "Yes. We'll audit your existing accounts, identify what's working, fix what isn't, and build on the data you already have. No need to start from scratch." },
  { q: "How often do I get reports?", a: "We provide real-time dashboard access, weekly performance summaries, and detailed monthly reports with strategic recommendations." },
];

export default function PerformanceMarketing() {
  return (
    <>
      <SEOHead
        title="Performance Marketing Services | Tech Handlers"
        description="ROI-focused performance marketing services — Google Ads, Meta Ads, LinkedIn Ads, CRO, and retargeting. Every rupee optimized for maximum conversions."
        canonical="https://techhandlers.in/services/performance-marketing"
        jsonLd={servicePageSchemas({ name: "Performance Marketing Services", description: "ROI-focused performance marketing services — Google Ads, Meta Ads, LinkedIn Ads, CRO, and retargeting. Every rupee optimized for maximum conversions.", path: "/services/performance-marketing" }, [])}
      />
      <Header />
      <main>
        {/* Hero */}
        <section className="relative pt-28 pb-20 lg:pt-36 lg:pb-28 bg-background overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-20 right-[10%] w-80 h-80 rounded-full blur-3xl" style={{ background: "radial-gradient(circle, hsl(var(--accent) / 0.06), transparent 70%)" }} />
          </div>
          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="max-w-3xl">
              <span className="inline-block text-xs font-bold text-accent uppercase tracking-[0.2em] mb-4">Performance Marketing</span>
              <h1 className="text-4xl lg:text-6xl font-display font-bold text-foreground leading-[1.08] mb-6">
                Every Rupee <span className="text-accent">Optimized</span> for Maximum Returns
              </h1>
              <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed mb-8">
                We don't just run ads — we build conversion machines. Our performance marketing strategies deliver measurable ROI across Google, Meta, LinkedIn, and beyond.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="gradient-primary-accent text-primary-foreground font-semibold shadow-xl h-12 px-8" onClick={scrollToCTA}>
                  Let's Talk Campaigns <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" className="h-12 px-8" onClick={scrollToCTA}>
                  See Our Process
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Services Grid */}
        <section className="py-20 lg:py-28 section-white">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-display font-bold text-lead mb-4">Paid Advertising Services</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">From Google to LinkedIn, we manage and optimize campaigns that convert clicks into customers and leads into revenue.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((s, i) => (
                <motion.div key={s.title} className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow"
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                  <div className="w-12 h-12 rounded-xl bg-accent/[0.08] flex items-center justify-center mb-4">
                    <s.icon className="h-6 w-6 text-accent" />
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
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-background text-center mb-12">Performance by Numbers</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {results.map((r, i) => (
                <motion.div key={i} className="text-center" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                  <p className="text-4xl lg:text-5xl font-display font-bold text-accent mb-2">{r.metric}</p>
                  <p className="text-sm text-background/60">{r.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Detailed Process */}
        <section className="py-20 lg:py-28 section-white">
          <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-display font-bold text-lead mb-4">Our Performance Marketing Process</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">A systematic approach that eliminates guesswork and maximizes your advertising ROI.</p>
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

        {/* Platforms */}
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4 lg:px-8">
            <h2 className="text-2xl font-display font-bold text-lead text-center mb-8">Platforms & Tools We Use</h2>
            <div className="flex flex-wrap justify-center gap-3">
              {platforms.map((p, i) => (
                <motion.span key={p} className="px-4 py-2 bg-card border border-border rounded-full text-sm font-medium text-muted-foreground"
                  initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}>
                  {p}
                </motion.span>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-20 lg:py-28 section-white">
          <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-lead text-center mb-12">Why Brands Choose Us for Paid Ads</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {whyUs.map((item, i) => (
                <motion.div key={i} className="flex gap-4 p-6 bg-card rounded-2xl border border-border"
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                  <div className="w-12 h-12 rounded-xl bg-accent/[0.08] flex items-center justify-center shrink-0">
                    <item.icon className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-lead mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="text-center mt-12">
              <Button size="lg" className="gradient-primary-accent text-primary-foreground font-semibold shadow-xl h-12 px-8" onClick={scrollToCTA}>
                Launch Your Campaign <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
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
          heading="Ready to Improve Your Ad Performance?"
          description="Share your current ad challenges and budget. We'll suggest a strategy tailored to your goals."
          buttonText="Send Inquiry"
          service="Performance Marketing"
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
        <HelpCircle className={`h-4 w-4 text-accent shrink-0 transition-transform ${open ? "rotate-45" : ""}`} />
      </button>
      <motion.div initial={false} animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }} className="overflow-hidden">
        <p className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">{a}</p>
      </motion.div>
    </motion.div>
  );
}
