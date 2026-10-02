import { motion } from "framer-motion";
import { useBrands } from "@/hooks/useData";

const fallbackBrands = [
  "Hindustan Times", "The Times of India", "Business Standard",
  "Economic Times", "Mint", "YourStory", "Inc42", "Entrepreneur India",
];

export default function TrustMarquee() {
  const { data: brands } = useBrands();
  const names = brands?.length ? brands.map(b => b.name) : fallbackBrands;
  const items = [...names, ...names];

  return (
    <section className="section-white border-y border-border/50 py-7 overflow-hidden relative">
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-surface-white to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-surface-white to-transparent z-10" />

      <motion.p
        className="text-center text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em] mb-5"
        initial={false}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        As Featured In
      </motion.p>
      <div className="relative">
        <div className="marquee-track flex items-center gap-16 w-max">
          {items.map((pub, i) => (
            <span
              key={i}
              className="text-xl font-display font-bold text-lead/[0.12] whitespace-nowrap select-none tracking-tight"
            >
              {pub}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
