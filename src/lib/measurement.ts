import { hasConsent } from "@/components/CookieConsentBanner";

type Touch = { landing_path: string; referrer_origin?: string; utm_source?: string; utm_medium?: string; utm_campaign?: string; utm_content?: string; utm_term?: string };
const KEY = "th_attribution_v1";
const converted = new Set<string>();
const campaignKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;
function currentTouch(): Touch {
  const touch: Touch = { landing_path: window.location.pathname.slice(0, 300) };
  try { if (document.referrer) touch.referrer_origin = new URL(document.referrer).origin; } catch { /* Invalid referrer */ }
  const params = new URLSearchParams(window.location.search);
  for (const key of campaignKeys) {
    const value = params.get(key);
    if (value && /^[a-zA-Z0-9 _.-]{1,100}$/.test(value)) touch[key] = value;
  }
  return touch;
}
export function startMeasurement() {
  const remember = () => {
    try {
      if (!hasConsent()) { sessionStorage.removeItem(KEY); return; }
      if (!sessionStorage.getItem(KEY)) sessionStorage.setItem(KEY, JSON.stringify(currentTouch()));
    } catch { /* Storage can be disabled */ }
  };
  remember();
  window.addEventListener("th-consent", remember);
}
export function captureAttribution() {
  const context: Record<string, unknown> = { submission_path: window.location.pathname.slice(0, 300), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone };
  if (hasConsent()) {
    try { context.first_touch = JSON.parse(sessionStorage.getItem(KEY) || "null") || currentTouch(); } catch { context.first_touch = currentTouch(); }
    context.last_touch = currentTouch();
  }
  return context;
}
export function emitMeasurement(event: string, details: Record<string, string | undefined> = {}) {
  if (!hasConsent() || window.location.pathname.startsWith("/admin")) return;
  const target = window as Window & { dataLayer?: Record<string, unknown>[]; gtag?: (...args: unknown[]) => void };
  target.dataLayer ||= [];
  // A GTM custom-event trigger owns delivery when a GTM container is present.
  // Direct GA4 installations receive gtag events instead of a second delivery path.
  const hasGtm = target.dataLayer.some(item => item.event === "gtm.js");
  if (target.gtag && !hasGtm) { target.gtag("event", event, details); return; }
  target.dataLayer.push({ event, ...details });
}
export function emitLeadConversion(id: string, source?: string, service?: string | null) {
  if (converted.has(id)) return;
  converted.add(id);
  emitMeasurement("generate_lead", { form_source: source || "website", service_interest: service || undefined });
}
