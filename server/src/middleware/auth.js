import { verifyAccess } from "../lib/jwt.js";
import { query } from "../lib/db.js";

export function requireAuth(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing token" });
  try {
    req.user = verifyAccess(token);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

export async function hasRole(userId, role) {
  const { rows } = await query(
    "SELECT 1 FROM user_roles WHERE user_id = $1 AND role = $2 LIMIT 1",
    [userId, role]
  );
  return rows.length > 0;
}

export async function hasPermission(userId, module) {
  if (await hasRole(userId, "admin")) return true;
  const { rows } = await query(
    "SELECT 1 FROM user_permissions WHERE user_id = $1 AND module = $2 LIMIT 1",
    [userId, module]
  );
  return rows.length > 0;
}

export const requireRole = (role) => async (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: "Unauthenticated" });
  if (!(await hasRole(req.user.sub, role)))
    return res.status(403).json({ error: "Forbidden" });
  next();
};

export const requirePermission = (mod) => async (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: "Unauthenticated" });
  if (!(await hasPermission(req.user.sub, mod)))
    return res.status(403).json({ error: "Forbidden" });
  next();
};