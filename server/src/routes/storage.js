import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { requireAuth } from "../middleware/auth.js";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "/var/www/techhandlers/uploads";
const PUBLIC_BASE = process.env.UPLOAD_PUBLIC_BASE || "/uploads";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

const r = Router();

r.post("/upload", requireAuth, upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file" });
  const requested = req.file.originalname || "file";
  const ext = path.extname(requested) || "";
  const safe = `${Date.now()}-${randomUUID()}${ext}`;
  const dest = path.join(UPLOAD_DIR, safe);
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, req.file.buffer);
  res.json({ path: safe, public_url: `${PUBLIC_BASE.replace(/\/$/, "")}/${safe}` });
});

r.delete("/file/:name", requireAuth, async (req, res) => {
  const name = path.basename(req.params.name); // prevent traversal
  const target = path.join(UPLOAD_DIR, name);
  try { await fs.unlink(target); } catch {}
  res.json({ ok: true });
});

export default r;