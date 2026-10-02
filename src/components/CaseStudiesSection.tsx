import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { AnimatedHeading } from "./motion/AnimationUtils";
import { Briefcase, TrendingUp, Award } from "lucide-react";
import { usePortfolio, useSiteSettings } from "@/hooks/useData";

const fallbackCases = [
  {
    title: "SaaS Startup", category: "SaaS / Technology",
    short_description: "Needed to build organic visibility and reduce reliance on paid ads",
    results: [
      { label: "Organic Traffic", value: "+85%", period: "4 months" },
      { label: "Lead Cost", value: "-30%", period: "Reduced" },
      { label: "Leads Generated", value: "120+", period: "Quarterly" },
    ],
  },
  {
    title: "Local Real Estate Firm", category: "Real Estate",
    short_description: "Wanted to establish online presence and generate local leads",
    results: [
      { label: "Local Rankings", value: "Top 5", period: "Google Maps" },
      { label: "Site Visits", value: "+60%", period: "3 months" },
      { label: "Inquiries", value: "40+", period: "Monthly" },
    ],
  },
  {
    title: "D2C Fashion Brand", category: "D2C Fashion",
    short_description: "Looking to improve ad performance and lower acquisition costs",
    results: [
      { label: "ROAS", value: "3.2x", period: "Achieved" },
      { label: "Monthly Orders", value: "+45%", period: "Growth" },
      { label: "CPA Reduction", value: "-25%", period: "In 60 days" },
    ],
  },
];

const iconList = [Briefcase, TrendingUp, Award];

export default function CaseStudiesSection() {
  const { data: dbPortfolio } = usePortfolio();
  const { data: settings } = useSiteSettings();

  const cases = dbPortfolio?.length ? dbPortfolio.map((p: any) => ({
    slug: p.slug,
    hero_image_url: p.hero_image_url || p.image_url,
    title: p.client_name || p.title,
    category: p.category,
    short_description: p.short_description,
    results: Array.isArray(p.results) ? p.results : [],
  })) : fallbackCases;

  const heading = (settings as any)?.case_studies_heading || "Recent Work";
  const subheading = (settings as any)?.case_studies_subheading || "A look at some projects we've worked on recently";

  return (
    <section className="section-white py-20 lg:py-28 relative overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-16">
          <motion.span className="inline-block text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4"
            initial={false} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            Case Studies
          </motion.span>
          <AnimatedHeading as="h2" text={heading} className="text-3xl lg:text-5xl font-display font-bold text-lead mb-4" />
          <motion.p className="text-muted-foreground max-w-lg mx-auto" initial={false}
            whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.4 }}>
            {subheading}
          </motion.p>
        </div>

        <div className="space-y-6">
          {cases.map((c: any, i: number) => {
            const IconComp = iconList[i % iconList.length];
            const card = (
              <motion.div key={i} initial={false} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
                <motion.div className="bg-surface-white rounded-2xl border border-border/70 p-6 lg:p-8 group cursor-pointer"
                  whileHover={{ y: -3, boxShadow: "0 20px 60px -15px hsl(239 84% 67% / 0.08)" }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}>
                  <div className="grid lg:grid-cols-[1fr_auto] gap-6 items-start">
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/[0.07] flex items-center justify-center text-primary">
                          <IconComp className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-display text-lg font-bold text-lead">{c.title}</h3>
                          <p className="text-xs text-muted-foreground">{c.category}</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        <span className="font-semibold text-lead">Challenge:</span> {c.short_description}
                      </p>
                      {c.slug && (
                        <span className="inline-flex items-center gap-1 text-xs text-primary font-semibold">
                          Read full case study <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      )}
                    </div>
                    {c.results?.length > 0 && (
                      <div className="grid grid-cols-3 gap-4 lg:gap-6">
                        {c.results.map((r: any, j: number) => (
                          <motion.div key={j} className="text-center min-w-[80px]"
                            initial={false} whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }} transition={{ delay: i * 0.1 + j * 0.1 + 0.3 }}>
                            <p className="text-xl lg:text-2xl font-display font-bold text-lead">{r.value}</p>
                            <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{r.label}</p>
                            <p className="text-[9px] text-accent font-semibold mt-0.5">{r.period}</p>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            );
            return c.slug ? <Link key={i} to={`/case-studies/${c.slug}`}>{card}</Link> : card;
          })}
        </div>
        <div className="text-center mt-10">
          <Link to="/case-studies" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:gap-3 transition-all">
            View all case studies <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
