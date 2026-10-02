import { useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Compass, Code2, TrendingUp } from "lucide-react";

const phases = [
  { label: "Discover", message: "Your ambition. Our starting point.", icon: Compass },
  { label: "Create", message: "A distinctive experience, built around you.", icon: Code2 },
  { label: "Grow", message: "Clear goals. A connected growth plan.", icon: TrendingUp },
];

export default function HeroProjectPrism() {
  const [active, setActive] = useState(0);
  const scene = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const Icon = phases[active].icon;
  const reset = () => {
    scene.current?.style.setProperty("--prism-x", "0deg");
    scene.current?.style.setProperty("--prism-y", "0deg");
  };
  return <div className="hero-prism" ref={scene} onPointerMove={event => {
    if (reduced) return;
    const box = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--prism-x", `${((event.clientY - box.top) / box.height - .5) * -10}deg`);
    event.currentTarget.style.setProperty("--prism-y", `${((event.clientX - box.left) / box.width - .5) * 14}deg`);
  }} onPointerLeave={reset} onPointerUp={reset} onPointerCancel={reset}>
    <div className="hero-prism-scene">
      <div className="hero-prism-ring" aria-hidden="true" />
      <motion.button type="button" className="hero-prism-object" aria-label="Explore next project phase" onClick={() => setActive(value => (value + 1) % phases.length)}
        animate={{ rotateY: active * 120 }} transition={{ duration: reduced ? 0 : .8, ease: [.16, 1, .3, 1] }}>
        {phases.map((phase, i) => <span key={phase.label} className={`hero-prism-face hero-prism-face-${i}`} aria-hidden="true"><phase.icon /><span>{phase.label}</span></span>)}
      </motion.button>
    </div>
    <div className="hero-prism-copy"><span className="hero-prism-label">LET’S SHAPE WHAT’S NEXT</span><p aria-live="polite"><Icon className="h-4 w-4" />{phases[active].message}</p>
      <div className="hero-prism-controls" role="group" aria-label="Explore project phases">{phases.map((phase, i) => <button type="button" key={phase.label} aria-pressed={active === i} onClick={() => setActive(i)}>{phase.label}</button>)}</div>
    </div>
  </div>;
}
