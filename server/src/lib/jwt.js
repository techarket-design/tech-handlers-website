import jwt from "jsonwebtoken";

const ACCESS_TTL = "15m";
const REFRESH_TTL = "30d";

export const signAccess = (payload) =>
  jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: ACCESS_TTL });

export const signRefresh = (payload) =>
  jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_TTL });

export const verifyAccess = (t) => jwt.verify(t, process.env.JWT_ACCESS_SECRET);
export const verifyRefresh = (t) => jwt.verify(t, process.env.JWT_REFRESH_SECRET);

export const refreshCookieOpts = () => ({
  httpOnly: true,
  secure: process.env.COOKIE_SECURE !== "false",
  sameSite: "lax",
  domain: process.env.COOKIE_DOMAIN || undefined,
  path: "/api/auth",
  maxAge: 30 * 24 * 60 * 60 * 1000,
});