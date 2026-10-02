import { discoverySitemap, blogFeed } from "../server/discovery.mjs";
export default async function handler(req, res) {
  if (!["GET", "HEAD"].includes(req.method)) return res.status(405).end();
  try {
    const path = String(req.query.path || 'sitemap.xml');
    const match = path.match(/^sitemap-(blog|projects|locations)-(\d+)\.xml$/);
    const body = path === 'feed.xml' ? await blogFeed() : path === 'sitemap.xml' ? await discoverySitemap() : path === 'sitemap-pages.xml' ? await discoverySitemap('pages') : match ? await discoverySitemap(match[1], Number(match[2])) : null;
    if (body === null) return res.status(404).end();
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
    res.setHeader("Vercel-CDN-Cache-Control", "public, s-maxage=30, must-revalidate");
    return req.method === "HEAD" ? res.status(200).end() : res.status(200).send(body);
  } catch {
    res.setHeader("Cache-Control", "no-store");
    return res.status(503).send("Sitemap temporarily unavailable");
  }
}
