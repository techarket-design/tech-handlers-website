import { motion } from "framer-motion";
import { ArrowRight, Search, Share2, Target, Globe, Users, BarChart3, Mail, TrendingUp, CheckCircle2, HelpCircle, Lightbulb, Award, Clock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { servicePageSchemas } from "@/lib/seo/schema";
import ServiceCTA from "@/components/ServiceCTA";
import { useState } from "react";

const scrollToCTA = () => document.getElementById("service-cta")?.scrollIntoView({ behavior: "smooth" });

const services = [
  { icon: Search, title: "Search Engine Optimization (SEO)", desc: "On-page, off-page, and technical SEO strategies to improve your search rankings and drive sustainable organic traffic. We focus on keywords that bring buyers, not just browsers." },
  { icon: Share2, title: "Social Media Marketing", desc: "Strategic content creation and community management across Instagram, Facebook, LinkedIn, and Twitter. Build brand awareness and engagement that converts." },
  { icon: Target, title: "Content Marketing", desc: "High-quality blog posts, infographics, case studies, and video content that establishes thought leadership and drives inbound leads organically." },
  { icon: Mail, title: "Email Marketing & Automation", desc: "Automated drip campaigns, newsletters, and personalized email sequences. Nurture leads through the funnel with targeted messaging." },
  { icon: Users, title: "Influencer Marketing", desc: "Connect with relevant influencers in your industry. We handle outreach, negotiations, content approval, and campaign tracking for authentic brand promotion." },
  { icon: BarChart3, title: "Analytics & Reporting", desc: "Comprehensive dashboards tracking every important metric. Monthly reports with insights and actionable recommendations for continuous improvement." },
];

const results = [
  { metric: "85%", label: "Avg organic traffic improvement" },
  { metric: "30+", label: "Clients served" },
  { metric: "35%", label: "Avg engagement improvement" },
  { metric: "10+", label: "Industries covered" },
];

const industries = [
  "E-Commerce & D2C Brands", "SaaS & Technology", "Healthcare & Wellness", "Education & EdTech",
  "Real Estate", "Financial Services", "Hospitality & Travel", "Manufacturing & B2B",
  "Retail & FMCG", "Professional Services",
];

const detailedProcess = [
  { step: "Discovery & Audit", desc: "We start by understanding your business, competitors, and target audience. A detailed audit of your current digital presence identifies gaps and opportunities." },
  { step: "Strategy Development", desc: "Based on the audit, we create a comprehensive digital marketing strategy with channel recommendations, content calendars, and KPI targets." },
  { step: "Content & Creative", desc: "Our team produces high-quality content — from blog articles and social posts to email templates and ad creatives — all aligned with your brand voice." },
  { step: "Execution & Optimization", desc: "We launch campaigns across chosen channels, continuously monitoring performance and making data-driven adjustments to improve results." },
  { step: "Reporting & Insights", desc: "Monthly performance reports with clear metrics, insights, and recommendations. We walk you through the data so you understand exactly what's working." },
  { step: "Scale & Iterate", desc: "Once we find what works, we double down. We scale successful campaigns and test new approaches to keep your growth trajectory moving upward." },
];

const whyUs = [
  { icon: TrendingUp, title: "ROI-Focused Approach", desc: "We track revenue and leads, not just impressions. Every strategy is designed to move your bottom line." },
  { icon: Shield, title: "Transparent Reporting", desc: "Real-time dashboards and monthly reports. No hidden metrics — you see exactly what we see." },
  { icon: Clock, title: "Dedicated Account Manager", desc: "A single point of contact who understands your business and is always available." },
  { icon: Award, title: "No Lock-In Contracts", desc: "We earn your business every month. No long-term contracts or hidden cancellation fees." },
];

const faqs = [
  { q: "How long does it take to see results from digital marketing?", a: "It depends on the channel. SEO typically takes 3-6 months for meaningful results, while social media and email marketing can show engagement improvements within weeks. We set realistic timelines during our strategy phase." },
  { q: "What's the minimum budget to get started?", a: "We work with businesses of various sizes. Our digital marketing packages start from ₹25,000/month, but we recommend discussing your goals first so we can suggest the right investment level." },
  { q: "Do you work with businesses outside India?", a: "Yes! While we're based in India, we work with clients globally. Our strategies are tailored to your target market, whether that's local, national, or international." },
  { q: "How do you measure success?", a: "We define KPIs during the strategy phase — these could include organic traffic growth, lead generation, engagement rates, email open rates, or revenue attribution. Monthly reports track progress against these goals." },
  { q: "Can I choose specific services instead of a full package?", a: "Absolutely. We offer modular services so you can start with what matters most — whether that's SEO only, social media management, or email marketing. We can always expand as you grow." },
];

export default function DigitalMarketing() {
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
        title="Digital Marketing Services | Tech Handlers"
        description="Comprehensive digital marketing services including SEO, social media, content marketing, email automation, and more. Data-driven strategies to grow your business online."
        canonical="https://www.techhandlers.in/services/digital-marketing"
        jsonLd={servicePageSchemas({ name: "Digital Marketing Services", description: "Comprehensive digital marketing services including SEO, social media, content marketing, email automation, and more. Data-driven strategies to grow your business online.", path: "/services/digital-marketing" }, [faqJsonLd])}
      />
      <Header />
      <main>
        {/* Hero */}
        <section className="relative pt-28 pb-20 lg:pt-36 lg:pb-28 bg-background overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-20 right-[10%] w-80 h-80 rounded-full blur-3xl" style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.06), transparent 70%)" }} />
            <div className="absolute bottom-10 left-[5%] w-96 h-96 rounded-full blur-3xl" style={{ background: "radial-gradient(circle, hsl(var(--accent) / 0.04), transparent 70%)" }} />
          </div>
          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <motion.div initial={false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="max-w-3xl">
              <span className="inline-block text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4">Digital Marketing</span>
              <h1 className="text-4xl lg:text-6xl font-display font-bold text-foreground leading-[1.08] mb-6">
                Grow Your Brand with <span className="text-primary">Data-Driven</span> Digital Marketing
              </h1>
              <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed mb-8">
                From SEO to social media, we craft comprehensive digital marketing strategies that drive real business results. No vanity metrics — just measurable growth for your business.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="gradient-primary-accent text-primary-foreground font-semibold shadow-xl h-12 px-8" onClick={scrollToCTA}>
                  Discuss Your Goals <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" className="h-12 px-8" onClick={scrollToCTA}>
                  View Our Approach
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Services Grid */}
        <section className="py-20 lg:py-28 section-white">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div initial={false} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-display font-bold text-lead mb-4">Our Digital Marketing Services</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">End-to-end digital marketing solutions tailored for businesses that want measurable, sustainable growth.</p>
            </motion.div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((s, i) => (
                <motion.div key={s.title} className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow"
                  initial={false} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
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
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-background text-center mb-12">Results That Speak</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {results.map((r, i) => (
                <motion.div key={i} className="text-center" initial={false} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                  <p className="text-4xl lg:text-5xl font-display font-bold text-primary mb-2">{r.metric}</p>
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
              <h2 className="text-3xl lg:text-4xl font-display font-bold text-lead mb-4">Our Proven 6-Step Process</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">A structured approach to digital marketing that delivers consistent, measurable results.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {detailedProcess.map((p, i) => (
                <motion.div key={i} className="flex gap-4 p-6 bg-card rounded-2xl border border-border"
                  initial={false} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
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

        {/* Why Choose Us */}
        <section className="py-20 lg:py-28 bg-muted/50">
          <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-lead text-center mb-12">Why Choose Tech Handlers?</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {whyUs.map((item, i) => (
                <motion.div key={i} className="flex gap-4 p-6 bg-card rounded-2xl border border-border"
                  initial={false} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                  <div className="w-12 h-12 rounded-xl bg-primary/[0.08] flex items-center justify-center shrink-0">
                    <item.icon className="h-5 w-5 text-primary" />
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
                Discuss Your Goals <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* Industries */}
        <section className="py-20 lg:py-28 section-white">
          <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-lead text-center mb-4">Industries We Serve</h2>
            <p className="text-muted-foreground text-center max-w-xl mx-auto mb-12">We've helped businesses across diverse industries grow their digital presence.</p>
            <div className="flex flex-wrap justify-center gap-3">
              {industries.map((ind, i) => (
                <motion.span key={ind} className="px-5 py-2.5 bg-card border border-border rounded-full text-sm font-medium text-muted-foreground"
                  initial={false} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}>
                  {ind}
                </motion.span>
              ))}
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
          heading="Let's Grow Your Digital Presence"
          description="Tell us about your business and goals. We'll get back with a tailored approach that fits your budget."
          buttonText="Send Inquiry"
          service="Digital Marketing"
        />
      </main>
      <Footer />
    </>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div className="bg-card border border-border rounded-xl overflow-hidden" initial={false} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
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
