import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChartNoAxesCombined, Code2, Compass, Layers3, Search, ShieldCheck } from "lucide-react";

const capabilities = [
  { label: "Strategy", icon: Compass, title: "A clear plan before a single pixel.", description: "Connect your audience, commercial goals and channel priorities to a defined scope of work.", deliverables: ["Discovery & market research", "Scope, milestones & priorities", "A shared definition of success"] },
  { label: "Build", icon: Code2, title: "Thoughtful experiences. Solid foundations.", description: "Bring design and development together to make your website clear, responsive and easy to evolve.", deliverables: ["Responsive interface design", "Performance & accessibility", "Documentation & handover"] },
  { label: "Discover", icon: Search, title: "Help the right people find you.", description: "Build search visibility around customer questions, useful content and a sound technical foundation.", deliverables: ["Technical SEO & content planning", "Search intent & site structure", "Tracking & reporting setup"] },
  { label: "Grow", icon: ChartNoAxesCombined, title: "Measure what moves your business.", description: "Use campaign and conversion data to prioritize the next improvement, with clear reporting along the way.", deliverables: ["Campaign & conversion strategy", "Experiment priorities", "Performance reviews"] },
];

export default function CapabilitiesExperience() {
  const [active, setActive] = useState(0);
  const stage = useRef<HTMLDivElement>(null);
  const [lowMotion, setLowMotion] = useState(true);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setLowMotion(preference.matches);
    sync();
    preference.addEventListener("change", sync);
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: .15 });
    if (stage.current) observer.observe(stage.current);
    return () => { preference.removeEventListener("change", sync); observer.disconnect(); };
  }, []);
  const outcomes = ["Clarity before investment", "Confidence at every click", "Visibility with intent", "Decisions backed by data"];
  const item = capabilities[active];
  const Icon = item.icon;
  const reset = () => {
    stage.current?.style.setProperty("--tilt-x", "0deg");
    stage.current?.style.setProperty("--tilt-y", "0deg");
  };
  return <section id="capabilities" className="capability-section py-20 lg:py-28" aria-labelledby="capabilities-title">
    <div className="container mx-auto px-4 lg:px-8">
      <div className="capability-editorial"><span>THE TECH HANDLERS ADVANTAGE</span><span>01 — THINK / BUILD / GROW</span></div>
      <div className="grid lg:grid-cols-2 gap-10 lg:gap-20 items-center">
        <div>
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[.18em] font-semibold text-primary mb-5"><Layers3 className="h-4 w-4" /> Built around your ambition</div>
          <h2 id="capabilities-title" className="capability-headline font-display font-bold tracking-tight text-lead">Make your next<br />move <span className="gradient-text">matter.</span></h2>
          <p className="text-muted-foreground mt-5 max-w-lg leading-relaxed">Your business deserves more than a beautiful website. Connect the brand people remember, the experience they trust and the marketing that brings them back.</p>
          <div className="flex flex-wrap gap-2 mt-7" role="group" aria-label="Explore our capabilities">{capabilities.map((c, i) => <button key={c.label} type="button" aria-pressed={active === i} onClick={() => setActive(i)} className={`capability-selector ${active === i ? "is-selected" : ""}`}><c.icon className="h-4 w-4" />{c.label}</button>)}</div>
          <div className="capability-detail mt-7 min-h-[240px]" aria-live="polite" aria-atomic="true">
            <div className="capability-outcome">{outcomes[active]}</div>
            <h3 className="text-xl font-semibold text-lead">{item.title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed mt-3">{item.description}</p>
            <ul className="space-y-3 mt-5">{item.deliverables.map(text => <li key={text} className="flex items-center gap-2 text-sm text-lead"><ShieldCheck className="h-4 w-4 text-primary shrink-0" />{text}</li>)}</ul>
          </div>
          <div className="capability-actions"><a href="#contact" className="capability-cta inline-flex items-center gap-2 rounded-lg gradient-primary-accent text-primary-foreground px-5 py-3 font-semibold">Let’s build your next chapter <ArrowRight className="h-4 w-4" /></a><a href="#case-studies" className="capability-proof-link">Explore the work ↗</a></div>
          <p className="capability-assurance">Start with your goals. Leave with clearer next steps.</p>
        </div>
        <div ref={stage} className={`capability-stage ${lowMotion ? "is-static" : ""} ${inView ? "is-in-view" : ""}`} onPointerMove={event => {
          if (lowMotion) return;
          const box = event.currentTarget.getBoundingClientRect();
          event.currentTarget.style.setProperty("--tilt-x", `${((event.clientY - box.top) / box.height - .5) * -12}deg`);
          event.currentTarget.style.setProperty("--tilt-y", `${((event.clientX - box.left) / box.width - .5) * 16}deg`);
        }} onPointerUp={reset} onPointerCancel={reset} onPointerLeave={reset}>
          <div className="capability-aura" /><div className="capability-grid" />
          <div className="capability-scene">
            <div className="capability-float">
            <div className="capability-orbit capability-orbit-one" /><div className="capability-orbit capability-orbit-two" />
            {[3, 2, 1, 0].map(i => <button type="button" key={i} aria-label={`Show ${capabilities[i].label} capability`} aria-pressed={active === i} onClick={() => setActive(i)} className={`capability-layer capability-layer-${i} ${active === i ? "is-active" : ""}`}><span>0{i + 1}</span><span>{capabilities[i].label}</span></button>)}
            <button type="button" aria-label="Explore next capability" onClick={() => setActive(current => (current + 1) % capabilities.length)} className="capability-core"><div className="capability-core-icon"><Icon className="h-10 w-10" /></div><strong>TECH HANDLERS</strong><span>{outcomes[active]}</span></button>
            <div className="capability-note capability-note-one"><span className="capability-status" /> Clear scope</div>
            <div className="capability-note capability-note-two"><ShieldCheck className="h-4 w-4" /> Account ownership</div>
            <div className="capability-note capability-note-three"><ChartNoAxesCombined className="h-4 w-4" /> Measurable goals</div>
            </div>
          </div>
          <p className="capability-stage-caption">{lowMotion ? "FOUR CAPABILITIES. ONE CONNECTED TEAM." : "MOVE TO EXPLORE · TOUCH TO SWITCH"}</p>
        </div>
      </div>
      <div className="capability-principles"><div><span>01 / ALIGNMENT</span><p>Your ambition. A shared plan.</p></div><div><span>02 / EXECUTION</span><p>Design and technology, together.</p></div><div><span>03 / ACCOUNTABILITY</span><p>Clear ownership. Visible progress.</p></div></div>
    </div>
  </section>;
}
