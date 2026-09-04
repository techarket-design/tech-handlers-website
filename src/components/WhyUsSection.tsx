import { motion } from "framer-motion";
import { AnimatedHeading } from "./motion/AnimationUtils";
import {
  Shield, Clock, Headphones, TrendingUp, Users, Award,
  Search, Target, BarChart3, Zap, Star, Rocket, Code, Globe,
  MessageSquare, PenTool, Share2, Settings, Layout, Monitor, Smartphone,
} from "lucide-react";
import { useWhyUsReasons, useSiteSettings } from "@/hooks/useData";

const iconMap: Record<string, any> = {
  Shield, Clock, Headphones, TrendingUp, Users, Award, Search, Target,
  BarChart3, Zap, Star, Rocket, Code, Globe, MessageSquare, PenTool,
  Share2, Settings, Layout, Monitor, Smartphone,
};

const fallbackReasons = [
  { icon_name: "TrendingUp", title: "Revenue-First Approach", description: "Every strategy starts and ends with your revenue goals. We optimize for profit, not just clicks." },
  { icon_name: "Shield", title: "Delhi NCR Specialists", description: "Deep market intelligence from 150+ local campaigns gives us an unfair advantage in your market." },
  { icon_name: "Clock", title: "Real-Time Dashboards", description: "No waiting for reports. See your campaign performance live with metrics that actually matter." },
  { icon_name: "Headphones", title: "Dedicated Strategy Team", description: "You get a senior strategist, campaign manager, and designer assigned to your account." },
  { icon_name: "Users", title: "97% Retention Rate", description: "Our clients stay because results compound. Most agencies churn at 40%. We retain at 97%." },
  { icon_name: "Award", title: "Transparent Pricing", description: "No hidden fees, no lock-in contracts. Clear deliverables, clear pricing, clear ROI tracking." },
];

export default function WhyUsSection() {
  const { data: dbReasons } = useWhyUsReasons();
  const { data: settings } = useSiteSettings();

  const reasons = (dbReasons as any[])?.length ? dbReasons as any[] : fallbackReasons;
  const heading = (settings as any)?.why_us_heading || "Built Different. Proven Results.";
  const subheading = (settings as any)?.why_us_subheading || "Here's why the smartest brands in Delhi NCR choose us";

  return (
    <section className="section-dark py-20 lg:py-28 noise-overlay relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <motion.div className="absolute top-0 left-1/3 w-96 h-96 rounded-full bg-primary/[0.03] blur-3xl"
          animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 8 }} />
        <motion.div className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full bg-accent/[0.03] blur-3xl"
          animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 10, delay: 3 }} />
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <motion.span className="inline-block text-xs font-bold text-accent uppercase tracking-[0.2em] mb-4"
            initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            Why Choose Us
          </motion.span>
          <AnimatedHeading as="h2" text={heading} className="text-3xl lg:text-5xl font-display font-bold mb-4" />
          <motion.p className="text-surface-white/50 max-w-lg mx-auto" initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.4 }}>
            {subheading}
          </motion.p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {reasons.map((r: any, i: number) => {
            const IconComp = iconMap[r.icon_name || "TrendingUp"] || TrendingUp;
            return (
              <motion.div key={r.id || i} initial={{ opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
                <motion.div className="rounded-2xl p-6 lg:p-7 border border-surface-white/[0.06] bg-surface-white/[0.03] backdrop-blur-sm h-full group relative overflow-hidden"
                  whileHover={{ y: -4, borderColor: "hsl(239 84% 67% / 0.15)", backgroundColor: "hsl(0 0% 100% / 0.05)" }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}>
                  <motion.div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 text-primary"
                    whileHover={{ scale: 1.1, y: -2 }} transition={{ type: "spring", stiffness: 400 }}>
                    <IconComp className="h-5 w-5 relative z-10" />
                  </motion.div>
                  <h3 className="font-display font-bold text-surface-white text-base mb-2">{r.title}</h3>
                  <p className="text-sm text-surface-white/40 leading-relaxed">{r.description}</p>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
