import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { query, tx } from "../lib/db.js";
import { requireAuth, hasRole } from "../middleware/auth.js";

const r = Router();
r.use(requireAuth);

// GET /api/team/members  — list all team members (admin or team can view)
r.get("/members", async (req, res) => {
  const adm = await hasRole(req.user.sub, "admin");
  const team = await hasRole(req.user.sub, "team");
  if (!adm && !team) return res.status(403).json({ error: "Forbidden" });

  const { rows } = await query(`
    SELECT ur.user_id, ur.role, u.email, u.name
    FROM user_roles ur
    LEFT JOIN app_users u ON u.id = ur.user_id
    ORDER BY ur.created_at ASC
  `);
  res.json(rows);
});

// POST /api/team/members  — admin creates a new user
const Create = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["admin", "team"]),
  name: z.string().optional(),
  permissions: z.array(z.string()).optional(),
});
r.post("/members", async (req, res) => {
  if (!(await hasRole(req.user.sub, "admin")))
    return res.status(403).json({ error: "Admin only" });
  const p = Create.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.flatten().fieldErrors });
  const { email, password, role, name, permissions = [] } = p.data;

  try {
    const out = await tx(async (c) => {
      const exists = await c.query("SELECT 1 FROM app_users WHERE lower(email)=lower($1)", [email]);
      if (exists.rows.length) throw new Error("Email already exists");

      const id = randomUUID();
      const hash = await bcrypt.hash(password, 10);
      await c.query(
        "INSERT INTO app_users (id, email, encrypted_password, name, metadata) VALUES ($1,$2,$3,$4,$5)",
        [id, email.toLowerCase(), hash, name || null, { name: name || null }]
      );
      await c.query("INSERT INTO user_roles (user_id, role) VALUES ($1,$2)", [id, role]);
      if (role === "team" && permissions.length) {
        for (const m of permissions)
          await c.query("INSERT INTO user_permissions (user_id, module) VALUES ($1,$2)", [id, m]);
      }
      return { user_id: id, role };
    });
    res.json(out);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// POST /api/team/change-password  — admin resets, or self changes
const Change = z.object({
  user_id: z.string().uuid().optional(),
  new_password: z.string().min(6),
});
r.post("/change-password", async (req, res) => {
  const p = Change.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.flatten().fieldErrors });
  const target = p.data.user_id || req.user.sub;
  if (target !== req.user.sub && !(await hasRole(req.user.sub, "admin")))
    return res.status(403).json({ error: "Admin only" });
  const hash = await bcrypt.hash(p.data.new_password, 10);
  await query("UPDATE app_users SET encrypted_password = $1 WHERE id = $2", [hash, target]);
  res.json({ ok: true });
});

export default r;