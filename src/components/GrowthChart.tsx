import { motion } from "framer-motion";

const pathData = "M 30 170 C 60 165, 90 155, 120 140 C 150 125, 175 110, 200 95 C 230 78, 260 55, 290 42 C 320 30, 350 22, 400 15";

const nodes = [
  { cx: 120, cy: 140, label: "₹2Cr", delay: 0.5 },
  { cx: 200, cy: 95, label: "₹8Cr", delay: 0.8 },
  { cx: 290, cy: 42, label: "₹25Cr", delay: 1.0 },
  { cx: 400, cy: 15, label: "₹50Cr+", delay: 1.2, accent: true },
];

export default function GrowthChart() {
  return (
    <div className="relative w-full max-w-lg mx-auto">
      <svg viewBox="0 0 440 200" className="w-full h-auto">
        <defs>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(239 84% 67%)" />
            <stop offset="100%" stopColor="hsl(293 69% 49%)" />
          </linearGradient>
          <linearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(239 84% 67% / 0.12)" />
            <stop offset="100%" stopColor="hsl(239 84% 67% / 0)" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Subtle grid */}
        {[50, 90, 130, 170].map((y) => (
          <motion.line
            key={y}
            x1="30" y1={y} x2="420" y2={y}
            stroke="hsl(30 6% 88% / 0.5)"
            strokeWidth="0.5"
            strokeDasharray="4 4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          />
        ))}

        {/* Glow line (behind) */}
        <motion.path
          d={pathData}
          fill="none"
          stroke="url(#lineGrad)"
          strokeWidth="8"
          strokeLinecap="round"
          opacity="0.15"
          filter="url(#glow)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: [0.34, 1.56, 0.64, 1] }}
        />

        {/* Area fill */}
        <motion.path
          d={pathData + " L 400 190 L 30 190 Z"}
          fill="url(#areaGrad)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.3 }}
        />

        {/* Main line */}
        <motion.path
          d={pathData}
          fill="none"
          stroke="url(#lineGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: [0.34, 1.56, 0.64, 1] }}
        />

        {/* Data nodes */}
        {nodes.map((node, i) => (
          <motion.g key={i}>
            {/* Outer glow ring */}
            <motion.circle
              cx={node.cx}
              cy={node.cy}
              r="12"
              fill={node.accent ? "hsl(293 69% 49% / 0.08)" : "hsl(239 84% 67% / 0.08)"}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: node.delay, type: "spring", stiffness: 300, damping: 15 }}
            />
            <motion.circle
              cx={node.cx}
              cy={node.cy}
              r="5"
              fill={node.accent ? "hsl(293 69% 49%)" : "hsl(239 84% 67%)"}
              stroke="hsl(0 0% 100%)"
              strokeWidth="2.5"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: node.delay, type: "spring", stiffness: 500, damping: 15 }}
            />
            {node.accent && (
              <motion.circle
                cx={node.cx}
                cy={node.cy}
                r="5"
                fill="none"
                stroke="hsl(293 69% 49%)"
                strokeWidth="1.5"
                initial={{ scale: 1, opacity: 0.7 }}
                animate={{ scale: 3, opacity: 0 }}
                transition={{ repeat: Infinity, duration: 2, delay: 1.5, ease: "easeOut" }}
              />
            )}
            <motion.text
              x={node.cx}
              y={node.cy - 18}
              textAnchor="middle"
              className="fill-lead font-display text-[10px] font-bold"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: node.delay + 0.2, duration: 0.4 }}
            >
              {node.label}
            </motion.text>
          </motion.g>
        ))}
      </svg>
    </div>
  );
}
