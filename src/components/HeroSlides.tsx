import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Search, Target, BarChart3, Zap, Users } from "lucide-react";

/* ── Slide 1: Revenue Growth Chart ── */
function RevenueGraphic() {
  const bars = [35, 48, 42, 65, 58, 78, 72, 92, 85, 100];
  return (
    <div className="relative w-full h-full flex items-end justify-center gap-2 px-8 pb-12 pt-20">
      {/* Floating metric cards */}
      <motion.div
        className="absolute top-6 right-6 bg-surface-white/90 backdrop-blur-xl rounded-xl px-4 py-3 shadow-lg border border-border/50"
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, type: "spring" }}
      >
        <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Revenue Growth</p>
        <p className="text-xl font-display font-bold text-lead">+340%</p>
      </motion.div>

      <motion.div
        className="absolute top-6 left-6 bg-surface-white/90 backdrop-blur-xl rounded-xl px-4 py-3 shadow-lg border border-border/50"
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, type: "spring" }}
      >
        <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Avg ROAS</p>
        <p className="text-xl font-display font-bold gradient-text">8.2x</p>
      </motion.div>

      {bars.map((h, i) => (
        <motion.div
          key={i}
          className="flex-1 max-w-[36px] rounded-t-lg relative overflow-hidden"
          style={{ height: `${h}%` }}
          initial={{ scaleY: 0, transformOrigin: "bottom" }}
          animate={{ scaleY: 1 }}
          transition={{ delay: 0.15 + i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="absolute inset-0 gradient-primary-accent opacity-80" />
          <motion.div
            className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 to-transparent"
            animate={{ y: ["100%", "-100%"] }}
            transition={{ repeat: Infinity, duration: 2, delay: i * 0.2, ease: "linear" }}
          />
        </motion.div>
      ))}

      {/* Growth line overlay */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 300" preserveAspectRatio="none">
        <motion.path
          d="M 30 250 C 70 240, 100 210, 140 220 C 180 200, 200 170, 240 150 C 280 120, 320 80, 370 40"
          fill="none"
          stroke="hsl(var(--accent))"
          strokeWidth="2.5"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.circle
          cx="370" cy="40" r="5"
          fill="hsl(var(--accent))"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1.8, type: "spring" }}
        />
      </svg>
    </div>
  );
}

/* ── Slide 2: SEO Rankings Visual ── */
function SEORankingsGraphic() {
  const rankings = [
    { keyword: "Digital Marketing Gurgaon", from: 47, to: 1, change: "+46" },
    { keyword: "SEO Agency Delhi NCR", from: 32, to: 2, change: "+30" },
    { keyword: "PPC Services Gurgaon", from: 28, to: 1, change: "+27" },
    { keyword: "Lead Gen Agency India", from: 55, to: 3, change: "+52" },
  ];
  return (
    <div className="relative w-full h-full flex flex-col justify-center px-6 py-8 gap-3">
      <motion.div
        className="absolute top-6 right-6 flex items-center gap-2 bg-success/10 text-success px-3 py-1.5 rounded-full"
        initial={false}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
        <span className="text-xs font-bold">Live Rankings</span>
      </motion.div>

      {rankings.map((r, i) => (
        <motion.div
          key={i}
          className="bg-surface-white/80 backdrop-blur-sm rounded-xl border border-border/50 p-4 flex items-center justify-between group hover:shadow-lg transition-shadow"
          initial={false}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 + i * 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-lead truncate">{r.keyword}</p>
            <p className="text-[10px] text-muted-foreground">
              Position {r.from} → <span className="text-primary font-bold">#{r.to}</span>
            </p>
          </div>
          <motion.div
            className="flex items-center gap-1 bg-primary/10 text-primary px-2.5 py-1 rounded-full text-xs font-bold"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 + i * 0.12, type: "spring", stiffness: 400 }}
          >
            <TrendingUp className="h-3 w-3" />
            {r.change}
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}

/* ── Slide 3: Lead Funnel Visual ── */
function LeadFunnelGraphic() {
  const stages = [
    { label: "Impressions", value: "2.4M", width: "100%", color: "bg-primary/20" },
    { label: "Clicks", value: "186K", width: "72%", color: "bg-primary/40" },
    { label: "Leads", value: "12.4K", width: "48%", color: "bg-primary/60" },
    { label: "Conversions", value: "3.2K", width: "28%", color: "gradient-primary-accent" },
  ];
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center px-8 py-10 gap-3">
      <motion.div
        className="absolute top-6 left-6 bg-surface-white/90 backdrop-blur-xl rounded-xl px-4 py-3 shadow-lg border border-border/50"
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, type: "spring" }}
      >
        <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Conversion Rate</p>
        <p className="text-xl font-display font-bold gradient-text">12.4%</p>
      </motion.div>

      {stages.map((s, i) => (
        <motion.div
          key={i}
          className="w-full flex items-center gap-3"
          initial={false}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.2 + i * 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformOrigin: "left" }}
        >
          <div className="relative rounded-xl h-14 overflow-hidden" style={{ width: s.width }}>
            <div className={`absolute inset-0 ${s.color} rounded-xl`} />
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
              animate={{ x: ["-100%", "200%"] }}
              transition={{ repeat: Infinity, duration: 3, delay: i * 0.4, ease: "linear" }}
            />
            <div className="relative z-10 flex items-center justify-between h-full px-4">
              <span className="text-xs font-semibold text-lead">{s.label}</span>
              <span className="text-sm font-display font-bold text-lead">{s.value}</span>
            </div>
          </div>
        </motion.div>
      ))}

      {/* Funnel arrow indicators */}
      <svg className="absolute right-8 top-1/2 -translate-y-1/2 w-6 h-32 opacity-20" viewBox="0 0 24 128">
        <motion.path
          d="M 12 0 L 12 128 M 4 100 L 12 128 L 20 100"
          fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 1, delay: 1 }}
        />
      </svg>
    </div>
  );
}

/* ── Slide 4: Performance Dashboard ── */
function DashboardGraphic() {
  const miniMetrics = [
    { label: "Active Campaigns", value: "23", icon: Zap },
    { label: "Monthly Leads", value: "1,247", icon: Users },
    { label: "Avg. CPA", value: "₹45", icon: Target },
    { label: "Spend Efficiency", value: "94%", icon: BarChart3 },
  ];
  return (
    <div className="relative w-full h-full flex flex-col justify-center px-6 py-8 gap-3">
      {/* Live indicator */}
      <motion.div
        className="absolute top-6 right-6 flex items-center gap-2"
        initial={false}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <motion.div
          className="w-2 h-2 rounded-full bg-success"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        />
        <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Real-time</span>
      </motion.div>

      <div className="grid grid-cols-2 gap-3">
        {miniMetrics.map((m, i) => (
          <motion.div
            key={i}
            className="bg-surface-white/80 backdrop-blur-sm rounded-xl border border-border/50 p-4 group hover:shadow-lg hover:border-primary/20 transition-all"
            initial={false}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.2 + i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              className="w-8 h-8 rounded-lg bg-primary/[0.07] flex items-center justify-center text-primary mb-3"
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              <m.icon className="h-4 w-4" />
            </motion.div>
            <p className="text-xl font-display font-bold text-lead">{m.value}</p>
            <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{m.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Mini sparkline */}
      <motion.div
        className="bg-surface-white/80 backdrop-blur-sm rounded-xl border border-border/50 p-4 mt-1"
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-lead">Weekly Performance</span>
          <span className="text-xs font-bold text-accent">+28%</span>
        </div>
        <svg className="w-full h-10" viewBox="0 0 300 40">
          <motion.path
            d="M 0 35 C 30 30, 50 25, 80 20 C 110 15, 130 28, 160 18 C 190 8, 220 22, 250 12 C 270 6, 290 10, 300 5"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
          <motion.path
            d="M 0 35 C 30 30, 50 25, 80 20 C 110 15, 130 28, 160 18 C 190 8, 220 22, 250 12 C 270 6, 290 10, 300 5 L 300 40 L 0 40 Z"
            fill="hsl(var(--primary))"
            opacity="0.06"
            initial={false}
            animate={{ opacity: 0.06 }}
            transition={{ delay: 1.5 }}
          />
        </svg>
      </motion.div>
    </div>
  );
}

/* ── Slide definitions ── */
export const heroSlides = [
  {
    id: "revenue",
    label: "Revenue Growth",
    icon: TrendingUp,
    graphic: RevenueGraphic,
    accent: "Client revenue scaled from ₹2Cr to ₹50Cr+",
  },
  {
    id: "seo",
    label: "SEO Rankings",
    icon: Search,
    graphic: SEORankingsGraphic,
    accent: "Page 1 rankings for 200+ competitive keywords",
  },
  {
    id: "leads",
    label: "Lead Generation",
    icon: Target,
    graphic: LeadFunnelGraphic,
    accent: "Full-funnel systems delivering 500+ leads monthly",
  },
  {
    id: "dashboard",
    label: "Live Dashboard",
    icon: BarChart3,
    graphic: DashboardGraphic,
    accent: "Real-time performance tracking across all channels",
  },
];
