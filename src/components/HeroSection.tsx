import { useLowMotion } from "./motion/MotionPolicy";
import { useState, useRef, useMemo } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Send, ShieldCheck, Clock, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSiteSettings, useSubmitLead } from "@/hooks/useData";
import { toast } from "sonner";
import HeroProjectPrism from "./HeroProjectPrism";

const stats = [
  "DIGITAL GROWTH STRATEGY",
  "CLEAR SCOPE & REPORTING",
  "REMOTE COLLABORATION",
  "DIGITAL MARKETING EXPERTS",
  "WEB DEVELOPMENT PROS",
  "PERFORMANCE MARKETING",
];

const serviceOptions = [
  "Digital Marketing",
  "Performance Marketing",
  "Web Development",
  "SEO & Content Marketing",
  "Social Media Marketing",
  "LinkedIn Automation",
  "Lead Generation",
  "Other",
];

function useShootingStars(count: number) {
  return useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      startX: ((i + 1) / (count + 1)) * 100,
      startY: ((i + 1) / (count + 1)) * 60,
      angle: 25 + 0.5 * 30,
      length: 60 + 0.5 * 120,
      duration: 1.2 + 0.5 * 1.5,
      delay: 0.5 * 12,
      repeat: 6 + 0.5 * 10,
      opacity: 0.15 + 0.5 * 0.25,
      width: 1 + 0.5 * 1.5,
    })),
  [count]);
}

function useFloatingOrbs(count: number) {
  return useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: 10 + 0.5 * 80,
      y: 10 + 0.5 * 80,
      size: 3 + 0.5 * 6,
      duration: 4 + 0.5 * 6,
      delay: 0.5 * 3,
      color: ["var(--primary)", "var(--accent)", "var(--success)"][i % 3],
    })),
  [count]);
}

export default function HeroSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isMobile = useLowMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const bgY = useTransform(scrollYProgress, [0, 1], [0, 80]);

  const { data: settings } = useSiteSettings();
  const submitLead = useSubmitLead();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [service, setService] = useState("");
  const [message, setMessage] = useState("");

  const title = settings?.tagline || "Your Digital Growth Partner";
  const subtitle = (settings as any)?.hero_subtitle || "We're a digital marketing & web development agency helping businesses build a strong online presence. From SEO to custom websites — we handle the tech so you can focus on your business.";

  const shootingStars = useShootingStars(isMobile ? 0 : 6);
  const floatingOrbs = useFloatingOrbs(isMobile ? 0 : 8);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Please fill in your name and email");
      return;
    }
    submitLead.mutate(
      {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        service_interest: service || null,
        message: message.trim() || null,
        source: "hero_form",
      },
      {
        onSuccess: () => {
          toast.success("Thanks! We'll get back to you within 24 hours.");
          setName(""); setEmail(""); setPhone(""); setService(""); setMessage("");
        },
        onError: () => toast.error("Something went wrong. Please try again."),
      }
    );
  };

  const marqueeItems = [...stats, ...stats];

  return (
    <>
      <section ref={ref} className="hero-refined relative flex items-center bg-background overflow-hidden pt-16">
        <motion.div className="absolute inset-0 pointer-events-none" style={!isMobile ? { y: bgY } : undefined}>
          {isMobile ? (
            <div className="absolute top-16 right-[8%] w-80 h-80 rounded-full blur-3xl opacity-50"
              style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.06), transparent 70%)" }} />
          ) : (
            <>
              <motion.div className="absolute top-16 right-[8%] w-80 h-80 rounded-full blur-3xl"
                style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.06), transparent 70%)" }}
                animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} />
              <motion.div className="absolute bottom-24 left-[3%] w-96 h-96 rounded-full blur-3xl"
                style={{ background: "radial-gradient(circle, hsl(var(--accent) / 0.05), transparent 70%)" }}
                animate={{ scale: [1.1, 1, 1.1], opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }} />
              <motion.div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl"
                style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.02), transparent 60%)" }}
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }} />
            </>
          )}

          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: "radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

          {shootingStars.map((star) => {
            const rad = (star.angle * Math.PI) / 180;
            const dx = Math.cos(rad) * star.length;
            const dy = Math.sin(rad) * star.length;
            return (
              <motion.div key={`star-${star.id}`} className="absolute rounded-full"
                style={{ left: `${star.startX}%`, top: `${star.startY}%`, width: star.length, height: star.width,
                  background: `linear-gradient(90deg, transparent, hsl(var(--primary) / ${star.opacity}), transparent)`,
                  transformOrigin: "left center", rotate: `${star.angle}deg` }}
                initial={false}
                animate={{ opacity: [0, star.opacity, star.opacity, 0], scaleX: [0, 1, 1, 0.5], x: [0, dx * 0.5, dx], y: [0, dy * 0.5, dy] }}
                transition={{ duration: star.duration, delay: star.delay, repeat: Infinity, repeatDelay: star.repeat, ease: [0.22, 1, 0.36, 1] }} />
            );
          })}

          {floatingOrbs.map((orb) => (
            <motion.div key={`orb-${orb.id}`} className="absolute rounded-full"
              style={{ left: `${orb.x}%`, top: `${orb.y}%`, width: orb.size, height: orb.size, background: `hsl(${orb.color})`, opacity: 0.12 }}
              animate={{ y: [0, -20 - 0.5 * 15, 0], x: [0, 8 + 0.5 * 10, 0], opacity: [0.08, 0.2, 0.08], scale: [1, 1.3, 1] }}
              transition={{ duration: orb.duration, delay: orb.delay, repeat: Infinity, ease: "easeInOut" }} />
          ))}
        </motion.div>

        <motion.div className="container mx-auto px-4 lg:px-8 py-10 lg:py-14 relative z-10" style={!isMobile ? { opacity } : undefined}>
          <div className="grid lg:grid-cols-[1.15fr_1fr] gap-8 lg:gap-14 items-center">
            <div>
              <div className="hero-eyebrow"><span /> Strategy. Design. Digital growth.</div>
              <motion.h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] xl:text-6xl font-display font-bold text-foreground leading-[1.08] mb-6 text-balance"
                initial={false} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
                {title}
              </motion.h1>

              <motion.p className="text-lg lg:text-xl text-muted-foreground max-w-lg mb-8 leading-relaxed"
                initial={false} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.7 }}>
                {subtitle}
              </motion.p>
              <div className="flex flex-wrap gap-3 mb-7">
                <a href="#contact" className="inline-flex items-center gap-2 rounded-lg gradient-primary-accent px-5 py-3 text-primary-foreground font-semibold">Discuss your growth goals <ArrowRight className="h-4 w-4" /></a>
                <a href="#case-studies" className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-3 text-foreground font-semibold hover:border-primary/50">Explore our work <ArrowRight className="h-4 w-4" /></a>
              </div>

              <div className="hero-growth-art" aria-hidden="true">
                <div className="hero-art-orbit" /><div className="hero-art-orbit hero-art-orbit-two" />
                <div className="hero-art-card"><span>YOUR NEXT CHAPTER</span><strong>Built to connect.<br />Designed to grow.</strong><div className="hero-art-path"><i /><i /><i /><i /><i /></div></div>
                <div className="hero-art-chip">Brand → Experience → Growth <ArrowRight className="h-4 w-4" /></div>
              </div>
              {/* Trust strip */}
              <motion.div className="flex items-center gap-4 mt-6" initial={false} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
                <div className="flex -space-x-2">
                  {["TH", "DM", "PM", "WD"].map((initials, i) => (
                    <motion.div key={i}
                      className="w-8 h-8 rounded-full border-2 border-card flex items-center justify-center text-[10px] font-bold text-primary-foreground gradient-primary-accent"
                      style={{ opacity: 1 - i * 0.15 }}
                      initial={{ scale: 0, x: -10 }} animate={{ scale: 1, x: 0 }}
                      transition={{ delay: 0.8 + i * 0.08, type: "spring" }}>
                      {initials}
                    </motion.div>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground">
                  <span className="text-foreground font-semibold">SEO, web & marketing</span> expertise
                  <br />for ambitious businesses
                </div>
              </motion.div>
            </div>

            <motion.div initial={false} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}>
              <HeroProjectPrism />
              {/* Inquiry Form */}
              <motion.form onSubmit={handleSubmit}
                className="hero-enquiry bg-card border border-border rounded-2xl p-5 sm:p-7 space-y-4 w-full shadow-lg"
                initial={false} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.6 }}>
                <h2 className="font-display font-semibold text-foreground text-lg">Tell us what you want to achieve</h2>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground -mt-2">
                  <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> No spam, ever</span>
                  <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-primary" /> Reply within 24h</span>
                  <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 text-primary fill-primary" /> India-based team</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input aria-label="Your name" autoComplete="name" placeholder="Your Name *" value={name} onChange={(e) => setName(e.target.value)} required className="h-11" />
                  <Input aria-label="Email address" autoComplete="email" type="email" placeholder="Email *" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input type="tel" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-11" />
                  <Select value={service} onValueChange={setService}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Service Needed" />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceOptions.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Textarea placeholder="Tell us about your requirements..." value={message} onChange={(e) => setMessage(e.target.value)} rows={3} className="resize-none" />
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button type="submit" size="lg" disabled={submitLead.isPending}
                    className="w-full gradient-primary-accent text-primary-foreground font-semibold shadow-xl h-12 text-base">
                    {submitLead.isPending ? "Sending..." : "Start the conversation"}
                    <Send className="ml-2 h-4 w-4" />
                  </Button>
                </motion.div>
                <p className="text-[11px] text-center text-muted-foreground -mt-1">
                  Share your goals. We’ll discuss the right scope and next steps.
                </p>
              </motion.form>


            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Stats Marquee Bar */}
      <div className="bg-foreground py-3.5 overflow-hidden relative">
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-foreground to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-foreground to-transparent z-10" />
        <div className="marquee-track flex items-center gap-12 w-max">
          {marqueeItems.map((stat, i) => (
            <span key={i} className="text-xs font-bold text-background/60 uppercase tracking-[0.15em] whitespace-nowrap flex items-center gap-4">
              {stat}
              <span className="w-1 h-1 rounded-full bg-primary/50" />
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
