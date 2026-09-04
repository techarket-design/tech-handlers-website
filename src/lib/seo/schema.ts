/**
 * Shared JSON-LD structured data builders.
 * Every public page should ship at least one schema so search engines can
 * understand the content without guessing from the DOM.
 */

export const SITE_URL = "https://techhandlers.in";
export const SITE_NAME = "Tech Handlers";

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: SITE_URL,
  telephone: "+91-92160-35795",
  email: "hello@techhandlers.in",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Gurgaon",
    addressRegion: "Haryana",
    addressCountry: "IN",
  },
} as const;

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

export function faqSchema(faqs: { question: string; answer: string }[]) {
  const valid = (faqs || []).filter((f) => f?.question?.trim() && f?.answer?.trim());
  if (!valid.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: valid.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

export function howToSchema(name: string, steps: { question: string; answer: string }[]) {
  const valid = (steps || []).filter((s) => s?.question?.trim());
  if (!valid.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name,
    step: valid.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.question,
      text: s.answer || s.question,
    })),
  };
}

export function serviceSchema(opts: {
  name: string;
  description: string;
  path: string;
  areaServed?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: opts.name,
    description: opts.description,
    url: `${SITE_URL}${opts.path}`,
    serviceType: opts.name,
    provider: { "@id": `${SITE_URL}/#organization` },
    areaServed: (opts.areaServed || ["Delhi", "Gurgaon", "Noida", "Delhi NCR"]).map((n) => ({
      "@type": "City",
      name: n,
    })),
  };
}

export function articleSchema(opts: {
  type?: string;
  title: string;
  description?: string | null;
  image?: string | null;
  imageAlt?: string | null;
  url: string;
  datePublished?: string | null;
  dateModified?: string | null;
  authorName?: string | null;
  section?: string | null;
  keywords?: (string | null | undefined)[];
  wordCount?: number;
}) {
  const keywords = (opts.keywords || []).filter(Boolean).join(", ");
  return {
    "@context": "https://schema.org",
    "@type": opts.type || "BlogPosting",
    headline: opts.title,
    description: opts.description || undefined,
    image: opts.image
      ? { "@type": "ImageObject", url: opts.image, caption: opts.imageAlt || opts.title }
      : undefined,
    datePublished: opts.datePublished || undefined,
    dateModified: opts.dateModified || opts.datePublished || undefined,
    author: { "@type": "Person", name: opts.authorName || SITE_NAME },
    publisher: { "@id": `${SITE_URL}/#organization` },
    articleSection: opts.section || undefined,
    keywords: keywords || undefined,
    wordCount: opts.wordCount || undefined,
    inLanguage: "en-IN",
    isAccessibleForFree: true,
    mainEntityOfPage: { "@type": "WebPage", "@id": opts.url },
  };
}

/** Strips HTML and counts words — used for reading time and wordCount schema. */
export function countWords(html: string) {
  const text = (html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return text ? text.split(" ").length : 0;
}

export function readingTime(html: string) {
  return Math.max(1, Math.round(countWords(html) / 220));
}

/**
 * Full structured-data bundle for a service page: Service + BreadcrumbList
 * plus any page-specific extras (FAQPage, HowTo, etc.).
 */
export function servicePageSchemas(
  opts: { name: string; description: string; path: string; areaServed?: string[] },
  extra: (Record<string, unknown> | null | undefined)[] = [],
) {
  return [
    serviceSchema(opts),
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: opts.name, path: opts.path },
    ]),
    ...extra.filter(Boolean),
  ] as Record<string, unknown>[];
}
