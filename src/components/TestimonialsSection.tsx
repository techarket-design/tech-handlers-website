import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedHeading } from "./motion/AnimationUtils";
import { Quote, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useTestimonials, useSiteSettings } from "@/hooks/useData";
import { useIsMobile } from "@/hooks/use-mobile";

const fallbackTestimonials = [
  { name: "Rajesh Malhotra", role: "CEO, TechVista Solutions", company: "TechVista", content: "Tech Handlers transformed our digital presence. Our lead pipeline has never been this strong.", rating: 5 },
  { name: "Priya Kapoor", role: "Founder, StyleHub India", company: "StyleHub", content: "Their performance marketing team is exceptional. They reduced our cost-per-acquisition by 60%.", rating: 5 },
  { name: "Amit Srivastava", role: "CMO, RealtyKing Properties", company: "RealtyKing", content: "Working with Tech Handlers feels like having an in-house team that truly understands digital growth.", rating: 5 },
];

export default function TestimonialsSection() {
  const [current, setCurrent] = useState(0);
  const { data: dbTestimonials } = useTestimonials();
  const { data: settings } = useSiteSettings();
  const isMobile = useIsMobile();

  const testimonials = dbTestimonials?.length ? dbTestimonials : fallbackTestimonials;
  const heading = (settings as any)?.testimonials_heading || "Trusted by Leaders Across Delhi NCR";

  const next = () => setCurrent((c) => (c + 1) % testimonials.length);
  const prev = () => setCurrent((c) => (c - 1 + testimonials.length) % testimonials.length);

  const t = testimonials[current];

  return (
    <section id="testimonials" className="section-stone py-20 lg:py-28 relative overflow-hidden">
      {/* Background blur blobs — desktop only */}
      {!isMobile && (
        <>
          <div className="absolute left-[10%] top-20 w-72 h-72 rounded-full bg-primary/[0.02] blur-3xl" />
          <div className="absolute right-[5%] bottom-20 w-60 h-60 rounded-full bg-accent/[0.02] blur-3xl" />
        </>
      )}

      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-14">
          <motion.span className="inline-block text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4"
            initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            Client Stories
          </motion.span>
          <AnimatedHeading as="h2" text={heading} className="text-3xl lg:text-5xl font-display font-bold text-lead mb-4" />
        </div>

        <div className="max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div key={current} initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.98 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
              <div className="glass-card rounded-2xl p-8 lg:p-12 relative">
                <Quote className="h-8 w-8 text-primary/10 absolute top-6 left-6" />
                <div className="flex gap-1 mb-5">
                  {Array.from({ length: t.rating || 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-lg lg:text-xl text-lead leading-relaxed mb-8 font-medium">"{t.content}"</p>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    {(t as any).avatar_url ? (
                      <img src={(t as any).avatar_url} alt={t.name} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full gradient-primary-accent flex items-center justify-center text-sm font-bold text-primary-foreground">
                        {t.name.split(" ").map((n: string) => n[0]).join("")}
                      </div>
                    )}
                    <div>
                      <p className="font-display font-bold text-lead text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}{t.company ? ` · ${t.company}` : ""}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-center gap-4 mt-8">
            <motion.button onClick={prev} className="w-10 h-10 rounded-full border border-border bg-surface-white flex items-center justify-center text-muted-foreground hover:text-lead hover:border-primary/20 transition-colors"
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <ChevronLeft className="h-4 w-4" />
            </motion.button>
            <div className="flex gap-2">
              {testimonials.map((_: any, i: number) => (
                <motion.button key={i} onClick={() => setCurrent(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? "w-8 gradient-primary-accent" : "w-1.5 bg-border hover:bg-muted-foreground/30"}`}
                  whileHover={{ scale: 1.2 }} />
              ))}
            </div>
            <motion.button onClick={next} className="w-10 h-10 rounded-full border border-border bg-surface-white flex items-center justify-center text-muted-foreground hover:text-lead hover:border-primary/20 transition-colors"
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <ChevronRight className="h-4 w-4" />
            </motion.button>
          </div>
        </div>
      </div>
    </section>
  );
}
