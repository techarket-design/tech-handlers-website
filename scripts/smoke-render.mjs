import assert from "node:assert/strict";
import { loadPage, readContent } from "../server/content.mjs";
import { render } from "../dist-server/entry-server.js";
import { loadEnv } from "vite";
Object.assign(process.env, loadEnv("production", process.cwd(), "VITE_"));
const [blogs, cases, cities] = await Promise.all([
  readContent("blog_posts", { select: "slug", is_published: "eq.true", limit: "1" }),
  readContent("portfolio", { select: "slug", is_active: "eq.true", limit: "1" }),
  readContent("city_pages", { select: "slug", is_published: "eq.true", limit: "1" }),
]);
const paths = ["/", "/about", "/blog", "/case-studies", "/services/seo", ...blogs.map(b => `/blog/${b.slug}`), ...cases.map(c => `/case-studies/${c.slug}`), ...cities.map(c => `/locations/${c.slug}`), "/blog/this-slug-does-not-exist", "/missing-route"];
for (const path of paths) {
  const page = await loadPage(path);
  const result = await render(path, page.seed);
  assert.match(result.body, /<h1[ >]/);
  assert.match(result.head, /<title/);
  if (path.includes("does-not-exist") || path === "/missing-route") { assert.equal(page.status, 404); assert.match(result.head, /noindex/); }
  else { assert.equal(page.status, 200); assert.ok(result.head.includes(`href="https://www.techhandlers.in${path === "/" ? "/" : path}"`), `Canonical mismatch: ${path}`); }
  console.log(`${page.status} ${path}: route title, heading and canonical verified (${Math.round(result.body.length / 1024)} KB HTML)`);
}
