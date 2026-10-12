import { Router } from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { query } from "../lib/db.js";

const r = Router();

// Layer 3: IP Rate Limiting (max 5 submissions per 15 minutes per IP)
const leadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many inquiries submitted from this IP. Please try again later." },
});

const Lead = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(50).optional(),
  company: z.string().max(200).optional(),
  website_url: z.string().max(500).optional(),
  budget: z.string().max(100).optional(),
  service_interest: z.string().max(200).optional(),
  message: z.string().max(5000).optional(),
  source: z.string().max(100).optional(),
}).passthrough();

// Public lead submission — mirrors the public INSERT policy on `leads`.
r.post("/", leadLimiter, async (req, res) => {
  // 1. Honeypot check: silently drop bots faking success
  if (req.body.hp_company_website || req.body.hp_secondary_phone || req.body._gotcha) {
    return res.json({ id: "dropped", ok: true });
  }

  // 2. URL spam check in name or phone
  const name = String(req.body.name || "");
  const phone = String(req.body.phone || "");
  const urlPattern = /(?:https?:\/\/|www\.|<[^>]+>)/i;
  if (urlPattern.test(name) || (phone && urlPattern.test(phone))) {
    return res.json({ id: "dropped", ok: true });
  }

  // 3. Optional Cloudflare Turnstile verification (Layer 2)
  if (process.env.TURNSTILE_SECRET_KEY) {
    const token = req.body.turnstile_token;
    if (!token) return res.status(400).json({ error: "Missing Turnstile verification token" });
    try {
      const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: process.env.TURNSTILE_SECRET_KEY,
          response: token,
          remoteip: req.ip,
        }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyData.success) {
        return res.status(400).json({ error: "Turnstile verification failed" });
      }
    } catch (e) {
      console.error("[Turnstile] Verification error:", e);
    }
  }

  const p = Lead.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.flatten().fieldErrors });
  const data = p.data;

  const cols = Object.keys(data).filter(k => data[k] !== "" && data[k] != null);
  const vals = cols.map((_, i) => `$${i + 1}`);
  const sql = `INSERT INTO leads (${cols.map(c => `"${c}"`).join(",")}) VALUES (${vals.join(",")}) RETURNING id`;
  try {
    const { rows } = await query(sql, cols.map(c => data[c]));

    if (process.env.FORMSPREE_URL) {
      // Fire-and-forget — don't block response
      fetch(process.env.FORMSPREE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data),
      }).catch(() => {});
    }

    res.json({ id: rows[0].id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default r;