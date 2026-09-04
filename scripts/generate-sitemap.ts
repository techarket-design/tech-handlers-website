import { writeFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://techhandlers.in";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/services/digital-marketing", changefreq: "monthly", priority: "0.7" },
  { path: "/services/performance-marketing", changefreq: "monthly", priority: "0.7" },
  { path: "/services/web-development", changefreq: "monthly", priority: "0.7" },
  { path: "/services/linkedin-automation", changefreq: "monthly", priority: "0.7" },
  { path: "/services/seo", changefreq: "monthly", priority: "0.7" },
  { path: "/services/social-media-marketing", changefreq: "monthly", priority: "0.7" },
  { path: "/about", changefreq: "monthly", priority: "0.6" },
  { path: "/blog", changefreq: "weekly", priority: "0.8" },
  { path: "/case-studies", changefreq: "weekly", priority: "0.8" },
  { path: "/privacy-policy", changefreq: "yearly", priority: "0.3" },
  { path: "/terms-of-service", changefreq: "yearly", priority: "0.3" },
  { path: "/refund-policy", changefreq: "yearly", priority: "0.3" },
  { path: "/cookie-policy", changefreq: "yearly", priority: "0.3" },
];

async function fetchBlogPosts(): Promise<SitemapEntry[]> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn("Supabase credentials not found, skipping dynamic blog entries");
    return [];
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase
    .from("blog_posts")
    .select("slug, updated_at")
    .eq("is_published", true)
    .order("updated_at", { ascending: false });

  if (error) {
    console.warn("Failed to fetch blog posts:", error.message);
    return [];
  }

  return (data || []).map((post: any) => ({
    path: `/blog/${post.slug}`,
    lastmod: post.updated_at ? new Date(post.updated_at).toISOString().split("T")[0] : undefined,
    changefreq: "monthly",
    priority: "0.6",
  }));
}

async function fetchCaseStudies(): Promise<SitemapEntry[]> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !supabaseKey) return [];
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase
    .from("portfolio")
    .select("slug, updated_at")
    .eq("is_active", true)
    .order("updated_at", { ascending: false });
  if (error) {
    console.warn("Failed to fetch case studies:", error.message);
    return [];
  }
  return (data || []).map((p: any) => ({
    path: `/case-studies/${p.slug}`,
    lastmod: p.updated_at ? new Date(p.updated_at).toISOString().split("T")[0] : undefined,
    changefreq: "monthly",
    priority: "0.7",
  }));
}

async function fetchCityPages(): Promise<SitemapEntry[]> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !supabaseKey) return [];
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase
    .from("city_pages")
    .select("slug, updated_at")
    .eq("is_published", true);
  if (error) {
    console.warn("Failed to fetch city pages:", error.message);
    return [];
  }
  return (data || []).map((p: any) => ({
    path: `/locations/${p.slug}`,
    lastmod: p.updated_at ? new Date(p.updated_at).toISOString().split("T")[0] : undefined,
    changefreq: "monthly",
    priority: "0.8",
  }));
}

function generateSitemap(entries: SitemapEntry[]) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n")
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

async function main() {
  const [blogEntries, caseEntries, cityEntries] = await Promise.all([
    fetchBlogPosts(),
    fetchCaseStudies(),
    fetchCityPages(),
  ]);
  const allEntries = [...staticEntries, ...blogEntries, ...caseEntries, ...cityEntries];
  const sitemap = generateSitemap(allEntries);
  writeFileSync(resolve("public/sitemap.xml"), sitemap);
  console.log(`sitemap.xml written (${allEntries.length} entries, ${blogEntries.length} blog, ${caseEntries.length} case studies, ${cityEntries.length} city pages)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
