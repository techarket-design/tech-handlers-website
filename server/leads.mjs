import { createHmac } from "node:crypto";
export class LeadError extends Error { constructor(status, message) { super(message); this.status = status; } }
const SOURCES = new Set(["website", "hero_form", "contact_form", "service_form", "city_page_form"]);
const text = (value, max) => typeof value === "string" ? value.trim().slice(0, max) : null;
function touch(value) {
  if (!value || typeof value !== "object") return undefined;
  const out = {};
  if (typeof value.landing_path === "string" && /^\/[a-zA-Z0-9/_%.-]*$/.test(value.landing_path)) out.landing_path = value.landing_path.slice(0, 300);
  try { if (value.referrer_origin) out.referrer_origin = new URL(value.referrer_origin).origin; } catch { /* Ignore invalid origin */ }
  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) if (typeof value[key] === "string" && /^[a-zA-Z0-9 _.-]{1,100}$/.test(value[key])) out[key] = value[key];
  return out;
}
export function validateLead(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new LeadError(400, "Invalid submission");
  if (JSON.stringify(body).length > 16_000) throw new LeadError(413, "Submission is too long");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.request_id || "")) throw new LeadError(400, "Invalid submission ID");
  const name = text(body.name, 120), email = text(body.email, 254)?.toLowerCase();
  if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new LeadError(400, "Enter your name and a valid email address");
  if (body.website_url) { try { const url = new URL(body.website_url); if (!["http:", "https:"].includes(url.protocol)) throw new Error(); } catch { throw new LeadError(400, "Enter a full website URL, such as https://example.com"); } }
  const attribution = {};
  const input = body.attribution || {};
  if (typeof input.submission_path === "string" && /^\/[a-zA-Z0-9/_%.-]*$/.test(input.submission_path)) attribution.submission_path = input.submission_path.slice(0, 300);
  if (typeof input.timezone === "string" && /^[a-zA-Z0-9_+/-]{1,80}$/.test(input.timezone)) attribution.timezone = input.timezone;
  if (input.first_touch) attribution.first_touch = touch(input.first_touch);
  if (input.last_touch) attribution.last_touch = touch(input.last_touch);
  return { request_id: body.request_id, name, email, phone: text(body.phone, 40), company: text(body.company, 200), website_url: text(body.website_url, 500), service_interest: text(body.service_interest, 100), message: text(body.message, 5000), budget: text(body.budget, 100), source: SOURCES.has(body.source) ? body.source : "website", attribution };
}
export async function database(path, { method = "POST", body, headers = {} } = {}, fetcher = fetch) {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Lead database configuration is missing");
  const result = await fetcher(`${url}/rest/v1/${path}`, { method, headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...headers }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(8_000) });
  if (!result.ok) {
    const data = await result.json().catch(() => ({}));
    if (data.message === "lead_rate_limit") throw new LeadError(429, "Please wait before submitting another enquiry");
    throw new Error(`Lead database operation failed (${result.status})`);
  }
  const raw = await result.text();
  return raw ? JSON.parse(raw) : null;
}
export function rateKey(req) {
  if (!process.env.LEAD_RATE_LIMIT_SALT) throw new Error("Lead rate limit configuration is missing");
  const ip = String(req.headers["x-vercel-forwarded-for"] || req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown").split(",")[0].trim();
  return createHmac("sha256", process.env.LEAD_RATE_LIMIT_SALT).update(ip).digest("hex");
}
export async function deliverNotifications(leadId, db = database, fetcher = fetch) {
  const jobs = await db("rpc/claim_lead_notifications", { body: { p_lead_id: leadId || null } });
  let sent = 0;
  for (const job of jobs || []) {
    try {
      const endpoint = process.env.FORMSPREE_ENDPOINT;
      if (!endpoint || !/^https:\/\/formspree\.io\/f\/[a-zA-Z0-9]+$/.test(endpoint)) throw new Error("Notification endpoint is not configured");
      const [lead] = await db(`leads?id=eq.${job.lead_id}&select=name,email,phone,company,website_url,service_interest,message,budget,source`, { method: "GET" });
      const response = await fetcher(endpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ ...lead, _subject: `Tech Handlers enquiry: ${lead.service_interest || "General"}`, lead_id: job.lead_id }), signal: AbortSignal.timeout(5_000) });
      if (!response.ok) throw new Error(`Notification provider returned ${response.status}`);
      await db("rpc/complete_lead_notification", { body: { p_id: job.id, p_token: job.claim_token, p_sent: true, p_error: null } });
      sent++;
    } catch (error) {
      await db("rpc/complete_lead_notification", { body: { p_id: job.id, p_token: job.claim_token, p_sent: false, p_error: error.message.slice(0, 200) } });
    }
  }
  return { processed: (jobs || []).length, sent };
}
