import { motion } from "framer-motion";
import { AnimatedHeading } from "./motion/AnimationUtils";
import {
  MessageSquare, Scan, Rocket, BarChart, CheckCircle,
  Search, Target, BarChart3, Zap, Users, Shield, Star,
  Award, Headphones, Clock, Code, Globe, TrendingUp,
  PenTool, Share2, Settings, Layout, Monitor, Smartphone,
} from "lucide-react";
import { useProcessSteps, useSiteSettings } from "@/hooks/useData";
import { useIsMobile } from "@/hooks/use-mobile";

const iconMap: Record<string, any> = {
  Scan, MessageSquare, Rocket, BarChart, CheckCircle, Search, Target,
  BarChart3, Zap, Users, Shield, Star, Award, Headphones, Clock, Code,
  Globe, TrendingUp, PenTool, Share2, Settings, Layout, Monitor, Smartphone,
};

const fallbackSteps = [
  { icon_name: "Scan", step_number: "01", title: "Deep Audit", description: "We dissect your digital presence, competitors, and market gaps with proprietary tools.", detail: "7-day turnaround", color: "#6366f1" },
  { icon_name: "MessageSquare", step_number: "02", title: "Strategy Blueprint", description: "Custom growth roadmap with channel allocation, budget recommendations, and quarterly milestones.", detail: "Data-backed plan", color: "#8b5cf6" },
  { icon_name: "Rocket", step_number: "03", title: "Launch & Optimize", description: "Rapid campaign deployment with daily monitoring, A/B testing, and weekly performance calls.", detail: "24/7 monitoring", color: "#a855f7" },
  { icon_name: "BarChart", step_number: "04", title: "Scale & Dominate", description: "Double down on winning channels, expand to new markets, and compound your revenue growth.", detail: "Exponential growth", color: "#c084fc" },
];

function ConnectingBeam() {
  return (
    <div className="hidden lg:block absolute top-1/2 left-0 right-0 -translate-y-1/2 z-0 h-px">
      <motion.div className="h-full bg-gradient-to-r from-primary/0 via-primary/30 to-accent/0"
        initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }}
        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }} style={{ transformOrigin: "left" }} />
      <motion.div className="absolute top-0 w-20 h-px bg-gradient-to-r from-transparent via-primary to-transparent"
        animate={{ x: ["-5rem", "calc(100% + 5rem)"] }}
        transition={{ repeat: Infinity, duration: 4, ease: "linear", delay: 1.5 }} />
    </div>
  );
}

export default function ProcessSection() {
  const { data: dbSteps } = useProcessSteps();
  const { data: settings } = useSiteSettings();
  const isMobile = useIsMobile();

  const steps = (dbSteps as any[])?.length ? dbSteps as any[] : fallbackSteps;
  const heading = (settings as any)?.process_heading || "From Audit to Domination in 4 Steps";
  const subheading = (settings as any)?.process_subheading || "A battle-tested framework refined over 150+ successful campaigns";

  return (
    <section id="process" className="section-white py-20 lg:py-28 relative overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-16">
          <motion.span className="inline-block text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4"
            initial={false} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            Our Process
          </motion.span>
          <AnimatedHeading as="h2" text={heading} className="text-3xl lg:text-5xl font-display font-bold text-lead mb-4" />
          <motion.p className="text-muted-foreground max-w-lg mx-auto" initial={false}
            whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.4 }}>
            {subheading}
          </motion.p>
        </div>

        <div className="relative">
          {/* ConnectingBeam — desktop only */}
          {!isMobile && <ConnectingBeam />}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-5 relative z-10">
            {steps.map((step: any, i: number) => {
              const IconComp = iconMap[step.icon_name || "Scan"] || Scan;
              const color = step.color || "#6366f1";
              return (
                <motion.div key={step.id || i} initial={false} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
                  <motion.div className="bg-surface-white rounded-2xl p-6 lg:p-7 border border-border/70 relative group h-full overflow-hidden"
                    whileHover={!isMobile ? { y: -6, boxShadow: `0 25px 60px -15px ${color}22` } : undefined}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}>
                    <motion.span className="text-6xl font-display font-bold text-lead/[0.04] absolute top-3 right-4 select-none"
                      initial={false} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.15 + 0.3 }}>
                      {step.step_number}
                    </motion.span>
                    <div className="flex items-center gap-3 mb-4">
                      <motion.div className="w-10 h-10 rounded-xl gradient-primary-accent flex items-center justify-center relative overflow-hidden"
                        whileHover={!isMobile ? { rotate: 5, scale: 1.1 } : undefined}>
                        <IconComp className="h-4.5 w-4.5 text-primary-foreground relative z-10" />
                      </motion.div>
                      <span className="text-xs font-bold text-primary/50 uppercase tracking-wider">Step {step.step_number}</span>
                    </div>
                    <h3 className="font-display text-lg font-bold text-lead mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3">{step.description}</p>
                    {step.detail && (
                      <div className="flex items-center gap-1.5 text-xs font-medium text-accent">
                        <CheckCircle className="h-3 w-3" />{step.detail}
                      </div>
                    )}
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
