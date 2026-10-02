import http from "node:http";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { loadEnv } from "vite";
Object.assign(process.env, loadEnv("production", process.cwd(), ""));
const { default: render } = await import("../api/render.mjs");
const { default: sitemap } = await import("../api/sitemap.mjs");
const { default: leads } = await import("../api/leads.mjs");
const root = path.resolve("dist");
const types = { ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon", ".pdf": "application/pdf", ".xml": "application/xml" };
http.createServer(async (req, res) => {
  res.status = code => { res.statusCode = code; return res; };
  res.send = value => res.end(value);
  res.json = value => { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(value)); };
  try {
    const url = new URL(req.url, "http://localhost");
    req.query = { path: url.pathname.slice(1) };
    if (/^\/sitemap(?:-(?:pages|(?:blog|projects|locations)-\d+))?\.xml$/.test(url.pathname) || url.pathname === '/feed.xml') return await sitemap(req, res);
    if (url.pathname === "/api/leads") {
      let body = "";
      for await (const chunk of req) { body += chunk; if (body.length > 16000) return res.status(413).json({ error: "Submission too long" }); }
      req.body = body;
      return await leads(req, res);
    }
    if (["/privacy", "/terms", "/cookies"].includes(url.pathname)) { res.statusCode = 308; res.setHeader("Location", {"/privacy":"/privacy-policy","/terms":"/terms-of-service","/cookies":"/cookie-policy"}[url.pathname]); return res.end(); }
    const file = path.resolve(root, "." + decodeURIComponent(url.pathname));
    if (file.startsWith(root + path.sep) && url.pathname !== "/" && !url.pathname.startsWith("/admin")) {
      try { const data = await readFile(file); res.setHeader("Content-Type", types[path.extname(file)] || "application/octet-stream"); return res.end(data); } catch { /* Route renderer handles missing assets */ }
    }
    if (url.pathname.startsWith("/admin")) { res.setHeader("Content-Type", "text/html"); res.setHeader("X-Robots-Tag", "noindex"); return res.end(await readFile(path.join(root, "index.html"))); }
    return await render(req, res);
  } catch (error) { console.error(error.message); res.statusCode = 500; res.end("Preview unavailable"); }
}).listen(Number(process.env.PORT || 4173), "127.0.0.1", () => console.log("SSR preview: http://127.0.0.1:" + (process.env.PORT || 4173)));
