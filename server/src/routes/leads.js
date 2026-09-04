import { Router } from "express";
import { z } from "zod";
import { query } from "../lib/db.js";

const r = Router();

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
r.post("/", async (req, res) => {
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