import { motion } from "framer-motion";
import { useSiteSettings, useGenericTable } from "@/hooks/useData";

const fallbackPlatforms = [
  { name: "Google" }, { name: "Meta" }, { name: "LinkedIn" },
  { name: "Shopify" }, { name: "WordPress" }, { name: "HubSpot" },
];

export default function PlatformExpertiseSection() {
  const { data: settings } = useSiteSettings();
  const { data: platforms } = useGenericTable("platform_logos", { filter: { is_active: true }, orderBy: "sort_order" });

  const items = platforms?.length ? platforms : fallbackPlatforms;
  const heading = (settings as any)?.platform_expertise_heading || "Experts Across Leading Marketing Platforms";

  return (
    <section id="platforms" className="section-dark py-20 md:py-28">
      <div className="container-wide">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">{heading}</h2>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6 md:gap-8 max-w-4xl mx-auto">
          {(items as any[]).map((p: any, i: number) => (
            <motion.div
              key={p.id || p.name}
              className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl bg-surface-white/5 border border-border/30 hover:border-primary/40 transition-colors"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              {p.logo_url ? (
                <img src={p.logo_url} alt={p.name} className="h-10 w-auto object-contain" loading="lazy" width="120" height="40" />
              ) : (
                <span className="text-lg font-display font-bold text-foreground/80">{p.name}</span>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
