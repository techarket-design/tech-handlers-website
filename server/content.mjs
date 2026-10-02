export const SITE_URL = "https://www.techhandlers.in";
export const STATIC_PATHS = ["/", "/about", "/blog", "/case-studies", "/services/digital-marketing", "/services/performance-marketing", "/services/web-development", "/services/linkedin-automation", "/services/seo", "/services/social-media-marketing", "/privacy-policy", "/terms-of-service", "/refund-policy", "/cookie-policy"];
export const BLOG_FIELDS = "id,title,slug,excerpt,featured_image_url,author_name,category,tags,meta_title,meta_description,published_at,created_at,updated_at,is_published";
export function safeJson(value) { return JSON.stringify(value).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029"); }
export function xml(value) { return String(value).replace(/[<>&"']/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[c]); }
export function routeInfo(path) {
  if (STATIC_PATHS.includes(path)) return { kind: "static", path };
  const match = path.match(/^\/(blog|case-studies|locations)\/([^/]+)$/);
  if (!match) return { kind: "missing", path };
  let slug;
  try { slug = decodeURIComponent(match[2]); } catch { return { kind: "missing", path }; }
  if (slug.length > 200 || /[\x00-\x1f/\\]/.test(slug)) return { kind: "missing", path };
  return { kind: match[1], path, slug };
}
export async function readContent(table, params = {}, fetcher = fetch) {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Public content configuration is missing");
  const query = new URLSearchParams({ select: "*", ...params });
  const response = await fetcher(`${url}/rest/v1/${table}?${query}`, { headers: { apikey: key, Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(8_000) });
  if (!response.ok) throw new Error(`Content read failed: ${table} (${response.status})`);
  return response.json();
}
export async function loadPage(path, read = readContent) {
  const route = routeInfo(path);
  const seed = [];
  if (route.kind === "missing") return { seed, status: 404 };
  const add = (key, data) => { seed.push({ key, data }); return data; };
  const common = [["nav_links", { is_active: true }], ["footer_links", { is_active: true }], ["trust_badges", { is_enabled: true }]];
  await Promise.all([
    read("site_settings", { limit: "1" }).then(rows => add(["site_settings"], rows[0] || null)),
    ...common.map(([table, filter]) => read(table, { ...Object.fromEntries(Object.entries(filter).map(([k, v]) => [k, `eq.${v}`])), order: "sort_order.asc", limit: "100" }).then(rows => add([table, filter], rows))),
  ]);
  if (route.kind === "missing") return { seed, status: 404 };
  let status = 200;
  if (["blog", "case-studies", "locations"].includes(route.kind)) {
    const table = { blog: "blog_posts", "case-studies": "portfolio", locations: "city_pages" }[route.kind];
    const flag = table === "portfolio" ? "is_active" : "is_published";
    const rows = await read(table, { slug: `eq.${route.slug}`, [flag]: "eq.true", limit: "1" });
    const item = rows[0] || null;
    if (!item) status = 404;
    if (route.kind === "blog") add(["blog_post", route.slug], item);
    if (route.kind === "case-studies") {
      add(["case_study", route.slug], item);
      if (item) add(["case_studies_related", item.id], await read("portfolio", { is_active: "eq.true", id: `neq.${item.id}`, select: "id,slug,title,client_name,short_description,hero_image_url,image_url,category", order: "sort_order.asc", limit: "3" }));
    }
    if (route.kind === "locations") add(["city_pages", { slug: route.slug, is_published: true }], rows);
  }
  if (path === "/blog" || route.kind === "blog") add(["blog_posts", { is_published: true }], await read("blog_posts", { is_published: "eq.true", select: BLOG_FIELDS, order: "created_at.desc", limit: "100" }));
  if (path === "/case-studies") add(["portfolio", { is_active: true }], await read("portfolio", { is_active: "eq.true", order: "sort_order.asc", limit: "100" }));
  if (["/privacy-policy", "/terms-of-service", "/refund-policy", "/cookie-policy"].includes(path)) {
    const slug = path.slice(1);
    const rows = await read("legal_pages", { slug: `eq.${slug}`, is_published: "eq.true", limit: "1" });
    add(["legal_page", slug], rows[0] || null);
    if (!rows.length) status = 404;
  }
  if (path === "/") {
    const tables = ["hero_slides", "services", "portfolio", "brands", "testimonials", "faqs", "metrics", "process_steps", "why_us_reasons", "revenue_engine_segments", "social_posts", "platform_logos", "video_showcase_items"];
    await Promise.all([
      ...tables.map(table => read(table, { is_active: "eq.true", order: "sort_order.asc", limit: "30" }).then(rows => add([table, { is_active: true }], rows))),
      read("homepage_sections", { order: "sort_order.asc", limit: "30" }).then(rows => add(["homepage_sections", undefined], rows)),
    ]);
  }
  return { seed, status };
}
export async function sitemap(read = readContent) {
  const all = async (table, params) => {
    const rows = [];
    for (let offset = 0; offset < 15000; offset += 500) {
      const batch = await read(table, { ...params, limit: "500", offset: String(offset) });
      rows.push(...batch);
      if (batch.length < 500) return rows;
    }
    throw new Error("Split the sitemap before publishing more than 15,000 items in one collection");
  };
  const groups = await Promise.all([
    all("blog_posts", { select: "slug,updated_at,noindex,canonical_url", is_published: "eq.true", order: "slug.asc" }),
    all("portfolio", { select: "slug,updated_at", is_active: "eq.true", order: "slug.asc" }),
    all("city_pages", { select: "slug,updated_at", is_published: "eq.true", order: "slug.asc" }),
  ]);
  const legal = await read("legal_pages", { select: "slug", is_published: "eq.true", limit: "10" });
  const legalPaths = ["/privacy-policy", "/terms-of-service", "/refund-policy", "/cookie-policy"];
  const entries = STATIC_PATHS.filter(path => !legalPaths.includes(path) || legal.some(row => `/${row.slug}` === path)).map(path => ({ path }));
  groups.forEach((rows, i) => rows.filter(row => !row.noindex).forEach(row => {
    const path = `/${["blog", "case-studies", "locations"][i]}/${encodeURIComponent(row.slug)}`;
    if (!row.slug || routeInfo(path).kind === "missing") return;
    if (row.canonical_url && row.canonical_url.replace(/\/$/, "") !== `${SITE_URL}${path}`) return;
    entries.push({ path, updated: row.updated_at });
  }));
  return '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + entries.map(e => `<url><loc>${xml(SITE_URL + e.path)}</loc>${e.updated && Number.isFinite(Date.parse(e.updated)) ? `<lastmod>${new Date(e.updated).toISOString()}</lastmod>` : ""}</url>`).join("") + "</urlset>";
}
