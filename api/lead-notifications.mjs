import { timingSafeEqual } from "node:crypto";
import { database, deliverNotifications } from "../server/leads.mjs";
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (!["GET", "POST"].includes(req.method)) return res.status(405).end();
  const expected = process.env.CRON_SECRET && `Bearer ${process.env.CRON_SECRET}`;
  const received = String(req.headers.authorization || "");
  if (req.method === "GET") {
    if (!expected || received.length !== expected.length || !timingSafeEqual(Buffer.from(received), Buffer.from(expected))) return res.status(401).end();
  } else {
    try {
      const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
      const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      if (!received.startsWith("Bearer ") || !url || !key) return res.status(401).end();
      const response = await fetch(`${url}/auth/v1/user`, { headers: { apikey: key, Authorization: received }, signal: AbortSignal.timeout(5_000) });
      if (!response.ok) return res.status(401).end();
      const user = await response.json();
      const admin = await database("rpc/has_role", { body: { _user_id: user.id, _role: "admin" } });
      if (!admin) return res.status(403).end();
    } catch { return res.status(503).json({ error: "Could not verify admin access" }); }
  }
  try {
    const end = Date.now() + 30_000;
    const total = { processed: 0, sent: 0 };
    do {
      const batch = await deliverNotifications();
      total.processed += batch.processed; total.sent += batch.sent;
      if (!batch.processed) break;
    } while (Date.now() < end && total.processed < 100);
    return res.status(200).json(total);
  } catch { return res.status(503).json({ error: "Notification retry failed" }); }
}
