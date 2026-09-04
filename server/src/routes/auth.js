import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { query } from "../lib/db.js";
import {
  signAccess,
  signRefresh,
  verifyRefresh,
  refreshCookieOpts,
} from "../lib/jwt.js";
import { requireAuth } from "../middleware/auth.js";

const r = Router();
const Login = z.object({ email: z.string().email(), password: z.string().min(1) });

r.post("/login", async (req, res) => {
  const p = Login.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: "Invalid input" });
  const { email, password } = p.data;
  const { rows } = await query(
    "SELECT id, email, encrypted_password, name, metadata FROM app_users WHERE lower(email) = lower($1) LIMIT 1",
    [email]
  );
  const u = rows[0];
  if (!u || !u.encrypted_password)
    return res.status(401).json({ error: "Invalid credentials" });
  const ok = await bcrypt.compare(password, u.encrypted_password);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });
  const access = signAccess({ sub: u.id, email: u.email });
  const refresh = signRefresh({ sub: u.id });
  res.cookie("rt", refresh, refreshCookieOpts());
  res.json({
    access_token: access,
    user: { id: u.id, email: u.email, name: u.name, metadata: u.metadata },
  });
});

r.post("/refresh", async (req, res) => {
  const t = req.cookies?.rt;
  if (!t) return res.status(401).json({ error: "No refresh" });
  try {
    const { sub } = verifyRefresh(t);
    const { rows } = await query(
      "SELECT id, email, name, metadata FROM app_users WHERE id = $1",
      [sub]
    );
    if (!rows[0]) return res.status(401).json({ error: "User gone" });
    const access = signAccess({ sub: rows[0].id, email: rows[0].email });
    res.json({ access_token: access, user: rows[0] });
  } catch {
    return res.status(401).json({ error: "Invalid refresh" });
  }
});

r.post("/logout", (req, res) => {
  res.clearCookie("rt", { ...refreshCookieOpts(), maxAge: 0 });
  res.json({ ok: true });
});

r.get("/me", requireAuth, async (req, res) => {
  const { rows } = await query(
    "SELECT id, email, name, metadata FROM app_users WHERE id = $1",
    [req.user.sub]
  );
  if (!rows[0]) return res.status(404).json({ error: "Not found" });
  res.json({ user: rows[0] });
});

export default r;