import { motion } from "framer-motion";
import { ArrowRight, Instagram, Facebook, Linkedin, Youtube, Camera, Calendar, BarChart3, MessageSquare, Heart, HelpCircle, TrendingUp, Shield, Users, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { servicePageSchemas } from "@/lib/seo/schema";
import ServiceCTA from "@/components/ServiceCTA";
import { useState } from "react";

const scrollToCTA = () => document.getElementById("service-cta")?.scrollIntoView({ behavior: "smooth" });

const services = [
  { icon: Instagram, title: "Instagram Marketing", desc: "Content creation, reels, stories, carousel posts, and engagement strategies. We grow your Instagram presence with scroll-stopping visuals and strategic hashtag use." },
  { icon: Facebook, title: "Facebook Marketing", desc: "Page management, content scheduling, community building, and Facebook Groups strategy. We help you reach and engage your audience on the world's largest social platform." },
  { icon: Linkedin, title: "LinkedIn Marketing", desc: "Professional content, thought leadership posts, company page management, and employee advocacy programs. Perfect for B2B brands and professional services." },
  { icon: Youtube, title: "YouTube Marketing", desc: "Video strategy, SEO optimization, thumbnail design, and channel management. Build a YouTube presence that attracts subscribers and drives business." },
  { icon: Camera, title: "Content Creation & Design", desc: "Professional graphics, video editing, carousel designs, motion graphics, and copywriting. Consistent, on-brand content across all platforms." },
  { icon: BarChart3, title: "Analytics & Reporting", desc: "Platform-wise performance tracking, audience insights, competitor benchmarking, and monthly reports with strategic recommendations." },
];

const results = [
  { metric: "35%", label: "Avg engagement rate improvement" },
  { metric: "25+", label: "Brands managed" },
  { metric: "500+", label: "Content pieces created monthly" },
  { metric: "10+", label: "Industries served" },
];

const platforms = [
  { name: "Instagram", desc: "Visual storytelling, reels, stories, and shoppable posts for consumer brands." },
  { name: "Facebook", desc: "Community building, events, groups, and broad audience targeting." },
  { name: "LinkedIn", desc: "B2B content, thought leadership, and professional networking." },
  { name: "YouTube", desc: "Long-form content, tutorials, brand stories, and video SEO." },
  { name: "Twitter / X", desc: "Real-time engagement, brand voice, and industry conversations." },
  { name: "Pinterest", desc: "Visual discovery, product pins, and inspiration-driven traffic." },
];

const detailedProcess = [
  { step: "Brand & Audience Analysis", desc: "We study your brand identity, competitors, and target audience. Understanding who you're talking to shapes everything we create." },
  { step: "Strategy & Content Calendar", desc: "Monthly content calendar with themes, posting schedules, platform-specific strategies, and campaign plans aligned with your business goals." },
  { step: "Content Creation", desc: "Our creative team produces graphics, videos, captions, and stories. Every piece is on-brand, platform-optimized, and designed to engage." },
  { step: "Publishing & Community Management", desc: "Scheduled posting at optimal times plus active community management — responding to comments, DMs, and mentions to build relationships." },
  { step: "Paid Amplification", desc: "Strategic boosting of top-performing organic content and targeted social ads to expand reach and drive specific business objectives." },
  { step: "Reporting & Optimization", desc: "Monthly performance reviews with engagement metrics, audience growth, top content analysis, and strategic pivots based on data." },
];

const faqs = [
  { q: "How often should we post on social media?", a: "It depends on the platform. We typically recommend 4-5 Instagram posts/week, 3-4 Facebook posts/week, 3-4 LinkedIn posts/week, and 1-2 YouTube videos/month. Consistency matters more than frequency." },
  { q: "Do you create all the content?", a: "Yes, our team handles content strategy, copywriting, graphic design, and video editing. We may occasionally request raw photos or videos from your end for authenticity." },
  { q: "How much does social media management cost?", a: "Our packages start from ₹15,000/month for a single platform and go up to ₹60,000+/month for multi-platform management with content creation, community management, and paid amplification." },
  { q: "Can you manage our existing social media accounts?", a: "Absolutely. We'll audit your existing accounts, optimize profiles, and start implementing our strategy. No need to create new accounts." },
  { q: "How do you measure social media ROI?", a: "We track engagement rates, follower growth, reach, website traffic from social, lead generation, and conversions. Monthly reports show exactly how social media contributes to your business goals." },
  { q: "Do you handle negative comments and crisis management?", a: "Yes. Our community management includes handling negative feedback professionally and escalating issues according to a pre-agreed protocol. We can also create a crisis communication plan." },
];

export default function SocialMediaMarketing() {
  return (
    <>
      <SEOHead
        title="Social Media Marketing Services | Tech Handlers"
        description="Professional social media marketing — Instagram, Facebook, LinkedIn, YouTube. Content creation, community management, and analytics. Build your brand online."
        canonical="https://www.techhandlers.in/services/social-media-marketing"
        jsonLd={servicePageSchemas({ name: "Social Media Marketing Services", description: "Professional social media marketing — Instagram, Facebook, LinkedIn, YouTube. Content creation, community management, and analytics. Build your brand online.", path: "/services/social-media-marketing" }, [])}
      />
      <Header />
      <main>
        {/* Hero */}
        <section className="relative pt-28 pb-20 lg:pt-36 lg:pb-28 bg-background overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-20 right-[10%] w-80 h-80 rounded-full blur-3xl" style={{ background: "radial-gradient(circle, hsl(var(--accent) / 0.06), transparent 70%)" }} />
          </div>
          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <motion.div initial={false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="max-w-3xl">
              <span className="inline-block text-xs font-bold text-accent uppercase tracking-[0.2em] mb-4">Social Media Marketing</span>
              <h1 className="text-4xl lg:text-6xl font-display font-bold text-foreground leading-[1.08] mb-6">
                Build a Social Presence That <span className="text-accent">Actually Converts</span>
              </h1>
              <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed mb-8">
                Beyond likes and follows — we build social media strategies that drive real engagement, brand awareness, and business results across every platform that matters.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="gradient-primary-accent text-primary-foreground font-semibold shadow-xl h-12 px-8" onClick={scrollToCTA}>
                  Discuss Your Brand <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" className="h-12 px-8" onClick={scrollToCTA}>
                  See Our Process
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Services */}
        <section className="py-20 lg:py-28 section-white">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-display font-bold text-lead mb-4">Social Media Services</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">End-to-end social media management — from strategy and content creation to community management and analytics.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((s, i) => (
                <motion.div key={s.title} className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow"
                  initial={false} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
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
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-background text-center mb-12">Social Media Impact</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {results.map((r, i) => (
                <motion.div key={i} className="text-center" initial={false} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                  <p className="text-4xl lg:text-5xl font-display font-bold text-accent mb-2">{r.metric}</p>
                  <p className="text-sm text-background/60">{r.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Platforms We Work With */}
        <section className="py-20 lg:py-28 section-white">
          <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-display font-bold text-lead mb-4">Platforms We Manage</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">We craft platform-specific strategies because what works on Instagram doesn't always work on LinkedIn.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {platforms.map((p, i) => (
                <motion.div key={i} className="p-6 bg-card rounded-2xl border border-border"
                  initial={false} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
                  <h3 className="font-display font-semibold text-lead mb-2">{p.name}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Process */}
        <section className="py-20 lg:py-28 bg-muted/50">
          <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-display font-bold text-lead mb-4">How We Manage Your Social Media</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">A systematic approach that delivers consistent growth and engagement.</p>
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
            <div className="text-center mt-12">
              <Button size="lg" className="gradient-primary-accent text-primary-foreground font-semibold shadow-xl h-12 px-8" onClick={scrollToCTA}>
                Start Your Social Strategy <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="py-20 lg:py-28 section-white">
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
          heading="Let's Build Your Social Media Presence"
          description="Tell us about your brand and target audience. We'll suggest a social media strategy that fits your goals and budget."
          buttonText="Send Inquiry"
          service="Social Media Marketing"
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
        <HelpCircle className={`h-4 w-4 text-accent shrink-0 transition-transform ${open ? "rotate-45" : ""}`} />
      </button>
      <motion.div initial={false} animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }} className="overflow-hidden">
        <p className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">{a}</p>
      </motion.div>
    </motion.div>
  );
}
