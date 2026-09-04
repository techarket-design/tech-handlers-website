import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Briefcase, TrendingUp, Award } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { usePortfolio } from "@/hooks/useData";
import { Skeleton } from "@/components/ui/skeleton";

const ICONS = [Briefcase, TrendingUp, Award];

export default function CaseStudies() {
  const { data: items, isLoading } = usePortfolio();

  const cases = (items as any[] | undefined) || [];

  return (
    <>
      <SEOHead
        title="Case Studies | Tech Handlers — Real Results, Real Brands"
        description="Explore Tech Handlers case studies — real campaigns, real metrics, and the playbooks behind digital growth for brands across India."
        canonical="https://techhandlers.in/case-studies"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Tech Handlers Case Studies",
          url: "https://techhandlers.in/case-studies",
          isPartOf: { "@type": "WebSite", name: "Tech Handlers", url: "https://techhandlers.in" },
          hasPart: cases.slice(0, 20).map((c) => ({
            "@type": "CreativeWork",
            name: c.title,
            url: `https://techhandlers.in/case-studies/${c.slug}`,
            image: c.hero_image_url || c.image_url,
            about: c.industry || c.category,
          })),
        }}
      />
      <Header />
      <main className="min-h-screen bg-background pt-24 pb-20">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12 max-w-3xl mx-auto">
            <span className="inline-block text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4">Case Studies</span>
            <h1 className="text-4xl lg:text-5xl font-display font-bold text-foreground mb-4">Real campaigns. Real numbers.</h1>
            <p className="text-muted-foreground text-lg">Deep dives into how we&rsquo;ve helped brands move metrics that matter.</p>
          </motion.div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[0, 1, 2].map(i => <Skeleton key={i} className="h-80 rounded-2xl" />)}
            </div>
          ) : cases.length === 0 ? (
            <p className="text-center text-muted-foreground py-16">Case studies coming soon.</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cases.map((c, i) => {
                const Icon = ICONS[i % ICONS.length];
                const heroImg = c.hero_image_url || c.image_url;
                return (
                  <motion.div key={c.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ delay: i * 0.08, duration: 0.5 }}>
                    <Link to={`/case-studies/${c.slug}`} className="block group h-full">
                      <article className="bg-surface-white rounded-2xl border border-border/70 overflow-hidden h-full flex flex-col hover:shadow-lg hover:-translate-y-0.5 transition-all">
                        <div className="aspect-[16/10] bg-muted relative overflow-hidden">
                          {heroImg ? (
                            <img src={heroImg} alt={c.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5">
                              <Icon className="h-12 w-12 text-primary/40" />
                            </div>
                          )}
                          {c.category && (
                            <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wide bg-surface-white/95 backdrop-blur px-2 py-1 rounded text-primary">
                              {c.category}
                            </span>
                          )}
                        </div>
                        <div className="p-6 flex-1 flex flex-col">
                          {c.client_name && <p className="text-xs text-muted-foreground mb-1">{c.client_name}</p>}
                          <h2 className="font-display text-lg font-bold text-lead mb-2 group-hover:text-primary transition-colors">{c.title}</h2>
                          {c.short_description && <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{c.short_description}</p>}
                          {Array.isArray(c.results) && c.results.length > 0 && (
                            <div className="grid grid-cols-3 gap-2 mt-auto pt-4 border-t border-border">
                              {c.results.slice(0, 3).map((r: any, j: number) => (
                                <div key={j} className="text-center">
                                  <p className="text-base font-display font-bold text-primary">{r.value}</p>
                                  <p className="text-[10px] text-muted-foreground leading-tight">{r.label}</p>
                                </div>
                              ))}
                            </div>
                          )}
                          <span className="inline-flex items-center gap-1 text-xs text-primary font-semibold mt-4">
                            Read case study <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        </div>
                      </article>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}