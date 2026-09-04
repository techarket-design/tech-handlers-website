import { useParams, Link, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Briefcase, Tag, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface Block {
  type: "heading" | "paragraph" | "image" | "quote" | "stat";
  text?: string;
  url?: string;
  caption?: string;
  author?: string;
  value?: string;
  label?: string;
}

function renderBlock(block: Block, idx: number) {
  switch (block.type) {
    case "heading":
      return <h2 key={idx} className="text-2xl lg:text-3xl font-display font-bold text-lead mt-12 mb-4">{block.text}</h2>;
    case "paragraph":
      return <p key={idx} className="text-base text-foreground/80 leading-relaxed mb-4 whitespace-pre-wrap">{block.text}</p>;
    case "image":
      return (
        <figure key={idx} className="my-8">
          <img src={block.url} alt={block.caption || ""} loading="lazy" className="w-full rounded-xl border border-border" />
          {block.caption && <figcaption className="text-xs text-muted-foreground text-center mt-2">{block.caption}</figcaption>}
        </figure>
      );
    case "quote":
      return (
        <blockquote key={idx} className="border-l-4 border-primary pl-6 py-2 my-8 bg-primary/[0.03] rounded-r-lg">
          <p className="text-lg italic text-lead">&ldquo;{block.text}&rdquo;</p>
          {block.author && <footer className="text-sm text-muted-foreground mt-2">— {block.author}</footer>}
        </blockquote>
      );
    case "stat":
      return (
        <div key={idx} className="my-8 text-center bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl p-8 border border-border">
          <p className="text-5xl lg:text-6xl font-display font-bold text-primary">{block.value}</p>
          <p className="text-sm text-muted-foreground mt-2 font-medium">{block.label}</p>
        </div>
      );
    default:
      return null;
  }
}

export default function CaseStudyDetail() {
  const { slug } = useParams<{ slug: string }>();

  const { data: study, isLoading, error } = useQuery({
    queryKey: ["case_study", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("portfolio")
        .select("*")
        .eq("slug", slug!)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const { data: related = [] } = useQuery({
    queryKey: ["case_studies_related", study?.id],
    enabled: !!study,
    queryFn: async () => {
      const { data } = await supabase
        .from("portfolio")
        .select("id, slug, title, client_name, short_description, hero_image_url, image_url, category")
        .eq("is_active", true)
        .neq("id", study!.id)
        .order("sort_order", { ascending: true })
        .limit(3);
      return data || [];
    },
  });

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="container mx-auto px-4 pt-24 pb-16">
          <Skeleton className="h-12 w-2/3 mb-4" />
          <Skeleton className="h-80 w-full rounded-2xl" />
        </main>
      </>
    );
  }

  if (!study) return <Navigate to="/case-studies" replace />;

  const heroImg = study.hero_image_url || study.image_url;
  const blocks = (Array.isArray(study.body_blocks) ? study.body_blocks : []) as unknown as Block[];
  const results = Array.isArray(study.results) ? study.results as any[] : [];
  const gallery = Array.isArray(study.gallery) ? study.gallery as any[] : [];
  const technologies = Array.isArray(study.technologies) ? study.technologies as string[] : [];

  return (
    <>
      <SEOHead
        title={study.meta_title || `${study.title} | Tech Handlers Case Study`}
        description={study.meta_description || study.short_description || `${study.title} — case study by Tech Handlers.`}
        canonical={`https://techhandlers.in/case-studies/${study.slug}`}
        ogImage={heroImg || undefined}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: study.title,
          image: heroImg ? [heroImg] : undefined,
          datePublished: study.published_at,
          dateModified: study.updated_at,
          author: { "@type": "Organization", name: "Tech Handlers", url: "https://techhandlers.in" },
          publisher: {
            "@type": "Organization",
            name: "Tech Handlers",
            logo: { "@type": "ImageObject", url: "https://techhandlers.in/favicon.ico" },
          },
          description: study.short_description,
          about: study.industry || study.category,
          mainEntityOfPage: `https://techhandlers.in/case-studies/${study.slug}`,
        }}
      />
      <Header />
      <main className="bg-background">
        {/* Hero */}
        <section className="relative pt-24 pb-12 lg:pt-32 lg:pb-20 overflow-hidden">
          {heroImg && (
            <div className="absolute inset-0 -z-10">
              <img src={heroImg} alt="" className="w-full h-full object-cover opacity-15" />
              <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/95 to-background" />
            </div>
          )}
          <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
            <Link to="/case-studies" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6">
              <ArrowLeft className="h-3.5 w-3.5" /> All case studies
            </Link>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {study.category && <Badge variant="secondary"><Tag className="h-3 w-3 mr-1" />{study.category}</Badge>}
              {study.industry && <Badge variant="outline"><Briefcase className="h-3 w-3 mr-1" />{study.industry}</Badge>}
              {study.duration && <Badge variant="outline"><Calendar className="h-3 w-3 mr-1" />{study.duration}</Badge>}
            </div>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="text-4xl lg:text-6xl font-display font-bold text-lead mb-4">
              {study.title}
            </motion.h1>
            {study.client_name && (
              <p className="text-base text-muted-foreground mb-6">For <span className="font-semibold text-lead">{study.client_name}</span></p>
            )}
            {study.short_description && (
              <p className="text-lg text-foreground/80 max-w-2xl">{study.short_description}</p>
            )}

            {results.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
                {results.map((r, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.08 }}
                    className="bg-surface-white border border-border rounded-xl p-4 text-center">
                    <p className="text-2xl lg:text-3xl font-display font-bold text-primary">{r.value}</p>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">{r.label}</p>
                    {r.period && <p className="text-[10px] text-accent mt-0.5">{r.period}</p>}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Hero image */}
        {heroImg && (
          <section className="container mx-auto px-4 lg:px-8 max-w-5xl -mt-4 mb-12">
            <img src={heroImg} alt={study.title} className="w-full rounded-2xl border border-border shadow-lg" />
          </section>
        )}

        {/* Body */}
        <section className="container mx-auto px-4 lg:px-8 max-w-3xl pb-16">
          {study.full_description && (
            <p className="text-base text-foreground/80 leading-relaxed mb-6 whitespace-pre-wrap">{study.full_description}</p>
          )}
          {blocks.map((b, i) => renderBlock(b, i))}
        </section>

        {/* Gallery */}
        {gallery.length > 0 && (
          <section className="container mx-auto px-4 lg:px-8 max-w-5xl pb-16">
            <h2 className="text-2xl font-display font-bold text-lead mb-6">Gallery</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {gallery.map((g, i) => (
                <figure key={i}>
                  <img src={g.url} alt={g.caption || ""} loading="lazy" className="w-full h-48 object-cover rounded-lg border border-border" />
                  {g.caption && <figcaption className="text-xs text-muted-foreground mt-1.5">{g.caption}</figcaption>}
                </figure>
              ))}
            </div>
          </section>
        )}

        {/* Testimonial */}
        {study.testimonial_quote && (
          <section className="container mx-auto px-4 lg:px-8 max-w-3xl pb-16">
            <blockquote className="bg-gradient-to-br from-primary/[0.06] to-accent/[0.06] border border-primary/10 rounded-2xl p-8 lg:p-10 text-center">
              <p className="text-xl lg:text-2xl font-display italic text-lead leading-relaxed">&ldquo;{study.testimonial_quote}&rdquo;</p>
              {study.client_name && <footer className="text-sm text-muted-foreground mt-4 font-semibold">— {study.client_name}</footer>}
            </blockquote>
          </section>
        )}

        {/* Tech */}
        {technologies.length > 0 && (
          <section className="container mx-auto px-4 lg:px-8 max-w-3xl pb-16">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Platforms & tools</h3>
            <div className="flex flex-wrap gap-2">
              {technologies.map((t, i) => <Badge key={i} variant="secondary">{t}</Badge>)}
            </div>
          </section>
        )}

        {/* Related */}
        {related.length > 0 && (
          <section className="bg-surface-white border-t border-border py-16">
            <div className="container mx-auto px-4 lg:px-8 max-w-6xl">
              <h2 className="text-2xl font-display font-bold text-lead mb-6">More case studies</h2>
              <div className="grid md:grid-cols-3 gap-4">
                {related.map((r: any) => {
                  const img = r.hero_image_url || r.image_url;
                  return (
                    <Link key={r.id} to={`/case-studies/${r.slug}`} className="group block bg-background rounded-xl overflow-hidden border border-border hover:shadow-md transition-shadow">
                      <div className="aspect-[16/9] bg-muted">
                        {img && <img src={img} alt={r.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-sm text-lead group-hover:text-primary line-clamp-2">{r.title}</h3>
                        <span className="inline-flex items-center gap-1 text-xs text-primary mt-2">Read <ArrowRight className="h-3 w-3" /></span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}