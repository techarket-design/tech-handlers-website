import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedHeading } from "./motion/AnimationUtils";
import { ChevronDown } from "lucide-react";
import { useFaqs, useSiteSettings } from "@/hooks/useData";

const fallbackFaqs = [
  { question: "What makes us different from other agencies?", answer: "We're hyper-focused on revenue outcomes, not vanity metrics." },
  { question: "How quickly can I expect to see results?", answer: "SEO typically shows meaningful movement in 60-90 days. Performance marketing delivers qualified leads within the first 2 weeks." },
];

function FAQItem({ faq, index }: { faq: { question: string; answer: string }; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      transition={{ delay: index * 0.06, duration: 0.5 }}>
      <motion.button onClick={() => setOpen(!open)}
        className="w-full flex items-start justify-between gap-4 py-5 text-left group"
        whileHover={{ x: 4 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}>
        <span className="font-display font-semibold text-lead text-sm lg:text-base group-hover:text-primary transition-colors">
          {faq.question}
        </span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.3 }} className="shrink-0 mt-1">
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </motion.div>
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
            <p className="text-sm text-muted-foreground leading-relaxed pb-5 pl-0 lg:pl-1">{faq.answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="h-px bg-border/60" />
    </motion.div>
  );
}

export default function FAQSection() {
  const { data: dbFaqs } = useFaqs();
  const { data: settings } = useSiteSettings();

  const faqs = dbFaqs?.length ? dbFaqs.map(f => ({ question: f.question, answer: f.answer })) : fallbackFaqs;
  const heading = (settings as any)?.faq_heading || "Questions We Get Asked a Lot";

  return (
    <section className="section-stone py-20 lg:py-28">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-12 lg:gap-20">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <motion.span className="inline-block text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4"
              initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              FAQs
            </motion.span>
            <AnimatedHeading as="h2" text={heading} className="text-3xl lg:text-4xl font-display font-bold text-lead mb-4" />
            <motion.p className="text-muted-foreground text-sm" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
              viewport={{ once: true }} transition={{ delay: 0.3 }}>
              Can't find what you're looking for? Reach out to our team directly.
            </motion.p>
          </div>
          <div>
            {faqs.map((faq, i) => (
              <FAQItem key={i} faq={faq} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
