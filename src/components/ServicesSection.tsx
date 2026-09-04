import { motion } from "framer-motion";
import {
  Search, BarChart3, Share2, PenTool, Target, Globe, ArrowUpRight,
  Settings, TrendingUp, Zap, Users, Shield, Star, Rocket, Award,
  Headphones, Clock, MessageSquare, Code, Layout, Monitor, Smartphone,
} from "lucide-react";
import { Link } from "react-router-dom";
import { AnimatedHeading } from "./motion/AnimationUtils";
import { useServices, useSiteSettings } from "@/hooks/useData";
import { useIsMobile } from "@/hooks/use-mobile";

const iconMap: Record<string, any> = {
  Search, BarChart3, Share2, PenTool, Target, Globe, Settings, TrendingUp,
  Zap, Users, Shield, Star, Rocket, Award, Headphones, Clock, MessageSquare,
  Code, Layout, Monitor, Smartphone, ArrowUpRight,
};

const fallbackServices = [
  { icon_name: "Search", name: "SEO & Content Marketing", short_description: "Dominate Google rankings with technical SEO, content strategy, and local search optimization that drives organic traffic.", slug: "digital-marketing" },
  { icon_name: "BarChart3", name: "Performance Marketing", short_description: "Data-driven Google Ads, Meta Ads, and LinkedIn campaigns engineered for maximum ROAS and qualified lead generation.", slug: "performance-marketing" },
  { icon_name: "Share2", name: "Social Media Marketing", short_description: "Strategic social presence across Instagram, LinkedIn, and YouTube that builds brand equity and drives conversions.", slug: "digital-marketing" },
  { icon_name: "PenTool", name: "LinkedIn Automation", short_description: "Automated LinkedIn outreach, profile optimization, and lead generation to connect with decision-makers at scale.", slug: "linkedin-automation" },
  { icon_name: "Target", name: "Lead Generation", short_description: "Full-funnel lead generation systems with landing pages, nurture sequences, and CRM integration for predictable revenue.", slug: "performance-marketing" },
  { icon_name: "Globe", name: "Web Development", short_description: "High-converting, lightning-fast websites and web apps built with modern tech stacks, optimized for performance and conversions.", slug: "web-development" },
];

const gradients = [
  "from-blue-500/10 to-indigo-500/10", "from-purple-500/10 to-fuchsia-500/10",
  "from-pink-500/10 to-rose-500/10", "from-amber-500/10 to-orange-500/10",
  "from-emerald-500/10 to-teal-500/10", "from-cyan-500/10 to-blue-500/10",
];

const offsets = [0, 40, 16, 48, 8, 56];

export default function ServicesSection() {
  const { data: dbServices } = useServices();
  const { data: settings } = useSiteSettings();
  const isMobile = useIsMobile();

  const services = dbServices?.length ? dbServices : fallbackServices;
  const heading = (settings as any)?.services_heading || "Services Built for Revenue, Not Vanity";
  const subheading = (settings as any)?.services_subheading || "Every service is engineered to move your bottom line.";

  return (
    <section id="services" className="section-stone py-20 lg:py-28 relative overflow-hidden">
      {/* Background decorations — desktop only */}
      {!isMobile && (
        <div className="absolute inset-0 pointer-events-none">
          <svg className="absolute inset-0 w-full h-full opacity-[0.015]">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.line key={`v-${i}`} x1={`${i * 5}%`} y1="0" x2={`${i * 5}%`} y2="100%"
                stroke="currentColor" strokeWidth="1" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
                viewport={{ once: true }} transition={{ delay: i * 0.02 }} />
            ))}
          </svg>
          <motion.div className="absolute top-20 right-[10%] w-80 h-80 rounded-full bg-primary/[0.04] blur-3xl"
            animate={{ scale: [1, 1.15, 1], opacity: [0.04, 0.06, 0.04] }}
            transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }} />
        </div>
      )}

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="text-center mb-16 lg:mb-20">
          <motion.span className="inline-block text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4"
            initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            What We Do
          </motion.span>
          <AnimatedHeading as="h2" text={heading} className="text-3xl lg:text-5xl font-display font-bold text-lead mb-4" />
          <motion.p className="text-muted-foreground max-w-lg mx-auto"
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.4 }}>
            {subheading}
          </motion.p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-7">
          {services.map((s: any, i: number) => {
            const IconComp = iconMap[s.icon_name || "Settings"] || Settings;
            const gradient = gradients[i % gradients.length];
            return (
              <motion.div key={s.id || i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                style={{ marginTop: !isMobile && typeof window !== 'undefined' && window.innerWidth >= 1024 ? `${offsets[i % offsets.length]}px` : 0 }}
                className="group">
                <Link to={s.slug ? `/services/${s.slug}` : "#"}>
                <motion.div className="bg-surface-white rounded-2xl p-6 lg:p-8 border border-border/70 h-full flex flex-col relative overflow-hidden"
                  whileHover={!isMobile ? { y: -6, boxShadow: "0 25px 80px -15px hsl(239 84% 67% / 0.12)" } : undefined}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
                  <div className="relative mb-5">
                    <motion.div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/[0.07] text-primary relative overflow-hidden"
                      whileHover={!isMobile ? { scale: 1.1, rotate: 5 } : undefined} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
                      <IconComp className="h-5 w-5 relative z-10" />
                    </motion.div>
                  </div>
                  <h3 className="font-display text-lg font-bold text-lead mb-2 relative">{s.name}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1 relative">{s.short_description}</p>
                  <div className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-primary relative overflow-hidden">
                    <motion.span className="flex items-center gap-1.5 translate-y-8 group-hover:translate-y-0 transition-transform duration-300">
                      Explore {s.name} <ArrowUpRight className="h-3.5 w-3.5" />
                    </motion.span>
                  </div>
                </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
