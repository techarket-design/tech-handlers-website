import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Phone, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Conversion-focused sticky bottom bar. Appears after the user scrolls past the hero.
 * - Adds urgency ("Free 30-min strategy call this week")
 * - Persistent call + book actions
 * - Dismissible per session
 */
export default function StickyConversionBar() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("th_sticky_dismissed") === "1") {
      setDismissed(true);
      return;
    }
    const onScroll = () => {
      const y = window.scrollY;
      const h = window.innerHeight;
      setVisible(y > h * 0.6 && y < document.body.scrollHeight - h * 1.2);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const dismiss = () => {
    setDismissed(true);
    try { sessionStorage.setItem("th_sticky_dismissed", "1"); } catch { /* ignore */ }
  };

  const scrollToForm = () => {
    const target = document.getElementById("contact") || document.querySelector("form");
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  if (dismissed) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={false}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 26 }}
          className="fixed bottom-4 inset-x-3 sm:inset-x-6 z-40 pointer-events-none"
        >
          <div className="pointer-events-auto max-w-4xl mx-auto rounded-2xl border border-border bg-card/95 backdrop-blur-lg shadow-2xl px-4 py-3 sm:px-5 sm:py-4 flex items-center gap-3 sm:gap-5">
            <div className="hidden sm:flex h-11 w-11 shrink-0 rounded-xl items-center justify-center gradient-primary-accent">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm sm:text-base font-semibold text-foreground leading-tight truncate">
                Free 30-min strategy call — limited slots this week
              </p>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 truncate">
                Get a custom growth plan for your business. No commitment.
              </p>
            </div>
            <a
              href="tel:+919999999999"
              className="hidden md:inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              <Phone className="h-4 w-4" /> Call
            </a>
            <Button
              size="sm"
              onClick={scrollToForm}
              className="gradient-primary-accent text-primary-foreground font-semibold h-10 px-4 shrink-0"
            >
              Book now <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
            <button
              onClick={dismiss}
              aria-label="Dismiss"
              className="shrink-0 h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
