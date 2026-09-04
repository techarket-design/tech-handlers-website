import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, User, ArrowLeft, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { useBlogPosts } from "@/hooks/useData";
import { articleSchema, breadcrumbSchema, faqSchema, howToSchema, countWords, readingTime } from "@/lib/seo/schema";

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const { data: posts, isLoading } = useBlogPosts();

  const post = posts?.find(p => p.slug === slug && p.is_published);

  // Related posts: same category first, then recent
  const related = (posts || [])
    .filter(p => p.is_published && p.slug !== slug)
    .sort((a, b) => {
      const sameA = a.category && a.category === post?.category ? 1 : 0;
      const sameB = b.category && b.category === post?.category ? 1 : 0;
      return sameB - sameA;
    })
    .slice(0, 3);

  const recommendedServices = [
    { slug: "seo", label: "SEO Services" },
    { slug: "performance-marketing", label: "Performance Marketing" },
    { slug: "social-media-marketing", label: "Social Media Marketing" },
    { slug: "web-development", label: "Web Development" },
  ];

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-background pt-24 pb-16">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
              <div className="h-64 bg-muted rounded" />
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!post) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-background pt-24 pb-16 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">Article Not Found</h1>
            <p className="text-muted-foreground mb-4">This blog post doesn't exist or has been unpublished.</p>
            <Link to="/blog" className="text-primary hover:underline">← Back to Blog</Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const publishedDate = post.published_at ? new Date(post.published_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "";
  const p: any = post;
  const canonical = p.canonical_url || `https://techhandlers.in/blog/${post.slug}`;
  const mins = p.reading_time_minutes || readingTime(post.content || "");
  const schemas = [
    articleSchema({
      type: p.schema_type || "BlogPosting",
      title: post.title,
      description: post.meta_description || post.excerpt,
      image: p.og_image_url || post.featured_image_url,
      imageAlt: p.image_alt,
      url: canonical,
      datePublished: post.published_at,
      dateModified: post.updated_at,
      authorName: post.author_name,
      section: post.category,
      keywords: [p.focus_keyword, ...(p.secondary_keywords || []), ...(post.tags || [])],
      wordCount: countWords(post.content || ""),
    }),
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Blog", path: "/blog" },
      { name: post.title, path: `/blog/${post.slug}` },
    ]),
    faqSchema(p.faq_schema || []),
    howToSchema(post.title, p.how_to_schema || []),
    p.custom_schema && Object.keys(p.custom_schema).length ? p.custom_schema : null,
  ].filter(Boolean) as Record<string, unknown>[];

  return (
    <>
      <SEOHead
        title={post.meta_title || `${post.title} | Tech Handlers Blog`}
        description={post.meta_description || post.excerpt || ""}
        canonical={canonical}
        ogImage={p.og_image_url || post.featured_image_url || undefined}
        ogType="article"
        noindex={!!p.noindex}
        jsonLd={schemas}
      />
      <Header />
      <main className="min-h-screen bg-background pt-24 pb-16">
        <article className="container mx-auto px-4 max-w-3xl">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <span>/</span>
            <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
            <span>/</span>
            <span className="text-foreground truncate max-w-[200px]">{post.title}</span>
          </nav>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {post.category && <Badge variant="secondary" className="mb-4">{post.category}</Badge>}

            <h1 className="text-3xl lg:text-4xl font-display font-bold text-foreground mb-4 leading-tight">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8">
              {post.author_name && (
                <span className="flex items-center gap-1.5"><User className="h-4 w-4" />{post.author_name}</span>
              )}
              {publishedDate && (
                <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />{publishedDate}</span>
              )}
              <span>{mins} min read</span>
            </div>

            {post.featured_image_url && (
              <div className="rounded-xl overflow-hidden mb-8">
                <img src={post.featured_image_url} alt={p.image_alt || post.title} className="w-full h-auto" />
              </div>
            )}

            <div
              className="prose prose-lg max-w-none dark:prose-invert prose-headings:font-display prose-a:text-primary"
              dangerouslySetInnerHTML={{ __html: post.content || "" }}
            />

            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-10 pt-6 border-t border-border">
                <Tag className="h-4 w-4 text-muted-foreground" />
                {post.tags.map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                ))}
              </div>
            )}
          </motion.div>

          <div className="mt-12">
            <Link to="/blog" className="inline-flex items-center gap-2 text-primary hover:underline font-medium">
              <ArrowLeft className="h-4 w-4" /> Back to all articles
            </Link>
          </div>

          {/* Recommended Services */}
          <section className="mt-16 pt-10 border-t border-border">
            <h2 className="text-xl font-display font-semibold text-foreground mb-4">
              Need help applying this? Explore our services
            </h2>
            <div className="flex flex-wrap gap-2">
              {recommendedServices.map(s => (
                <Link
                  key={s.slug}
                  to={`/services/${s.slug}`}
                  className="px-4 py-2 rounded-full border border-border bg-card hover:bg-primary hover:text-primary-foreground transition-colors text-sm font-medium"
                >
                  {s.label}
                </Link>
              ))}
            </div>
          </section>

          {/* Related Posts */}
          {related.length > 0 && (
            <section className="mt-12 pt-10 border-t border-border">
              <h2 className="text-xl font-display font-semibold text-foreground mb-6">
                Related articles
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {related.map(r => (
                  <Link
                    key={r.id}
                    to={`/blog/${r.slug}`}
                    className="group rounded-xl border border-border bg-card overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    {r.featured_image_url && (
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={r.featured_image_url}
                          alt={r.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      {r.category && (
                        <Badge variant="secondary" className="mb-2 text-xs">{r.category}</Badge>
                      )}
                      <h3 className="font-display font-semibold text-base text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                        {r.title}
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </article>
      </main>
      <Footer />
    </>
  );
}
