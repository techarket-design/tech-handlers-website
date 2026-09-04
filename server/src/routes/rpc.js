import { Router } from "express";
import { query } from "../lib/db.js";
import { verifyAccess } from "../lib/jwt.js";

const r = Router();

r.use((req, _res, next) => {
  const h = req.headers.authorization || "";
  const t = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (t) try { req.user = verifyAccess(t); } catch {}
  next();
});

r.post("/next_invoice_number", async (_req, res) => {
  const { rows } = await query("SELECT next_invoice_number() AS n");
  res.json(rows[0].n);
});

r.post("/has_role", async (req, res) => {
  const uid = req.body?._user_id || req.user?.sub;
  const role = req.body?._role;
  if (!uid || !role) return res.json(false);
  const { rows } = await query("SELECT has_role($1,$2) AS ok", [uid, role]);
  res.json(rows[0].ok);
});

r.post("/has_permission", async (req, res) => {
  const uid = req.body?._user_id || req.user?.sub;
  const mod = req.body?._module;
  if (!uid || !mod) return res.json(false);
  const { rows } = await query("SELECT has_permission($1,$2) AS ok", [uid, mod]);
  res.json(rows[0].ok);
});

export default r;