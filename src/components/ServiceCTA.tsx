import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSubmitLead } from "@/hooks/useData";
import { toast } from "sonner";

interface ServiceCTAProps {
  heading: string;
  description: string;
  buttonText: string;
  service: string;
}

export default function ServiceCTA({ heading, description, buttonText, service }: ServiceCTAProps) {
  const submitLead = useSubmitLead();
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) { toast.error("Please fill in name and email"); return; }
    try {
      await submitLead.mutateAsync({
        name: form.name, email: form.email, phone: form.phone || null,
        message: form.message || null, service_interest: service,
        source: `service-page-${service.toLowerCase().replace(/\s+/g, "-")}`,
        company: null, website_url: null, budget: null,
      });
      setSubmitted(true);
      toast.success("We'll get back to you within 24 hours!");
    } catch { toast.error("Something went wrong. Please try again."); }
  };

  return (
    <section id="service-cta" className="py-20 lg:py-28 bg-foreground">
      <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
          <h2 className="text-3xl lg:text-4xl font-display font-bold text-background mb-4">{heading}</h2>
          <p className="text-background/60 max-w-xl mx-auto">{description}</p>
        </motion.div>

        {submitted ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <Send className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-2xl font-display font-bold text-background mb-2">Thank You!</h3>
            <p className="text-background/60">Our team will reach out within 24 hours with a custom strategy for your business.</p>
          </motion.div>
        ) : (
          <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="bg-background/5 backdrop-blur-sm rounded-2xl border border-background/10 p-6 lg:p-8 max-w-2xl mx-auto">
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <Input placeholder="Your Name *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="bg-background/10 border-background/20 text-background placeholder:text-background/40" />
              <Input type="email" placeholder="Email Address *" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className="bg-background/10 border-background/20 text-background placeholder:text-background/40" />
            </div>
            <Input placeholder="Phone Number" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
              className="bg-background/10 border-background/20 text-background placeholder:text-background/40 mb-4" />
            <Textarea placeholder="Tell us about your project..." value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
              className="bg-background/10 border-background/20 text-background placeholder:text-background/40 mb-4 min-h-[80px]" />
            <Button type="submit" size="lg" className="w-full gradient-primary-accent text-primary-foreground font-semibold shadow-xl h-12"
              disabled={submitLead.isPending}>
              {submitLead.isPending ? "Submitting..." : buttonText} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.form>
        )}
      </div>
    </section>
  );
}
