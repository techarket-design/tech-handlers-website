import { motion } from "framer-motion";
import * as Icons from "lucide-react";
import { useGenericTable } from "@/hooks/useData";

type Badge = { id: string; slug: string; label: string; sublabel: string | null; icon: string; is_enabled: boolean; sort_order: number };

const FALLBACK: Badge[] = [
  { id: "1", slug: "ssl", label: "SSL Secured", sublabel: "256-bit encryption", icon: "Lock", is_enabled: true, sort_order: 10 },
  { id: "2", slug: "dpdp", label: "DPDP Act 2023", sublabel: "India data law compliant", icon: "ShieldCheck", is_enabled: true, sort_order: 20 },
  { id: "3", slug: "gdpr", label: "GDPR Aware", sublabel: "EU privacy standards", icon: "Globe", is_enabled: true, sort_order: 30 },
  { id: "4", slug: "guarantee", label: "30-Day Guarantee", sublabel: "Money-back assurance", icon: "BadgeCheck", is_enabled: true, sort_order: 50 },
  { id: "5", slug: "support", label: "24/7 Support", sublabel: "Real humans, fast replies", icon: "Headphones", is_enabled: true, sort_order: 60 },
];

function Icon({ name, className }: { name: string; className?: string }) {
  const I = (Icons as any)[name] || Icons.ShieldCheck;
  return <I className={className} />;
}

export function TrustBadgesInline({ variant = "light" }: { variant?: "light" | "dark" | "compact" }) {
  const { data } = useGenericTable("trust_badges", { filter: { is_enabled: true }, orderBy: "sort_order" });
  const badges = ((data as unknown as Badge[]) || FALLBACK).filter(b => b.is_enabled);
  if (!badges.length) return null;

  const isDark = variant === "dark";
  const isCompact = variant === "compact";

  if (isCompact) {
    return (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-surface-white/50">
        {badges.slice(0, 5).map((b) => (
          <span key={b.id} className="inline-flex items-center gap-1.5">
            <Icon name={b.icon} className="h-3.5 w-3.5 text-primary/70" />
            <span>{b.label}</span>
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap justify-center gap-3 ${isDark ? "" : ""}`}>
      {badges.map((b, i) => (
        <motion.div
          key={b.id}
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.04, duration: 0.35 }}
          className={`group inline-flex items-center gap-2.5 px-3.5 py-2 rounded-full border transition-all ${
            isDark
              ? "bg-surface-white/[0.04] border-surface-white/[0.1] text-surface-white/80 hover:bg-surface-white/[0.08]"
              : "bg-surface-white border-border/60 text-lead/80 hover:border-primary/40 hover:shadow-sm"
          }`}
        >
          <Icon name={b.icon} className="h-4 w-4 text-primary shrink-0" />
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-semibold">{b.label}</span>
            {b.sublabel && (
              <span className={`text-[10px] ${isDark ? "text-surface-white/40" : "text-muted-foreground"}`}>
                {b.sublabel}
              </span>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default function TrustBadgesSection() {
  return (
    <section className="section-white py-12 border-y border-border/40">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.22em] mb-6"
        >
          Built on Trust · Backed by Standards
        </motion.p>
        <TrustBadgesInline variant="light" />
      </div>
    </section>
  );
}
