import { sitemap } from "../server/content.mjs";
export default async function handler(req, res) {
  if (!["GET", "HEAD"].includes(req.method)) return res.status(405).end();
  try {
    const body = await sitemap();
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
    res.setHeader("Vercel-CDN-Cache-Control", "public, s-maxage=30, must-revalidate");
    return req.method === "HEAD" ? res.status(200).end() : res.status(200).send(body);
  } catch {
    res.setHeader("Cache-Control", "no-store");
    return res.status(503).send("Sitemap temporarily unavailable");
  }
}
