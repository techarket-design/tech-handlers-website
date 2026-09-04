import { useParams, Navigate, useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const ALLOWED = ["privacy-policy", "terms-of-service", "refund-policy", "cookie-policy"];

export default function LegalPage() {
  const { slug: paramSlug } = useParams();
  const location = useLocation();
  const slug = paramSlug || location.pathname.replace(/^\//, "").replace(/\/$/, "");

  const { data, isLoading, error } = useQuery({
    queryKey: ["legal_page", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("legal_pages" as any)
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
    enabled: ALLOWED.includes(slug),
  });

  if (!ALLOWED.includes(slug)) return <Navigate to="/404" replace />;

  const canonical = `https://techhandlers.in/${slug}`;

  return (
    <>
      <SEOHead
        title={data ? `${data.title} | Tech Handlers` : "Loading…"}
        description={data?.meta_description || ""}
        canonical={canonical}
      />
      <Header />
      <main className="section-white pt-32 pb-20">
        <div className="container mx-auto px-4 lg:px-8 max-w-3xl">
          {isLoading && (
            <div className="space-y-4">
              <Skeleton className="h-10 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          )}
          {error && (
            <p className="text-destructive">Couldn't load this page. Please try again.</p>
          )}
          {data && (
            <article className="prose prose-slate max-w-none prose-headings:font-display prose-h1:text-4xl prose-h1:mb-2 prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-3 prose-p:text-muted-foreground prose-li:text-muted-foreground prose-a:text-primary prose-strong:text-lead">
              <ReactMarkdown>{data.content_markdown}</ReactMarkdown>
            </article>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
