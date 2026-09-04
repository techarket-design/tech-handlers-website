import { useEffect, useState } from "react";
import { useTrackingScripts } from "@/hooks/useData";
import { getConsent } from "@/components/CookieConsentBanner";

export default function TrackingScripts() {
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
    if (consent !== "accepted") return;

    scripts.forEach((s) => {
      if (!s.is_active) return;

      // Inject head code
      if (s.head_code) {
        const div = document.createElement("div");
        div.innerHTML = s.head_code;
        Array.from(div.children).forEach((el) => {
          el.setAttribute("data-tracking", s.id);
          document.head.appendChild(el);
        });
      }

      // Inject body code
      if (s.body_code) {
        const div = document.createElement("div");
        div.innerHTML = s.body_code;
        Array.from(div.children).forEach((el) => {
          el.setAttribute("data-tracking", s.id);
          document.body.appendChild(el);
        });
      }
    });

    return () => {
      document.querySelectorAll("[data-tracking]").forEach((el) => el.remove());
    };
  }, [scripts, consent]);

  return null;
}
