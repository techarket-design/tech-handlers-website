import { database, deliverNotifications, LeadError, rateKey, validateLead } from "../server/leads.mjs";
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ error: "Method not allowed" }); }
  const origin = req.headers.origin;
  const allowed = new Set(["https://www.techhandlers.in", "https://techhandlers.in"]);
  if (process.env.VERCEL_URL) allowed.add(`https://${process.env.VERCEL_URL}`);
  if (process.env.LEAD_ALLOWED_ORIGIN) allowed.add(process.env.LEAD_ALLOWED_ORIGIN);
  if (origin && !allowed.has(origin)) return res.status(403).json({ error: "Invalid origin" });
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const lead = validateLead(body);
    const result = await database("rpc/submit_website_lead", { body: { p_lead: lead, p_rate_key: rateKey(req) } });
    // Saving and queuing are atomic. Email delivery failure never loses the enquiry.
    let notification = "pending";
    try { const delivery = await deliverNotifications(result.id); if (delivery.sent) notification = "sent"; } catch { console.error("Lead notification remains queued"); }
    return res.status(result.duplicate ? 200 : 201).json({ id: result.id, notification });
  } catch (error) {
    if (error instanceof SyntaxError) return res.status(400).json({ error: "Invalid submission" });
    if (error instanceof LeadError) return res.status(error.status).json({ error: error.message });
    console.error("Lead submission failed", error.message);
    return res.status(503).json({ error: "We couldn't save your enquiry. Please try again or email us directly." });
  }
}
