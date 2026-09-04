import { motion } from "framer-motion";
import { ArrowRight, Users, MessageSquare, UserCheck, Bot, BarChart3, Zap, CheckCircle2, HelpCircle, TrendingUp, Shield, Clock, Award, Linkedin, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { servicePageSchemas } from "@/lib/seo/schema";
import ServiceCTA from "@/components/ServiceCTA";
import { useState } from "react";

const scrollToCTA = () => document.getElementById("service-cta")?.scrollIntoView({ behavior: "smooth" });

const services = [
  { icon: Bot, title: "LinkedIn Outreach Automation", desc: "Automated connection requests and follow-up sequences that feel personal. We target decision-makers in your niche with hyper-personalized messaging at scale." },
  { icon: Users, title: "Lead Generation Campaigns", desc: "Generate high-quality B2B leads on autopilot. Our proven sequences convert cold connections into warm conversations and booked meetings." },
  { icon: UserCheck, title: "Profile Optimization", desc: "Transform your LinkedIn profile into a lead magnet. We optimize your headline, summary, experience, featured section, and recommendations to attract ideal clients." },
  { icon: MessageSquare, title: "Content Strategy & Ghostwriting", desc: "Build thought leadership with engaging LinkedIn posts, articles, carousels, and polls. We handle ideation, writing, design, and scheduling." },
  { icon: BarChart3, title: "Analytics & Campaign Reporting", desc: "Track connection acceptance rates, response rates, profile views, and meetings booked. Data-driven optimization for continuous improvement." },
  { icon: Zap, title: "Sales Navigator Management", desc: "Expert management of LinkedIn Sales Navigator — advanced search filters, lead lists, account mapping, and InMail campaigns for maximum outreach ROI." },
];

const results = [
  { metric: "30%+", label: "Avg connection acceptance rate" },
  { metric: "50+", label: "Meetings booked for clients" },
  { metric: "2x", label: "Avg pipeline growth" },
  { metric: "80%", label: "Leads are decision-makers" },
];

const useCases = [
  { title: "Founders & CEOs", desc: "Build your personal brand and generate inbound leads. Position yourself as a thought leader in your industry through consistent, strategic content." },
  { title: "B2B Sales Teams", desc: "Fill your pipeline with qualified prospects. Automated outreach combined with warm introductions accelerates your sales cycle." },
  { title: "Agencies & Consultants", desc: "Attract high-value clients without cold calling. Showcase expertise, share case studies, and let LinkedIn do the prospecting for you." },
  { title: "SaaS Companies", desc: "Connect with potential users, partners, and investors. Product-led LinkedIn strategies that drive trial signups and demos." },
  { title: "Recruiters & HR", desc: "Source top talent and build employer brand presence. Reach passive candidates with personalized outreach campaigns." },
  { title: "Real Estate & Financial Services", desc: "Generate leads from high-net-worth individuals and business owners. Trust-building content combined with targeted outreach." },
];

const detailedProcess = [
  { step: "Define Your ICP", desc: "We work with you to define your Ideal Customer Profile — industry, company size, job titles, geography, and pain points that align with your offering." },
  { step: "Build Targeted Lead Lists", desc: "Using Sales Navigator and advanced filters, we build highly targeted lists of prospects who match your ICP. Quality over quantity." },
  { step: "Craft Personalized Sequences", desc: "Multi-step messaging sequences that feel genuine, not spammy. Connection requests, follow-ups, and value-add messages tailored to each prospect segment." },
  { step: "Launch Outreach Campaigns", desc: "Campaigns go live with smart daily limits, random delays, and safety protocols that keep your account in good standing with LinkedIn." },
  { step: "Nurture & Engage", desc: "Warm leads are nurtured with follow-up messages, content engagement, and value-driven conversations. We handle the entire process until they're ready to talk." },
  { step: "Book Meetings & Handoff", desc: "Qualified leads are scheduled directly into your calendar. You focus on closing — we handle everything upstream." },
];

const faqs = [
  { q: "Is LinkedIn automation safe for my account?", a: "Yes, when done correctly. We use industry-standard tools with smart daily limits, random delays, and human-like behavior patterns. We never exceed LinkedIn's guidelines to keep your account safe." },
  { q: "How many connections/messages can you send per day?", a: "We typically stay within 20-30 connection requests and 50-80 messages per day, depending on your account age and activity history. This keeps your account safe while maintaining good outreach volume." },
  { q: "How long before I start getting responses?", a: "Most clients start seeing responses within the first week of campaign launch. It takes about 2-3 weeks to optimize messaging for best results. Expect a steady flow of conversations after the first month." },
  { q: "Do you write the messages or do I?", a: "We write all outreach messages based on your input about your value proposition, target audience, and communication style. You approve the sequences before they go live." },
  { q: "What tools do you use for automation?", a: "We use a combination of LinkedIn-approved tools and Sales Navigator. We'll recommend the best tool stack based on your specific needs and budget." },
  { q: "Can you also manage my LinkedIn content?", a: "Yes! Our content strategy and ghostwriting service is designed to complement outreach. Regular posting increases profile views and warms up prospects before they receive your outreach messages." },
];

export default function LinkedInAutomation() {
  return (
    <>
      <SEOHead
        title="LinkedIn Automation & Lead Generation | Tech Handlers"
        description="B2B LinkedIn automation services — outreach, lead generation, profile optimization, content strategy, and Sales Navigator management. Book more meetings on autopilot."
        canonical="https://techhandlers.in/services/linkedin-automation"
        jsonLd={servicePageSchemas({ name: "LinkedIn Automation & Lead Generation", description: "B2B LinkedIn automation services — outreach, lead generation, profile optimization, content strategy, and Sales Navigator management. Book more meetings on autopilot.", path: "/services/linkedin-automation" }, [])}
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
              <span className="inline-block text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4">LinkedIn Automation</span>
              <h1 className="text-4xl lg:text-6xl font-display font-bold text-foreground leading-[1.08] mb-6">
                Turn LinkedIn into Your #1 <span className="text-primary">B2B Sales</span> Channel
              </h1>
              <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed mb-8">
                Stop cold calling. Our LinkedIn automation strategies connect you with decision-makers, nurture relationships, and book qualified meetings — all on autopilot.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="gradient-primary-accent text-primary-foreground font-semibold shadow-xl h-12 px-8" onClick={scrollToCTA}>
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" className="h-12 px-8" onClick={scrollToCTA}>
                  See How It Works
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Services */}
        <section className="py-20 lg:py-28 section-white">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-display font-bold text-lead mb-4">LinkedIn Growth Services</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">Everything you need to dominate LinkedIn and fill your sales pipeline with qualified leads.</p>
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
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-background text-center mb-12">LinkedIn Results</h2>
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

        {/* Use Cases */}
        <section className="py-20 lg:py-28 section-white">
          <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-display font-bold text-lead mb-4">Who Is This For?</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">Our LinkedIn automation services work best for these roles and industries.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {useCases.map((uc, i) => (
                <motion.div key={i} className="p-6 bg-card rounded-2xl border border-border"
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
                  <h3 className="font-display font-semibold text-lead mb-2">{uc.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{uc.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Process */}
        <section className="py-20 lg:py-28 bg-muted/50">
          <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-display font-bold text-lead mb-4">How Our LinkedIn Automation Works</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">A proven, step-by-step process from strategy to booked meetings.</p>
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
            <div className="text-center mt-12">
              <Button size="lg" className="gradient-primary-accent text-primary-foreground font-semibold shadow-xl h-12 px-8" onClick={scrollToCTA}>
                Start LinkedIn Outreach <ArrowRight className="ml-2 h-4 w-4" />
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
          heading="Ready to Grow on LinkedIn?"
          description="Tell us about your target audience and goals. We'll suggest a LinkedIn strategy that fits your business."
          buttonText="Send Inquiry"
          service="LinkedIn Automation"
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
