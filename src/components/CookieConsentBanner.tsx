import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Cookie, X } from "lucide-react";

const KEY = "th_cookie_consent_v1";

export type ConsentChoice = "accepted" | "rejected" | null;

export function getConsent(): ConsentChoice {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(KEY);
  return v === "accepted" || v === "rejected" ? v : null;
}

export function hasConsent(): boolean {
  return getConsent() === "accepted";
}

export default function CookieConsentBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!getConsent()) setOpen(true);
    }, 800);
    return () => clearTimeout(t);
  }, []);

  const decide = (choice: "accepted" | "rejected") => {
    localStorage.setItem(KEY, choice);
    setOpen(false);
    // Notify listeners (TrackingScripts)
    window.dispatchEvent(new CustomEvent("th-consent", { detail: choice }));
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-[60] sm:max-w-md"
          role="dialog"
          aria-label="Cookie consent"
        >
          <div className="rounded-xl border border-border/60 bg-surface-white shadow-2xl p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 shrink-0 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Cookie className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-lead mb-1">We use cookies</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  We use essential cookies to run the site and optional analytics & marketing cookies to improve it.
                  See our{" "}
                  <Link to="/cookie-policy" className="underline text-primary hover:no-underline">
                    Cookie Policy
                  </Link>
                  .
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <button
                    onClick={() => decide("accepted")}
                    className="px-3.5 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition"
                  >
                    Accept all
                  </button>
                  <button
                    onClick={() => decide("rejected")}
                    className="px-3.5 py-1.5 rounded-md bg-muted text-lead text-xs font-semibold hover:bg-muted/80 transition"
                  >
                    Reject non-essential
                  </button>
                </div>
              </div>
              <button
                onClick={() => decide("rejected")}
                aria-label="Close"
                className="p-1 -m-1 text-muted-foreground hover:text-lead"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
