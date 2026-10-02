import { useLowMotion } from "./motion/MotionPolicy";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, useInView, useMotionValue, useSpring, useTransform } from "framer-motion";
import { TrendingUp, DollarSign, Users, Brain, Play, Zap, BarChart3 } from "lucide-react";
import { useRevenueEngineSegments } from "@/hooks/useData";
import { useIsMobile } from "@/hooks/use-mobile";

const ICON_MAP: Record<string, React.ElementType> = {
  Users, BarChart3, DollarSign, Brain, TrendingUp, Zap, Play,
};

interface Segment {
  id: string;
  label: string;
  color: string;
  icon: React.ElementType;
  title: string;
  description: string;
  stat: string;
}

const FALLBACK_SEGMENTS: Segment[] = [
  { id: "acquisition", label: "Acquisition", color: "#4A7BF7", icon: Users, title: "Drive Qualified Traffic", description: "Multi-channel customer acquisition through SEO, PPC, and social media campaigns delivering qualified traffic at scale.", stat: "3.2x ROI" },
  { id: "pipeline", label: "Pipeline", color: "#1DBFA0", icon: BarChart3, title: "Build Your Pipeline", description: "Intelligent lead nurturing and pipeline management converting prospects into sales-ready opportunities.", stat: "47% Conversion" },
  { id: "revenue", label: "Revenue", color: "#2ECC71", icon: DollarSign, title: "Maximize Revenue", description: "Revenue optimization through data-driven strategies, A/B testing, and conversion rate optimization.", stat: "₹2.4Cr Generated" },
  { id: "intelligence", label: "AI Intelligence", color: "#9B59B6", icon: Brain, title: "Smarter Decisions", description: "Optimize investments with AI-powered dashboards, predictive analytics, and expert consulting.", stat: "15% Growth Lift" },
];

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arc(cx: number, cy: number, r: number, s: number, e: number) {
  const start = polar(cx, cy, r, e);
  const end = polar(cx, cy, r, s);
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${e - s > 180 ? 1 : 0} 0 ${end.x} ${end.y}`;
}

function midAngle(s: number, e: number) {
  return (s + e) / 2;
}

interface Props { siteName?: string }

export default function RevenueEngineGraphic({ siteName = "Tech Handlers" }: Props) {
  const { data: dbSegments } = useRevenueEngineSegments();
  const isMobile = useLowMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const visible = useInView(rootRef, { margin: "100px" });
  const activeMotion = !isMobile && visible;

  const SEGMENTS: Segment[] = (dbSegments as any[])?.length
    ? (dbSegments as any[]).map((s: any) => ({
        id: s.segment_key || s.id,
        label: s.label,
        color: s.color,
        icon: ICON_MAP[s.icon_name] || Users,
        title: s.title,
        description: s.description,
        stat: s.stat,
      }))
    : FALLBACK_SEGMENTS;

  const [active, setActive] = useState(0);
  const mounted = true;
  const [hovered, setHovered] = useState(false);

  // Mouse parallax — only used on desktop
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });
  const rotateX = useTransform(springY, [-200, 200], [4, -4]);
  const rotateY = useTransform(springX, [-200, 200], [-4, 4]);



  // Auto-rotate — slower on mobile to reduce re-renders
  useEffect(() => {
    if (hovered || !activeMotion) return;
    const count = SEGMENTS.length || 4;
    const interval = isMobile ? 5000 : 3500;
    const t = setInterval(() => setActive((p) => (p + 1) % count), interval);
    return () => clearInterval(t);
  }, [hovered, SEGMENTS.length, isMobile, activeMotion]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isMobile) return;
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  }, [mouseX, mouseY, isMobile]);

  const CX = 200, CY = 200, R = 130, SW = 44, GAP = 5;
  const segCount = SEGMENTS.length || 4;
  const ARC_DEG = (360 - GAP * segCount) / segCount;

  const angles = SEGMENTS.map((_, i) => {
    const s = i * (ARC_DEG + GAP) - 135;
    return { s, e: s + ARC_DEG };
  });

  const activeData = SEGMENTS[active];

  return (
    <motion.div
      ref={rootRef}
      className={`relative w-full mx-auto select-none ${isMobile ? 'max-w-[320px]' : 'max-w-[480px]'}`}
      onMouseMove={activeMotion ? handleMouseMove : undefined}
      onMouseEnter={activeMotion ? () => setHovered(true) : undefined}
      onMouseLeave={activeMotion ? () => { setHovered(false); mouseX.set(0); mouseY.set(0); } : undefined}
      style={activeMotion ? { perspective: 800 } : undefined}
    >
      <motion.div style={activeMotion ? { rotateX, rotateY, transformStyle: "preserve-3d" } : undefined}>
        {/* Pulsing rings — desktop only */}
        {activeMotion && (
          <>
            <motion.div
              className="absolute inset-0 m-auto rounded-full"
              style={{
                width: "75%", height: "75%",
                border: `1px solid ${activeData.color}20`,
                top: "5%",
              }}
              animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.15, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute inset-0 m-auto rounded-full"
              style={{
                width: "88%", height: "88%",
                border: `1px solid ${activeData.color}10`,
                top: "5%",
              }}
              animate={{ scale: [1, 1.05, 1], opacity: [0.2, 0.08, 0.2] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            />
          </>
        )}

        {/* Main SVG */}
        <svg viewBox="0 0 400 400" className="w-full" style={{ overflow: "visible" }}>
          <defs>
            {SEGMENTS.map((seg) => (
              <linearGradient key={`g-${seg.id}`} id={`g-${seg.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={seg.color} />
                <stop offset="100%" stopColor={seg.color} stopOpacity="0.7" />
              </linearGradient>
            ))}
            {/* SVG filters — desktop only */}
            {activeMotion && (
              <>
                <filter id="arc-glow" x="-40%" y="-40%" width="180%" height="180%">
                  <feGaussianBlur stdDeviation="8" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="3" stdDeviation="5" floodOpacity="0.1" />
                </filter>
              </>
            )}
          </defs>

          {/* Orbiting particles — desktop only */}
          {activeMotion && [
            { r: R + SW / 2 + 20, speed: 20, size: 3, opacity: 0.3, color: "var(--primary)" },
            { r: R + SW / 2 + 35, speed: 28, size: 2.5, opacity: 0.2, color: "var(--accent)" },
            { r: R - SW / 2 - 18, speed: 15, size: 2, opacity: 0.25, color: "var(--success)" },
          ].map((p, i) => (
            <motion.circle
              key={`orbit-${i}`}
              r={p.size}
              fill={`hsl(${p.color})`}
              opacity={p.opacity}
              initial={false}
              animate={{ opacity: mounted ? p.opacity : 0 }}
              transition={{ delay: 1.5 }}
            >
              <animateMotion
                dur={`${p.speed}s`}
                repeatCount="indefinite"
                path={`M ${CX + p.r} ${CY} A ${p.r} ${p.r} 0 1 1 ${CX + p.r - 0.01} ${CY}`}
              />
            </motion.circle>
          ))}

          {/* Arc segments — interactive on all devices */}
          {SEGMENTS.map((seg, i) => {
            const { s, e } = angles[i];
            const isActive = active === i;
            const d = arc(CX, CY, R, s, e);

            return (
              <g
                key={seg.id}
                className="cursor-pointer"
                onMouseEnter={activeMotion ? () => setActive(i) : undefined}
                onClick={isMobile ? () => setActive(i) : undefined}
              >
                {/* Active glow halo — desktop only */}
                {isActive && activeMotion && (
                  <motion.path
                    d={arc(CX, CY, R, s, e)}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth={SW + 20}
                    strokeLinecap="round"
                    initial={false}
                    animate={{ opacity: 0.1 }}
                    transition={{ duration: 0.5 }}
                    filter="url(#arc-glow)"
                  />
                )}

                {/* Main arc */}
                <motion.path
                  d={d}
                  fill="none"
                  stroke={`url(#g-${seg.id})`}
                  strokeLinecap="round"
                  initial={false}
                  animate={{
                    pathLength: mounted ? 1 : 0,
                    strokeWidth: isActive ? SW + 6 : SW,
                    opacity: isActive ? 1 : 0.55,
                  }}
                  transition={{
                    pathLength: { duration: 1.2, delay: i * 0.18, ease: [0.16, 1, 0.3, 1] },
                    strokeWidth: { duration: 0.5, ease: "easeOut" },
                    opacity: { duration: 0.4 },
                  }}
                />

                {/* Arc text */}
                {(() => {
                  const mid = midAngle(s, e);
                  const pt = polar(CX, CY, R, mid);
                  const rawAngle = mid;
                  const textRotation = rawAngle > 0 && rawAngle < 180 ? rawAngle + 180 : rawAngle;
                  return (
                    <motion.text
                      x={pt.x} y={pt.y}
                      fill="white"
                      fontSize="10"
                      fontWeight="700"
                      letterSpacing="2"
                      textAnchor="middle"
                      dominantBaseline="central"
                      transform={`rotate(${textRotation}, ${pt.x}, ${pt.y})`}
                      initial={false}
                      animate={{ opacity: mounted ? (isActive ? 1 : 0.85) : 0 }}
                      transition={{ delay: 1.1 + i * 0.12, duration: 0.6 }}
                      style={{ textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}
                      className="uppercase font-display"
                    >
                      {seg.label}
                    </motion.text>
                  );
                })()}
              </g>
            );
          })}

          {/* Connector lines + dots */}
          {angles.map(({ s, e }, i) => {
            const mid = (s + e) / 2;
            const from = polar(CX, CY, R + SW / 2 + 3, mid);
            const to = polar(CX, CY, R + SW / 2 + 30, mid);
            const isActive = active === i;
            return (
              <g key={`conn-${i}`}>
                <motion.line
                  x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                  stroke={SEGMENTS[i].color}
                  strokeWidth={1.5}
                  initial={false}
                  animate={{ pathLength: mounted ? 1 : 0, opacity: isActive ? 0.8 : 0.2 }}
                  transition={{ delay: 1.5 + i * 0.08, duration: 0.4, opacity: { duration: 0.3 } }}
                />
                <motion.circle
                  cx={to.x} cy={to.y} r={isActive ? 4 : 3}
                  fill={SEGMENTS[i].color}
                  initial={false}
                  animate={{ scale: mounted ? 1 : 0, opacity: isActive ? 1 : 0.25 }}
                  transition={{ delay: 1.6 + i * 0.08, type: "spring", opacity: { duration: 0.3 } }}
                />
                {/* Pulse ring on active dot — desktop only */}
                {isActive && activeMotion && (
                  <motion.circle
                    cx={to.x} cy={to.y} r={4}
                    fill="none"
                    stroke={SEGMENTS[i].color}
                    strokeWidth={1}
                    animate={{ r: [4, 12], opacity: [0.5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                  />
                )}
              </g>
            );
          })}

          {/* Icon circles at arc ends */}
          {angles.map(({ e }, i) => {
            const pt = polar(CX, CY, R, e - 8);
            const isActive = active === i;
            const icons = ["◆", "▶", "$", "⚡"];
            return (
              <g
                key={`ic-${i}`}
                className="cursor-pointer"
                onMouseEnter={activeMotion ? () => setActive(i) : undefined}
                onClick={isMobile ? () => setActive(i) : undefined}
              >
                {/* Glow behind active icon — desktop only */}
                {isActive && activeMotion && (
                  <motion.circle cx={pt.x} cy={pt.y} r={18} fill={SEGMENTS[i].color} opacity={0.15}
                    initial={false} animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
                <motion.circle
                  cx={pt.x} cy={pt.y}
                  fill={isActive ? SEGMENTS[i].color : "hsl(var(--card))"}
                  stroke={SEGMENTS[i].color}
                  strokeWidth={isActive ? 0 : 2}
                  initial={false}
                  animate={{ r: mounted ? (isActive ? 14 : 11) : 0 }}
                  transition={{ delay: 1.1 + i * 0.1, type: "spring", stiffness: 150, r: { duration: 0.3 } }}
                />
                <motion.text
                  x={pt.x} y={pt.y + 1} textAnchor="middle" dominantBaseline="central"
                  fontSize="11" fontWeight="bold"
                  fill={isActive ? "white" : SEGMENTS[i].color}
                  initial={false}
                  animate={{ opacity: mounted ? 1 : 0 }}
                  transition={{ delay: 1.2 + i * 0.1 }}
                >
                  {icons[i]}
                </motion.text>
              </g>
            );
          })}

          {/* Center disc */}
          <motion.circle
            cx={CX} cy={CY} r={R - SW / 2 - 6}
            fill="hsl(var(--card))"
            filter={activeMotion ? "url(#soft-shadow)" : undefined}
            stroke="hsl(var(--border))"
            strokeWidth="0.5"
            initial={false}
            animate={{ scale: mounted ? 1 : 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 80, damping: 15 }}
          />

          {/* Inner ring decoration — desktop only */}
          {activeMotion && (
            <motion.circle
              cx={CX} cy={CY} r={R - SW / 2 - 18}
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth="0.5"
              strokeDasharray="3 6"
              initial={false}
              animate={{ opacity: mounted ? 0.4 : 0 }}
              transition={{ delay: 0.8 }}
            >
              <animateTransform attributeName="transform" type="rotate" from={`0 ${CX} ${CY}`} to={`360 ${CX} ${CY}`} dur="60s" repeatCount="indefinite" />
            </motion.circle>
          )}

          {/* Center text */}
          <motion.g initial={false} animate={{ opacity: mounted ? 1 : 0 }} transition={{ delay: 0.7, duration: 0.8 }}>
            <text x={CX} y={CY - 18} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="9" fontWeight="600" letterSpacing="2.5" className="uppercase">
              {siteName}
            </text>
            <text x={CX} y={CY + 5} textAnchor="middle" fill="hsl(var(--foreground))" fontSize="17" fontWeight="800" className="font-display">
              Revenue Engine
            </text>
            <motion.g
              initial={false}
              animate={{ opacity: mounted ? 1 : 0, y: 0 }}
              transition={{ delay: 1.2, duration: 0.5 }}
            >
              <rect x={CX - 62} y={CY + 14} width="124" height="24" rx="12" fill="hsl(142 76% 36% / 0.1)" stroke="hsl(142 76% 36% / 0.2)" strokeWidth="0.8" />
              <text x={CX} y={CY + 30} textAnchor="middle" fill="hsl(142 76% 36%)" fontSize="8.5" fontWeight="700">
                Plan · Execute · Measure
              </text>
            </motion.g>
          </motion.g>
        </svg>

        {/* Bottom icons cluster */}
        <div className="absolute bottom-[32%] left-1/2 -translate-x-1/2 flex gap-2">
          {[
            { Icon: BarChart3, color: SEGMENTS[0].color },
            { Icon: Zap, color: (SEGMENTS[3] || SEGMENTS[0]).color },
            { Icon: Play, color: (SEGMENTS[1] || SEGMENTS[0]).color },
          ].map(({ Icon, color }, i) => (
            <motion.div
              key={i}
              className="w-7 h-7 rounded-full flex items-center justify-center shadow-md border border-card/50"
              style={{ backgroundColor: color }}
              initial={false}
              animate={{ scale: mounted ? 1 : 0 }}
              transition={{ delay: 1.4 + i * 0.08, type: "spring" }}
              whileHover={activeMotion ? { scale: 1.2, y: -2 } : undefined}
            >
              <Icon className="h-3 w-3 text-primary-foreground" />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Info card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeData.id}
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mt-2 sm:absolute sm:bottom-4 sm:left-0 sm:max-w-[220px]"
        >
          <div className="p-4 rounded-2xl border border-border/60 bg-card/95 backdrop-blur-md shadow-2xl">
            <div className="flex items-center gap-2.5 mb-2.5">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: activeData.color + "18" }}
              >
                <activeData.icon className="h-4 w-4" style={{ color: activeData.color }} />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: activeData.color }}>
                {activeData.stat}
              </span>
            </div>
            <p className="text-[13px] font-bold text-foreground mb-1 leading-snug">{activeData.title}</p>
            <p className="text-[11px] text-muted-foreground leading-[1.6]">{activeData.description}</p>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
