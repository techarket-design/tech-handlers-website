import { useLowMotion } from "./motion/MotionPolicy";
import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import CountUp from "react-countup";
import { AnimatedHeading, DrawLine } from "./motion/AnimationUtils";
import { useMetrics, useSiteSettings } from "@/hooks/useData";
import { useIsMobile } from "@/hooks/use-mobile";

const fallbackMetrics = [
  { value: "50", suffix: "+", label: "Projects Delivered" },
  { value: "30", suffix: "+", label: "Happy Clients" },
  { value: "10", suffix: "+", label: "Industries Served" },
  { value: "3", suffix: "+", label: "Years of Combined Experience" },
];

function AnimatedBars() {
  return (
    <svg className="absolute bottom-0 left-0 w-full h-40 opacity-[0.04]" viewBox="0 0 400 100" preserveAspectRatio="none">
      {[30, 55, 45, 70, 60, 85, 50, 75, 90, 65, 80, 95, 70, 85, 60].map((h, i) => (
        <motion.rect key={i} x={i * 27} y={100 - h} width="18" height={h} fill="white" rx="2"
          initial={{ scaleY: 0, transformOrigin: "bottom" }} whileInView={{ scaleY: 1 }} viewport={{ once: true }}
          transition={{ delay: i * 0.05, duration: 0.6, ease: [0.22, 1, 0.36, 1] }} />
      ))}
    </svg>
  );
}

function DataFlowLines() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div key={i} className="absolute h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"
          style={{ top: `${20 + i * 15}%`, width: "200px" }}
          animate={{ x: ["-200px", "calc(100vw + 200px)"] }}
          transition={{ repeat: Infinity, duration: 6 + i * 2, delay: i * 1.2, ease: "linear" }} />
      ))}
    </div>
  );
}

export default function MetricsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [triggered, setTriggered] = useState(false);
  const { data: dbMetrics } = useMetrics();
  const { data: settings } = useSiteSettings();
  const isMobile = useLowMotion();

  if (isInView && !triggered) setTriggered(true);

  const metrics = dbMetrics?.length ? dbMetrics.map(m => ({
    value: m.value, suffix: m.suffix || "", label: m.label,
  })) : fallbackMetrics;

  const heading = (settings as any)?.metrics_heading || "Numbers That Speak Louder Than Promises";
  const subheading = (settings as any)?.metrics_subheading || "Real results for real businesses across Delhi NCR";

  return (
    <section id="metrics" ref={ref} className="section-dark py-20 lg:py-28 noise-overlay relative overflow-hidden">
      {/* Background decorations — desktop only */}
      {!isMobile && (
        <>
          <div className="absolute inset-0 pointer-events-none">
            <motion.div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-primary/[0.04] blur-3xl"
              animate={{ scale: [1, 1.3, 1], x: [0, 30, 0] }} transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }} />
            <motion.div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-accent/[0.05] blur-3xl"
              animate={{ scale: [1, 1.2, 1], y: [0, -20, 0] }} transition={{ repeat: Infinity, duration: 8, ease: "easeInOut", delay: 2 }} />
          </div>
          <DataFlowLines />
          <AnimatedBars />
        </>
      )}

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="text-center mb-14">
          <AnimatedHeading as="h2" text={heading} className="text-3xl lg:text-5xl font-display font-bold mb-4" />
          <motion.p className="text-surface-white/50 max-w-md mx-auto text-sm lg:text-base"
            initial={false} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
            {subheading}
          </motion.p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-10">
          {metrics.map((m, i) => {
            const numericValue = parseFloat(m.value.replace(/[^0-9.]/g, ""));
            const prefix = m.value.match(/^[^0-9]*/)?.[0] || "";
            return (
              <motion.div key={i} initial={false} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                viewport={{ once: true }} className="text-center group relative">
                {!isMobile && (
                  <motion.div className="absolute inset-0 bg-primary/[0.03] rounded-2xl blur-2xl"
                    initial={false} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
                    transition={{ delay: i * 0.12 + 0.3 }} />
                )}
                <motion.div className="relative text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-display font-bold mb-2 tracking-tight"
                  whileHover={!isMobile ? { scale: 1.05 } : undefined} transition={{ type: "spring", stiffness: 300 }}>
                  <span className="text-surface-white/30">{prefix}</span>
                  {m.value.replace(/^[^0-9]*/, "")}
                  <span className="gradient-text">{m.suffix}</span>
                </motion.div>
                <DrawLine className="max-w-[40px] mx-auto mb-3 bg-surface-white/10" delay={i * 0.1 + 0.5} />
                <p className="text-xs lg:text-sm text-surface-white/40 font-medium relative">{m.label}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
