import { motion } from "framer-motion";
import { ArrowRight, Zap, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSiteSettings } from "@/hooks/useData";

function FloatingOrbs() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div key={i} className="absolute rounded-full bg-surface-white/[0.04]"
          style={{ width: `${30 + Math.random() * 60}px`, height: `${30 + Math.random() * 60}px`, left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
          animate={{ y: [0, -30, 0], x: [0, Math.random() * 20 - 10, 0], scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 4 + Math.random() * 4, delay: i * 0.5, ease: "easeInOut" }} />
      ))}
    </div>
  );
}

export default function CTABanner() {
  const { data: settings } = useSiteSettings();
  const s = settings as any;

  const badge = s?.cta_badge_text || "Let's Talk Growth";
  const heading = s?.cta_heading || "Ready to Grow\nYour Business?";
  const description = s?.cta_description || "Tell us about your goals and we'll craft a tailored strategy to help you get there.";
  const buttonText = s?.cta_button_text || "Get in Touch";
  const secondaryButton = s?.cta_secondary_button_text || `Call ${s?.contact_phone || "+91 98765 43210"}`;
  const footerText = s?.cta_footer_text || "Dedicated team · Transparent pricing · Response within 24 hours";
  const credentialsUrl = s?.credentials_url || "/TechHandlers_Credentials.pdf";

  return (
    <section className="py-20 lg:py-28 relative overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div className="relative rounded-3xl p-8 lg:p-16 text-center overflow-hidden bg-gradient-to-br from-[hsl(222_72%_14%)] via-[hsl(258_70%_22%)] to-[hsl(330_85%_38%)] shadow-[0_30px_80px_-30px_rgba(199,32,120,0.55)] ring-1 ring-white/10"
          initial={false} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
          <FloatingOrbs />
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full bg-amber-300/10 blur-2xl" />
            <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-fuchsia-400/15 blur-3xl" />
            <div className="absolute -top-10 -right-10 w-72 h-72 rounded-full bg-cyan-400/10 blur-3xl" />
          </div>

          <div className="relative z-10">
            <motion.div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/25 rounded-full px-4 py-1.5 mb-6"
              initial={false} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
              <Zap className="h-3.5 w-3.5 text-amber-300" />
              <span className="text-xs font-bold text-white tracking-wide uppercase">{badge}</span>
            </motion.div>

            <h2 className="text-3xl lg:text-5xl xl:text-6xl font-display font-bold text-white mb-4 leading-tight whitespace-pre-line drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)]">
              {heading}
            </h2>
            <motion.p className="text-white/85 max-w-lg mx-auto mb-8 text-base lg:text-lg"
              initial={false} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.4 }}>
              {description}
            </motion.p>

            <motion.div className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={false} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.5 }}>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                <Button size="lg" className="bg-amber-300 text-lead font-bold shadow-[0_10px_30px_-8px_rgba(252,211,77,0.6)] hover:bg-amber-200 transition-all text-base px-8 h-12"
                  onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}>
                  {buttonText} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                <Button size="lg" variant="outline" className="border-white/50 bg-white/5 text-white hover:bg-white/15 hover:text-white transition-all text-base h-12"
                  onClick={() => {
                    if (s?.contact_phone) window.location.href = `tel:${s.contact_phone}`;
                  }}>
                  {secondaryButton}
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                <a href={credentialsUrl} download target="_blank" rel="noopener noreferrer">
                  <Button size="lg" variant="outline" className="border-white/50 bg-white/5 text-white hover:bg-white/15 hover:text-white transition-all text-base h-12">
                    <Download className="mr-2 h-4 w-4" /> Download Credentials
                  </Button>
                </a>
              </motion.div>
            </motion.div>

            <motion.p className="text-white/70 text-xs mt-6"
              initial={false} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.7 }}>
              {footerText}
            </motion.p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
