import { motion } from "framer-motion";
import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, Target, Lightbulb, Users, Trophy, Globe, Rocket } from "lucide-react";
import GsapReveal from "@/components/motion/GsapReveal";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { organizationSchema, breadcrumbSchema } from "@/lib/seo/schema";

const values = [
  { icon: Target, title: "Results-Focused", desc: "We measure success by tangible outcomes — leads, conversions, and growth you can see in your business." },
  { icon: Lightbulb, title: "Always Learning", desc: "We stay curious and adopt the latest tools and strategies so your business benefits from what works today." },
  { icon: Users, title: "Client-First", desc: "We treat every project with personal attention. Direct communication, honest timelines, and full transparency." },
  { icon: Globe, title: "India-Based, Globally Minded", desc: "Based in India, we work with businesses locally and internationally with an understanding of diverse markets." },
];

const stats = [
  { value: "50+", label: "Projects Completed" },
  { value: "30+", label: "Happy Clients" },
  { value: "10+", label: "Industries Covered" },
  { value: "A Small", label: "Passionate Team" },
];

const team = [
  { role: "Strategy & Growth", count: "Strategists", desc: "Digital strategists who plan your growth roadmap" },
  { role: "Performance Marketing", count: "Specialists", desc: "PPC & paid media experts focused on your ROI" },
  { role: "Creative & Design", count: "Designers", desc: "UI/UX designers and content creators" },
  { role: "Development", count: "Engineers", desc: "Full-stack developers building quality products" },
];

export default function About() {
  const rootRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      // Animated counters on the stats section
      gsap.utils.toArray<HTMLElement>("[data-counter]").forEach((el) => {
        const raw = el.dataset.counter || "0";
        const num = parseFloat(raw.replace(/[^0-9.]/g, ""));
        if (!isFinite(num) || num === 0) return;
        const suffix = raw.replace(/[0-9.]/g, "");
        const obj = { val: 0 };
        gsap.to(obj, {
          val: num,
          duration: 1.6,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 85%" },
          onUpdate: () => {
            el.textContent = Math.round(obj.val) + suffix;
          },
        });
      });

      // Subtle parallax on hero blob
      gsap.to("[data-hero-blob]", {
        yPercent: 30,
        ease: "none",
        scrollTrigger: { trigger: rootRef.current, start: "top top", end: "bottom top", scrub: true },
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <>
      <SEOHead
        title="About Tech Handlers | Digital Marketing Agency India"
        description="Tech Handlers is a growing digital marketing and web development agency based in India. Meet our team and learn about our approach."
        canonical="https://techhandlers.in/about"
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "AboutPage",
            name: "About Tech Handlers",
            url: "https://techhandlers.in/about",
            description: "Tech Handlers is a digital marketing and web development agency based in Delhi NCR.",
            mainEntity: { "@id": "https://techhandlers.in/#organization" },
          },
          organizationSchema,
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "About", path: "/about" },
          ]),
        ]}
      />
      <Header />
      <main ref={rootRef}>
        {/* Hero */}
        <section className="relative pt-28 pb-20 lg:pt-36 lg:pb-28 bg-background overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div data-hero-blob className="absolute top-20 left-[20%] w-96 h-96 rounded-full blur-3xl" style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.05), transparent 70%)" }} />
          </div>
          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="max-w-3xl mx-auto text-center">
              <span className="inline-block text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4">About Us</span>
              <h1 className="text-4xl lg:text-6xl font-display font-bold text-foreground leading-[1.08] mb-6">
                A <span className="text-primary">Passionate Team</span> Building Your Digital Presence
              </h1>
              <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed">
                Tech Handlers is a growing digital marketing and web development agency based in India. We help businesses establish and strengthen their online presence with thoughtful strategies and quality work.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-16 bg-foreground">
          <div className="container mx-auto px-4 lg:px-8">
            <GsapReveal as="div" className="grid grid-cols-2 lg:grid-cols-4 gap-8" staggerChildren direction="up" distance={30}>
              {stats.map((s, i) => (
                <div key={i} className="text-center">
                  <p className="text-3xl lg:text-5xl font-display font-bold text-primary mb-1" data-counter={s.value}>{s.value}</p>
                  <p className="text-sm text-background/60">{s.label}</p>
                </div>
              ))}
            </GsapReveal>
          </div>
        </section>

        {/* Our Story */}
        <section className="py-20 lg:py-28 section-white">
          <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
            <GsapReveal className="text-center mb-12" direction="up">
              <h2 className="text-3xl lg:text-4xl font-display font-bold text-lead mb-6">Our Story</h2>
              <div className="text-muted-foreground leading-relaxed space-y-4 text-left lg:text-center">
                <p>Tech Handlers started with a simple idea: businesses deserve honest, effective digital services without the overpromising that plagues the industry.</p>
                <p>We're a small but dedicated team of marketers and developers based in India. We work closely with each client to understand their goals and deliver strategies that actually move the needle.</p>
                <p>We don't do cookie-cutter. Every project is approached fresh, with your specific business context in mind. We'd rather underpromise and overdeliver than the other way around.</p>
              </div>
            </GsapReveal>
          </div>
        </section>

        {/* Values */}
        <section className="py-20 lg:py-28 bg-muted/50">
          <div className="container mx-auto px-4 lg:px-8">
            <GsapReveal as="h2" className="text-3xl lg:text-4xl font-display font-bold text-lead text-center mb-12" direction="up">
              What We Stand For
            </GsapReveal>
            <GsapReveal as="div" className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6" staggerChildren direction="up" distance={40} stagger={0.12}>
              {values.map((v, i) => (
                <div key={v.title} className="bg-card border border-border rounded-2xl p-6 text-center hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                  <div className="w-14 h-14 rounded-2xl bg-primary/[0.08] flex items-center justify-center mx-auto mb-4">
                    <v.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold text-lead text-lg mb-2">{v.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </GsapReveal>
          </div>
        </section>

        {/* Team */}
        <section className="py-20 lg:py-28 section-white">
          <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
            <GsapReveal as="h2" className="text-3xl lg:text-4xl font-display font-bold text-lead text-center mb-12" direction="up">
              Our Team
            </GsapReveal>
            <GsapReveal as="div" className="grid sm:grid-cols-2 gap-6" staggerChildren direction="left" distance={40} stagger={0.1}>
              {team.map((t, i) => (
                <div key={t.role} className="bg-card border border-border rounded-2xl p-6 hover:border-primary/40 hover:shadow-md transition-all duration-300">
                  <p className="text-2xl font-display font-bold text-primary mb-1">{t.count}</p>
                  <h3 className="font-display font-semibold text-lead mb-2">{t.role}</h3>
                  <p className="text-sm text-muted-foreground">{t.desc}</p>
                </div>
              ))}
            </GsapReveal>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 lg:py-28 bg-foreground">
          <div className="container mx-auto px-4 lg:px-8 text-center max-w-2xl">
            <GsapReveal direction="zoom">
              <Rocket className="h-12 w-12 text-primary mx-auto mb-6" />
              <h2 className="text-3xl lg:text-4xl font-display font-bold text-background mb-4">Let's Work Together</h2>
              <p className="text-background/60 mb-8">Tell us about your business and we'll put together a plan that fits your goals and budget.</p>
              <Button size="lg" className="gradient-primary-accent text-primary-foreground font-semibold shadow-xl h-12 px-8"
                onClick={() => window.location.href = "/#contact"}>
                Start a Conversation <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </GsapReveal>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
