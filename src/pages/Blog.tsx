import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, User, ArrowRight, Search } from "lucide-react";
import GsapReveal from "@/components/motion/GsapReveal";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { useBlogPosts } from "@/hooks/useData";

export default function Blog() {
  const { data: posts, isLoading } = useBlogPosts();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const published = posts?.filter(p => p.is_published) || [];
  const categories = [...new Set(published.map(p => p.category).filter(Boolean))] as string[];

  const filtered = published.filter(p => {
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.excerpt?.toLowerCase().includes(search.toLowerCase());
    const matchCat = !activeCategory || p.category === activeCategory;
    return matchSearch && matchCat;
  });

  return (
    <>
      <SEOHead
        title="Blog | Tech Handlers — Digital Marketing Insights Delhi NCR"
        description="Expert insights on digital marketing, SEO, social media, and web development from Tech Handlers, a leading agency in Delhi NCR, Gurgaon & Noida."
        canonical="https://techhandlers.in/blog"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Blog",
          name: "Tech Handlers Blog",
          description: "Digital marketing insights and strategies for businesses in Delhi NCR",
          url: "https://techhandlers.in/blog",
          publisher: {
            "@type": "Organization",
            name: "Tech Handlers",
            url: "https://techhandlers.in",
          },
        }}
      />
      <Header />
      <main className="min-h-screen bg-background pt-24 pb-16">
        <div className="container mx-auto px-4 lg:px-8">
          {/* Hero */}
          <GsapReveal className="text-center mb-12" direction="up">
            <h1 className="text-4xl lg:text-5xl font-display font-bold text-foreground mb-4">
              Digital Marketing Insights
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Expert strategies, case studies, and tips from Delhi NCR's leading digital marketing agency.
            </p>
          </GsapReveal>

          {/* Search + Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-10 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search articles..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center mb-10">
              <Badge
                variant={activeCategory === null ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setActiveCategory(null)}
              >
                All
              </Badge>
              {categories.map(cat => (
                <Badge
                  key={cat}
                  variant={activeCategory === cat ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </Badge>
              ))}
            </div>
          )}

          {/* Posts Grid */}
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="rounded-xl bg-muted animate-pulse h-80" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-16">No articles found.</p>
          ) : (
            <GsapReveal as="div" className="grid md:grid-cols-2 lg:grid-cols-3 gap-8" staggerChildren direction="up" distance={40} stagger={0.1}>
              {filtered.map((post, i) => (
                <Link
                    key={post.id}
                    to={`/blog/${post.slug}`}
                    className="group block rounded-xl border border-border bg-card overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                  >
                    {post.featured_image_url && (
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={post.featured_image_url}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className="p-5">
                      {post.category && (
                        <Badge variant="secondary" className="mb-3 text-xs">{post.category}</Badge>
                      )}
                      <h2 className="font-display font-semibold text-lg text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {post.title}
                      </h2>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{post.excerpt}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1"><User className="h-3 w-3" />{post.author_name}</span>
                          {post.published_at && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(post.published_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                          )}
                        </div>
                        <ArrowRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </Link>
              ))}
            </GsapReveal>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
