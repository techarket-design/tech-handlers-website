import { SITE_URL, STATIC_PATHS, readContent, routeInfo, xml } from './content.mjs';
export const COLLECTIONS = {
  blog: { table: 'blog_posts', flag: 'is_published', prefix: 'blog', fields: 'slug,updated_at,noindex,canonical_url,featured_image_url' },
  projects: { table: 'portfolio', flag: 'is_active', prefix: 'case-studies', fields: 'slug,updated_at,hero_image_url,image_url' },
  locations: { table: 'city_pages', flag: 'is_published', prefix: 'locations', fields: 'slug,updated_at' },
};
export const PAGE_SIZE = 500;
const declaration = '<?xml version="1.0" encoding="UTF-8"?>';
const legalPaths = ['/privacy-policy', '/terms-of-service', '/refund-policy', '/cookie-policy'];
export const validDate = value => value && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : null;
export function publicEntry(row, group) {
  if (!row.slug || row.noindex) return null;
  const path = `/${COLLECTIONS[group].prefix}/${encodeURIComponent(row.slug)}`;
  if (routeInfo(path).kind === 'missing') return null;
  if (row.canonical_url && row.canonical_url.replace(/\/$/, '') !== SITE_URL + path) return null;
  const image = row.featured_image_url || row.hero_image_url || row.image_url;
  return { path, updated: validDate(row.updated_at), image: /^https?:\/\//i.test(image || '') ? image : null };
}
export function urlset(entries) {
  return declaration + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">' + entries.map(entry => `<url><loc>${xml(SITE_URL + entry.path)}</loc>${entry.updated ? `<lastmod>${entry.updated}</lastmod>` : ''}${entry.image ? `<image:image><image:loc>${xml(entry.image)}</image:loc></image:image>` : ''}</url>`).join('') + '</urlset>';
}
export async function countContent(table, flag) {
  const base = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!base || !key) throw new Error('Content configuration missing');
  const response = await fetch(`${base}/rest/v1/${table}?select=id&${flag}=eq.true`, { method: 'HEAD', headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: 'count=exact' }, signal: AbortSignal.timeout(8000) });
  const total = Number(response.headers.get('content-range')?.split('/')[1]);
  if (!response.ok || !Number.isSafeInteger(total) || total < 0) throw new Error('Content count unavailable');
  return total;
}
export async function discoverySitemap(group, page = 1, read = readContent, count = countContent) {
  if (!group) {
    const totals = await Promise.all(Object.entries(COLLECTIONS).map(async ([name, config]) => [name, await count(config.table, config.flag)]));
    const links = ['/sitemap-pages.xml'];
    for (const [name, total] of totals) {
      const shards = Math.ceil(total / PAGE_SIZE);
      if (shards > 15000) throw new Error('Sitemap index capacity exceeded');
      for (let i = 1; i <= shards; i++) links.push(`/sitemap-${name}-${i}.xml`);
    }
    return declaration + '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + links.map(path => `<sitemap><loc>${xml(SITE_URL + path)}</loc></sitemap>`).join('') + '</sitemapindex>';
  }
  if (group === 'pages') {
    const legal = await read('legal_pages', { select: 'slug,updated_at', is_published: 'eq.true', limit: '10' });
    return urlset(STATIC_PATHS.filter(path => !legalPaths.includes(path) || legal.some(row => `/${row.slug}` === path)).map(path => ({ path, updated: validDate(legal.find(row => `/${row.slug}` === path)?.updated_at) })));
  }
  const config = COLLECTIONS[group];
  if (!config || !Number.isSafeInteger(page) || page < 1 || page > 15000) return null;
  const rows = await read(config.table, { select: config.fields, [config.flag]: 'eq.true', order: 'id.asc', limit: String(PAGE_SIZE), offset: String((page - 1) * PAGE_SIZE) });
  return urlset(rows.map(row => publicEntry(row, group)).filter(Boolean));
}
export async function blogFeed(read = readContent) {
  const rows = await read('blog_posts', { select: 'title,slug,excerpt,published_at,updated_at,noindex,canonical_url', is_published: 'eq.true', order: 'published_at.desc.nullslast', limit: '50' });
  return declaration + '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>Tech Handlers Insights</title><link>' + SITE_URL + '/blog</link><description>Digital marketing, web development and SEO insights from Tech Handlers.</description><language>en</language><atom:link href="' + SITE_URL + '/feed.xml" rel="self" type="application/rss+xml"/>' + rows.map(row => {
    const entry = publicEntry(row, 'blog');
    if (!entry) return '';
    const date = validDate(row.published_at);
    return `<item><title>${xml(row.title)}</title><link>${xml(SITE_URL + entry.path)}</link><guid isPermaLink="true">${xml(SITE_URL + entry.path)}</guid><description>${xml(row.excerpt || '')}</description>${date ? `<pubDate>${new Date(date).toUTCString()}</pubDate>` : ''}</item>`;
  }).join('') + '</channel></rss>';
}
