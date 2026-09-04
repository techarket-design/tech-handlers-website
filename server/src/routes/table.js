import { Router } from "express";
import { query } from "../lib/db.js";
import { requireAuth, hasRole, hasPermission } from "../middleware/auth.js";

// Whitelist + per-table access rules mirroring the original RLS policies.
// read: who can SELECT.  write: who can INSERT/UPDATE/UPSERT.  del: who can DELETE.
// "public" = no auth required.
const PUBLIC_READ_ADMIN_WRITE = {
  read: "public",
  write: { role: "admin" },
  del: { role: "admin" },
};
const ADMIN_ONLY = {
  read: { role: "admin" },
  write: { role: "admin" },
  del: { role: "admin" },
};
const PERM = (mod) => ({
  read: { perm: mod },
  write: { perm: mod },
  del: { perm: mod },
});
const OWN = (col = "user_id") => ({
  read: { own: col },
  write: { own: col },
  del: { own: col },
});

const TABLES = {
  // public-read CMS
  blog_posts: PUBLIC_READ_ADMIN_WRITE,
  brands: PUBLIC_READ_ADMIN_WRITE,
  faqs: PUBLIC_READ_ADMIN_WRITE,
  footer_links: PUBLIC_READ_ADMIN_WRITE,
  hero_slides: PUBLIC_READ_ADMIN_WRITE,
  homepage_sections: PUBLIC_READ_ADMIN_WRITE,
  metrics: PUBLIC_READ_ADMIN_WRITE,
  nav_links: PUBLIC_READ_ADMIN_WRITE,
  platform_logos: PUBLIC_READ_ADMIN_WRITE,
  portfolio: PUBLIC_READ_ADMIN_WRITE,
  process_steps: PUBLIC_READ_ADMIN_WRITE,
  revenue_engine_segments: PUBLIC_READ_ADMIN_WRITE,
  services: PUBLIC_READ_ADMIN_WRITE,
  testimonials: PUBLIC_READ_ADMIN_WRITE,
  tracking_scripts: PUBLIC_READ_ADMIN_WRITE,
  why_us_reasons: PUBLIC_READ_ADMIN_WRITE,
  site_settings: { read: "public", write: { role: "admin" }, del: false },

  // admin-only CRM
  leads: ADMIN_ONLY,
  lead_activities: ADMIN_ONLY,
  user_roles: ADMIN_ONLY,
  user_permissions: ADMIN_ONLY,

  // permission-gated
  customers: PERM("customers"),
  customer_team_allocations: PERM("customers"),
  invoices: PERM("billing"),
  invoice_line_items: PERM("billing"),
  payments: PERM("billing"),
  task_projects: PERM("tasks"),
  tasks: PERM("tasks"),
  task_assignees: PERM("tasks"),
  task_comments: PERM("tasks"),
  task_activities: PERM("tasks"),

  // per-user
  notifications: OWN("user_id"),
  personal_notes: OWN("user_id"),
  personal_todos: OWN("user_id"),
  personal_bookmarks: OWN("user_id"),
};

const TABLE_NAME = /^[a-z_][a-z0-9_]*$/;

async function check(rule, req) {
  if (rule === "public") return true;
  if (!req.user) return false;
  if (rule.role) return hasRole(req.user.sub, rule.role);
  if (rule.perm) return hasPermission(req.user.sub, rule.perm);
  if (rule.own) return true; // own-row enforced via WHERE clause below
  return false;
}

const router = Router();

// Optional auth — populate req.user when token present, but don't reject.
import { verifyAccess } from "../lib/jwt.js";
router.use((req, _res, next) => {
  const h = req.headers.authorization || "";
  const t = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (t) try { req.user = verifyAccess(t); } catch {}
  next();
});

function ownFilter(rule, req, params, where) {
  if (rule.own) {
    params.push(req.user.sub);
    where.push(`"${rule.own}" = $${params.length}`);
  }
}

// LIST
router.get("/:table", async (req, res) => {
  const t = req.params.table;
  const cfg = TABLES[t];
  if (!cfg || !TABLE_NAME.test(t)) return res.status(404).json({ error: "Unknown table" });
  if (!(await check(cfg.read, req))) return res.status(403).json({ error: "Forbidden" });

  const params = [];
  const where = [];
  for (const [k, v] of Object.entries(req.query)) {
    if (k === "order" || k === "limit") continue;
    if (!/^[a-z_][a-z0-9_]*$/.test(k)) continue;
    params.push(v);
    where.push(`"${k}" = $${params.length}`);
  }
  ownFilter(cfg.read, req, params, where);

  let sql = `SELECT * FROM "${t}"`;
  if (where.length) sql += ` WHERE ${where.join(" AND ")}`;
  if (req.query.order && /^[a-z_][a-z0-9_]*\.(asc|desc)$/i.test(req.query.order)) {
    const [c, dir] = req.query.order.split(".");
    sql += ` ORDER BY "${c}" ${dir.toUpperCase()}`;
  }
  if (req.query.limit && /^\d+$/.test(req.query.limit)) sql += ` LIMIT ${Math.min(+req.query.limit, 1000)}`;
  else sql += ` LIMIT 1000`;

  try {
    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

function buildInsert(t, payload) {
  const cols = Object.keys(payload);
  const vals = cols.map((_, i) => `$${i + 1}`);
  return {
    sql: `INSERT INTO "${t}" (${cols.map(c => `"${c}"`).join(",")}) VALUES (${vals.join(",")}) RETURNING *`,
    params: cols.map(c => payload[c]),
  };
}

// INSERT
router.post("/:table", async (req, res) => {
  const t = req.params.table;
  const cfg = TABLES[t];
  if (!cfg || !TABLE_NAME.test(t)) return res.status(404).json({ error: "Unknown table" });
  if (!(await check(cfg.write, req))) return res.status(403).json({ error: "Forbidden" });

  const rows = Array.isArray(req.body) ? req.body : [req.body];
  try {
    const out = [];
    for (const row of rows) {
      if (cfg.write.own) row[cfg.write.own] = req.user.sub;
      const { sql, params } = buildInsert(t, row);
      const r = await query(sql, params);
      out.push(r.rows[0]);
    }
    res.json(Array.isArray(req.body) ? out : out[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// UPSERT
router.put("/:table", async (req, res) => {
  const t = req.params.table;
  const cfg = TABLES[t];
  if (!cfg || !TABLE_NAME.test(t)) return res.status(404).json({ error: "Unknown table" });
  if (!(await check(cfg.write, req))) return res.status(403).json({ error: "Forbidden" });

  const rows = Array.isArray(req.body) ? req.body : [req.body];
  try {
    const out = [];
    for (const row of rows) {
      if (cfg.write.own) row[cfg.write.own] = req.user.sub;
      const cols = Object.keys(row);
      const vals = cols.map((_, i) => `$${i + 1}`);
      const updates = cols.filter(c => c !== "id").map(c => `"${c}" = EXCLUDED."${c}"`);
      const sql = `INSERT INTO "${t}" (${cols.map(c => `"${c}"`).join(",")}) VALUES (${vals.join(",")})
                   ON CONFLICT (id) DO UPDATE SET ${updates.join(",")} RETURNING *`;
      const r = await query(sql, cols.map(c => row[c]));
      out.push(r.rows[0]);
    }
    res.json(Array.isArray(req.body) ? out : out[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// UPDATE by id
router.patch("/:table/:id", async (req, res) => {
  const t = req.params.table;
  const cfg = TABLES[t];
  if (!cfg || !TABLE_NAME.test(t)) return res.status(404).json({ error: "Unknown table" });
  if (!(await check(cfg.write, req))) return res.status(403).json({ error: "Forbidden" });

  const cols = Object.keys(req.body);
  if (!cols.length) return res.status(400).json({ error: "Empty body" });
  const sets = cols.map((c, i) => `"${c}" = $${i + 1}`);
  const params = cols.map(c => req.body[c]);
  params.push(req.params.id);
  let sql = `UPDATE "${t}" SET ${sets.join(",")} WHERE id = $${params.length}`;
  if (cfg.write.own) {
    params.push(req.user.sub);
    sql += ` AND "${cfg.write.own}" = $${params.length}`;
  }
  sql += " RETURNING *";
  try {
    const { rows } = await query(sql, params);
    if (!rows[0]) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE by id
router.delete("/:table/:id", async (req, res) => {
  const t = req.params.table;
  const cfg = TABLES[t];
  if (!cfg || !TABLE_NAME.test(t)) return res.status(404).json({ error: "Unknown table" });
  if (cfg.del === false) return res.status(405).json({ error: "Delete not allowed" });
  if (!(await check(cfg.del, req))) return res.status(403).json({ error: "Forbidden" });

  const params = [req.params.id];
  let sql = `DELETE FROM "${t}" WHERE id = $1`;
  if (cfg.del.own) { params.push(req.user.sub); sql += ` AND "${cfg.del.own}" = $2`; }
  try {
    const r = await query(sql, params);
    res.json({ deleted: r.rowCount });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;