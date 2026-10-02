import { render } from "../dist-server/entry-server.js";
import template from "../dist-server/template.mjs";
import { loadPage, safeJson } from "../server/content.mjs";
export default async function handler(req, res) {
  if (!["GET", "HEAD"].includes(req.method)) return res.status(405).end();
  const path = "/" + String(req.query.path || "").replace(/^\/+|\/+$/g, "");
  try {
    const { seed, status } = await loadPage(path);
    const { body, head } = await render(path, seed);
    const html = template.replace("<!--app-head-->", () => head).replace("<!--app-html-->", () => body).replace("<!--app-data-->", () => `<script id="public-query-data" type="application/json">${safeJson(seed)}</script>`);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
    res.setHeader("Vercel-CDN-Cache-Control", status === 200 ? "public, s-maxage=30, must-revalidate" : "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    if (status !== 200) res.setHeader("X-Robots-Tag", "noindex");
    res.status(status);
    return req.method === "HEAD" ? res.end() : res.send(html);
  } catch (error) {
    console.error("Public render failed", error.message);
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Robots-Tag", "noindex");
    return res.status(503).send("<!doctype html><html lang=\"en\"><title>Temporarily unavailable | Tech Handlers</title><h1>We’ll be back shortly</h1><p>Please try again in a moment.</p></html>");
  }
}
