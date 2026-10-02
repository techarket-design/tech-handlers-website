import { useEffect, useState } from "react";
import { useTrackingScripts } from "@/hooks/useData";
import { getConsent } from "@/components/CookieConsentBanner";
import { useLocation } from "react-router-dom";
import { emitMeasurement } from "@/lib/measurement";

export default function TrackingScripts() {
  const { pathname } = useLocation();
  const { data: scripts } = useTrackingScripts();
  const [consent, setConsent] = useState<string | null>(() => getConsent());

  useEffect(() => {
    const handler = (e: Event) => setConsent((e as CustomEvent).detail);
    window.addEventListener("th-consent", handler);
    return () => window.removeEventListener("th-consent", handler);
  }, []);

  useEffect(() => {
    if (!scripts?.length) return;
    // Gate non-essential tracking behind consent (GDPR / DPDP Act)
    if (consent !== "accepted" || pathname.startsWith("/admin")) return;

    scripts.forEach((s) => {
      if (!s.is_active) return;

      // Inject head code
      if (s.head_code) {
        const div = document.createElement("div");
        div.innerHTML = s.head_code;
        Array.from(div.children).forEach((el) => {
          el.setAttribute("data-tracking", s.id);
          const live = el.tagName === "SCRIPT" ? document.createElement("script") : el;
          if (live !== el) { Array.from(el.attributes).forEach(a => live.setAttribute(a.name, a.value)); live.textContent = el.textContent; }
          document.head.appendChild(live);
        });
      }

      // Inject body code
      if (s.body_code) {
        const div = document.createElement("div");
        div.innerHTML = s.body_code;
        Array.from(div.children).forEach((el) => {
          el.setAttribute("data-tracking", s.id);
          const live = el.tagName === "SCRIPT" ? document.createElement("script") : el;
          if (live !== el) { Array.from(el.attributes).forEach(a => live.setAttribute(a.name, a.value)); live.textContent = el.textContent; }
          document.body.appendChild(live);
        });
      }
    });

    return () => {
      document.querySelectorAll("[data-tracking]").forEach((el) => el.remove());
    };
  }, [scripts, consent, pathname.startsWith("/admin")]);

  useEffect(() => {
    if (consent === "accepted") emitMeasurement("virtual_page_view", { page_path: pathname, page_title: document.title });
  }, [pathname, consent]);

  return null;
}
