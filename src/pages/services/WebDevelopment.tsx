import { motion } from "framer-motion";
import { ArrowRight, Code2, Smartphone, ShoppingCart, Gauge, Shield, Palette, CheckCircle2, HelpCircle, TrendingUp, Clock, Award, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { servicePageSchemas } from "@/lib/seo/schema";
import ServiceCTA from "@/components/ServiceCTA";
import { useState } from "react";

const scrollToCTA = () => document.getElementById("service-cta")?.scrollIntoView({ behavior: "smooth" });

const services = [
  { icon: Code2, title: "Custom Web Development", desc: "Bespoke websites and web applications built from scratch using modern frameworks. Fast, scalable, and tailored to your exact business requirements." },
  { icon: ShoppingCart, title: "E-Commerce Development", desc: "Shopify, WooCommerce, or fully custom e-commerce solutions. We build stores that are optimized for conversions, with seamless checkout and payment integration." },
  { icon: Smartphone, title: "Responsive & Mobile-First Design", desc: "Every website we build works flawlessly on all devices — desktops, tablets, and phones. Mobile-first approach ensures optimal user experience everywhere." },
  { icon: Gauge, title: "Performance Optimization", desc: "Lightning-fast load times with Core Web Vitals optimization. Image compression, code splitting, caching strategies, and CDN setup for peak speed." },
  { icon: Palette, title: "UI/UX Design", desc: "User-centered design that looks beautiful and converts. Wireframing, prototyping, user testing, and pixel-perfect implementation." },
  { icon: Shield, title: "Maintenance & Support", desc: "Ongoing technical support, security updates, performance monitoring, and feature enhancements. We keep your website running smoothly." },
];

const techStack = [
  "React", "Next.js", "TypeScript", "Node.js", "Tailwind CSS", "WordPress",
  "Shopify", "WooCommerce", "PostgreSQL", "MongoDB", "AWS", "Vercel",
  "Figma", "Webflow", "Strapi CMS", "Supabase",
];

const results = [
  { metric: "50+", label: "Websites delivered" },
  { metric: "99%", label: "Uptime track record" },
  { metric: "<3s", label: "Average load time" },
  { metric: "90+", label: "PageSpeed scores" },
];

const projectTypes = [
  { title: "Corporate Websites", desc: "Professional business websites that establish credibility and generate leads. Clean design, fast loading, and SEO-ready." },
  { title: "E-Commerce Stores", desc: "Online stores with product management, inventory, payments, shipping integrations, and conversion-optimized checkout flows." },
  { title: "Landing Pages", desc: "High-converting landing pages for campaigns, product launches, and lead generation. A/B testing ready with analytics integration." },
  { title: "Web Applications", desc: "Custom web apps with user authentication, dashboards, APIs, and complex business logic. Built for scale and maintainability." },
  { title: "CMS & Blog Platforms", desc: "Content management systems that make it easy for your team to publish, edit, and manage content without technical knowledge." },
  { title: "Portfolio & Personal Sites", desc: "Showcase your work with beautiful portfolio websites. Perfect for freelancers, agencies, photographers, and creatives." },
];

const detailedProcess = [
  { step: "Discovery & Requirements", desc: "We understand your business goals, target audience, and technical requirements through detailed discussions and questionnaires." },
  { step: "Wireframing & Design", desc: "Interactive wireframes and high-fidelity UI designs in Figma. You approve every screen before we write a single line of code." },
  { step: "Development & Integration", desc: "Clean, modular code using modern frameworks. APIs, payment gateways, CRMs, and third-party tools integrated seamlessly." },
  { step: "Testing & QA", desc: "Rigorous testing across devices, browsers, and screen sizes. Performance audits, security checks, and accessibility compliance." },
  { step: "Launch & Optimization", desc: "Smooth deployment with zero downtime. DNS setup, SSL certificates, analytics installation, and SEO configuration included." },
  { step: "Post-Launch Support", desc: "30 days of complimentary support after launch. Bug fixes, minor adjustments, and guidance to help you manage your new site." },
];

const faqs = [
  { q: "How long does it take to build a website?", a: "Simple landing pages take 1-2 weeks. Business websites typically take 3-6 weeks. Complex web applications or e-commerce stores can take 6-12 weeks depending on features and scope." },
  { q: "What's your pricing structure?", a: "We provide custom quotes based on your requirements. Landing pages start from ₹25,000, business websites from ₹75,000, and e-commerce stores from ₹1,50,000. We'll provide a detailed quote after understanding your needs." },
  { q: "Do you provide hosting and maintenance?", a: "Yes. We recommend and set up optimal hosting (Vercel, AWS, or shared hosting depending on needs). We also offer monthly maintenance plans starting from ₹5,000/month." },
  { q: "Will I be able to update the website content myself?", a: "Absolutely. We either build with a CMS (WordPress, Strapi, etc.) or provide a custom admin panel so you can update content, images, and pages without any technical knowledge." },
  { q: "Do you handle domain and email setup?", a: "Yes, we can help with domain registration, DNS configuration, SSL certificates, and business email setup as part of the project." },
  { q: "What if I need changes after the website is live?", a: "We include 30 days of post-launch support for bug fixes and minor adjustments. For ongoing changes, we offer flexible maintenance plans or can handle requests on an hourly basis." },
];

export default function WebDevelopment() {
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
        title="Web Development Services | Tech Handlers"
        description="Custom web development services — responsive websites, e-commerce stores, web applications, and more. Built with modern tech for maximum performance and conversions."
        canonical="https://techhandlers.in/services/web-development"
        jsonLd={servicePageSchemas({ name: "Web Development Services", description: "Custom web development services — responsive websites, e-commerce stores, web applications, and more. Built with modern tech for maximum performance and conversions.", path: "/services/web-development" }, [faqJsonLd])}
      />
      <Header />
      <main>
        {/* Hero */}
        <section className="relative pt-28 pb-20 lg:pt-36 lg:pb-28 bg-background overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-20 left-[10%] w-80 h-80 rounded-full blur-3xl" style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.06), transparent 70%)" }} />
          </div>
          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="max-w-3xl">
              <span className="inline-block text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4">Web Development</span>
              <h1 className="text-4xl lg:text-6xl font-display font-bold text-foreground leading-[1.08] mb-6">
                Websites That <span className="text-primary">Convert</span>, Not Just Look Pretty
              </h1>
              <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed mb-8">
                We build high-performance websites and web applications that drive business results. Modern tech stack, pixel-perfect design, and conversion-focused development.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="gradient-primary-accent text-primary-foreground font-semibold shadow-xl h-12 px-8" onClick={scrollToCTA}>
                  Discuss Your Project <ArrowRight className="ml-2 h-4 w-4" />
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
              <h2 className="text-3xl lg:text-4xl font-display font-bold text-lead mb-4">Web Development Services</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">From simple landing pages to complex web applications — we build it all with precision and care.</p>
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

        {/* Project Types */}
        <section className="py-20 lg:py-28 bg-muted/50">
          <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-display font-bold text-lead mb-4">What We Build</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">Every project is unique. Here are the types of web solutions we deliver.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {projectTypes.map((p, i) => (
                <motion.div key={i} className="p-6 bg-card rounded-2xl border border-border"
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
                  <h3 className="font-display font-semibold text-lead mb-2">{p.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Tech Stack */}
        <section className="py-16 section-white">
          <div className="container mx-auto px-4 lg:px-8">
            <h2 className="text-2xl font-display font-bold text-lead text-center mb-8">Our Tech Stack</h2>
            <div className="flex flex-wrap justify-center gap-3">
              {techStack.map((tech, i) => (
                <motion.span key={tech} className="px-4 py-2 bg-card border border-border rounded-full text-sm font-medium text-muted-foreground"
                  initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}>
                  {tech}
                </motion.span>
              ))}
            </div>
          </div>
        </section>

        {/* Results */}
        <section className="py-20 lg:py-28 bg-foreground">
          <div className="container mx-auto px-4 lg:px-8">
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-background text-center mb-12">Built for Performance</h2>
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
              <h2 className="text-3xl lg:text-4xl font-display font-bold text-lead mb-4">Our Development Process</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">A transparent, collaborative process that keeps you involved at every stage.</p>
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
                Start Your Web Project <ArrowRight className="ml-2 h-4 w-4" />
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
          heading="Let's Build Something Great"
          description="Share your project requirements and we'll get back with a detailed proposal and timeline."
          buttonText="Send Your Requirements"
          service="Web Development"
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
