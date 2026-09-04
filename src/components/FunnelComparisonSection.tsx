import { motion } from "framer-motion";
import { useSiteSettings } from "@/hooks/useData";
import funnelImage from "@/assets/funnel-comparison.png";

export default function FunnelComparisonSection() {
  const { data: settings } = useSiteSettings();

  const heading = (settings as any)?.funnel_heading || "Move From Marketing that Reports Clicks to Marketing that Reports Revenue";
  const subtitle = (settings as any)?.funnel_subtitle || "Traditional marketing optimizes for channel metrics. Tech Handlers marketing builds a connected Revenue Engine for total business impact. Achieve 15% higher lead growth and smarter decisions through predictive analytics.";
  const tradTitle = (settings as any)?.funnel_traditional_title || "Traditional Digital Marketing";
  const tradDesc = (settings as any)?.funnel_traditional_description || "Siloed data and channels. Decisions based on vanity metrics and feel, leading to a broken, inefficient funnel.";
  const revTitle = (settings as any)?.funnel_revenue_title || `${settings?.site_name || "Tech Handlers"} Revenue Marketing`;
  const revDesc = (settings as any)?.funnel_revenue_description || "Connects all data sources to power a cohesive Revenue Engine. Use predictive analytics for smarter, revenue-backed decisions that minimize cost per lead and maximize ROI.";
  const siteName = settings?.site_name || "Tech Handlers";

  return (
    <section className="py-20 lg:py-28 bg-background relative overflow-hidden" id="funnel">
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.03), transparent 70%)" }}
        />
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        {/* Heading */}
        <motion.div
          className="text-center max-w-4xl mx-auto mb-12 lg:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-foreground mb-5 leading-tight text-balance">
            {heading}
          </h2>
          <p className="text-base lg:text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto">
            {subtitle.split("Revenue Engine").map((part: string, i: number, arr: string[]) =>
              i < arr.length - 1 ? (
                <span key={i}>{part}<strong className="text-foreground">Revenue Engine</strong></span>
              ) : (
                <span key={i}>{part}</span>
              )
            )}
          </p>
        </motion.div>

        {/* Funnel graphic */}
        <motion.div
          className="max-w-3xl mx-auto mb-10 lg:mb-14"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.15 }}
        >
          <img
            src={funnelImage}
            alt="Funnel comparison — Traditional vs Revenue Marketing"
            className="w-full h-auto"
            loading="lazy"
          />
        </motion.div>

        {/* Two-column descriptions */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-16 max-w-4xl mx-auto">
          <motion.div
            className="text-center md:text-left"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            <h3 className="text-xl font-display font-bold text-foreground mb-3">{tradTitle}</h3>
            <p className="text-muted-foreground leading-relaxed">{tradDesc}</p>
          </motion.div>

          <motion.div
            className="text-center md:text-left"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.35 }}
          >
            <h3 className="text-xl font-display font-bold text-foreground mb-3">{revTitle}</h3>
            <p className="text-muted-foreground leading-relaxed">{revDesc}</p>
          </motion.div>
        </div>

        {/* Trust strip */}
        <motion.div
          className="flex items-center justify-center gap-4 mt-12"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex -space-x-2">
            {["RS", "PV", "AG", "NK"].map((initials, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full border-2 border-card flex items-center justify-center text-[10px] font-bold text-primary-foreground gradient-primary-accent"
                style={{ opacity: 1 - i * 0.15 }}
              >
                {initials}
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="text-foreground font-semibold">150+ brands</span> trust {siteName} across Delhi NCR
          </p>
        </motion.div>
      </div>
    </section>
  );
}
