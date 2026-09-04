import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { AnimatedHeading, RevealOnScroll } from "./motion/AnimationUtils";
import { useSiteSettings, useSubmitLead } from "@/hooks/useData";

const serviceOptions = [
  "Digital Marketing",
  "Performance Marketing",
  "Web Development",
  "SEO & Content Marketing",
  "Social Media Marketing",
  "LinkedIn Automation",
  "Lead Generation",
  "Other",
];

export default function ContactSection() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [website, setWebsite] = useState("");
  const [service, setService] = useState("");
  const [budget, setBudget] = useState([200000]);
  const [message, setMessage] = useState("");
  const { data: settings } = useSiteSettings();
  const submitLead = useSubmitLead();

  const budgetLabel = (v: number) => {
    if (v >= 1000000) return `₹${(v / 100000).toFixed(0)}L+`;
    return `₹${(v / 1000).toFixed(0)}k`;
  };

  const contactHeading = (settings as any)?.contact_section_heading || "Let's Build Your Digital Presence";
  const formHeading = (settings as any)?.contact_form_heading || "Send Us Your Requirements";
  const address = settings?.contact_address || "India";
  const phoneNum = settings?.contact_phone || "+91 98765 43210";
  const emailAddr = settings?.contact_email || "hello@techhandlers.in";
  const mapsEmbed = (settings as any)?.google_maps_embed as string | undefined;

  // Accept either a full <iframe ...> snippet or a bare src URL
  const mapsSrc = (() => {
    if (!mapsEmbed) return null;
    const trimmed = mapsEmbed.trim();
    if (trimmed.startsWith("<iframe")) {
      const m = trimmed.match(/src=["']([^"']+)["']/i);
      return m?.[1] || null;
    }
    if (trimmed.startsWith("http")) return trimmed;
    return null;
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Please fill in your name and email");
      return;
    }
    try {
      await submitLead.mutateAsync({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        company: company.trim() || null,
        website_url: website.trim() || null,
        service_interest: service || null,
        budget: budgetLabel(budget[0]),
        message: message.trim() || null,
        source: "contact_form",
      });
      toast.success("Thanks! We'll reach out within 24 hours.");
      setName(""); setEmail(""); setPhone(""); setCompany("");
      setWebsite(""); setService(""); setBudget([200000]); setMessage("");
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  };

  const contactItems = [
    { icon: MapPin, text: address },
    { icon: Phone, text: phoneNum },
    { icon: Mail, text: emailAddr },
    { icon: Clock, text: "Mon–Fri, 9:00 AM – 6:00 PM IST" },
  ];

  return (
    <section id="contact" className="section-white py-20 lg:py-28 relative overflow-hidden">
      <div className="absolute left-0 top-0 w-1/2 h-full bg-gradient-to-r from-primary/[0.01] to-transparent pointer-events-none" />
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          <div>
            <motion.span className="inline-block text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4"
              initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              Get In Touch
            </motion.span>
            <AnimatedHeading as="h2" text={contactHeading} className="text-3xl lg:text-4xl font-display font-bold text-lead mb-6" />

            <motion.div className="space-y-4 mb-8" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
              {contactItems.map((item, i) => (
                <motion.div key={i} className="flex items-start gap-3 group"
                  initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.08 }}>
                  <div className="w-8 h-8 rounded-lg bg-primary/[0.06] flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                    <item.icon className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground pt-1.5">{item.text}</span>
                </motion.div>
              ))}
            </motion.div>

            <motion.div className="relative bg-muted/50 rounded-2xl overflow-hidden border border-border/50 h-56 lg:h-72"
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.4 }}>
              {mapsSrc ? (
                <iframe
                  src={mapsSrc}
                  title={`${address} on Google Maps`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              ) : (
              <div className="relative w-full h-full p-4">
              <svg viewBox="0 0 400 200" className="w-full h-full opacity-20">
                <path d="M50 100 Q100 40 200 80 T350 60" stroke="hsl(239 84% 67% / 0.4)" fill="none" strokeWidth="1.5" />
                <path d="M30 140 Q120 90 220 120 T380 100" stroke="hsl(239 84% 67% / 0.25)" fill="none" strokeWidth="1" />
                <path d="M60 170 Q150 130 250 150 T390 130" stroke="hsl(239 84% 67% / 0.15)" fill="none" strokeWidth="1" />
                <circle cx="200" cy="80" r="35" fill="hsl(239 84% 67% / 0.03)" stroke="hsl(239 84% 67% / 0.08)" strokeWidth="1" />
              </svg>
              <div className="absolute" style={{ top: "35%", left: "48%" }}>
                <div className="relative flex items-center justify-center">
                  <span className="absolute w-10 h-10 rounded-full bg-accent/15 pulse-marker" />
                  <span className="absolute w-5 h-5 rounded-full bg-accent/30 pulse-marker" style={{ animationDelay: "0.5s" }} />
                  <span className="w-3 h-3 rounded-full bg-accent relative z-10 shadow-lg" />
                </div>
                <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-xs font-display font-bold text-lead whitespace-nowrap bg-surface-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm border border-border/50">
                  📍 {address.split(",")[0]}
                </span>
              </div>
              </div>
              )}
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}>
            <motion.div className="glass-card rounded-2xl p-6 lg:p-8 glow-primary"
              whileHover={{ boxShadow: "0 25px 80px -15px hsl(239 84% 67% / 0.15)" }} transition={{ duration: 0.4 }}>
              <h3 className="font-display text-xl font-bold text-lead mb-1">{formHeading}</h3>
              <p className="text-sm text-muted-foreground mb-6">Fill in your details and we'll get back to you within 24 hours.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="c-name" className="text-sm font-medium text-lead">Name *</Label>
                    <Input id="c-name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1.5 h-11" />
                  </div>
                  <div>
                    <Label htmlFor="c-email" className="text-sm font-medium text-lead">Email *</Label>
                    <Input id="c-email" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1.5 h-11" />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="c-phone" className="text-sm font-medium text-lead">Phone</Label>
                    <Input id="c-phone" type="tel" placeholder="+91 XXXXX XXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1.5 h-11" />
                  </div>
                  <div>
                    <Label htmlFor="c-company" className="text-sm font-medium text-lead">Company</Label>
                    <Input id="c-company" placeholder="Your company" value={company} onChange={(e) => setCompany(e.target.value)} className="mt-1.5 h-11" />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="c-website" className="text-sm font-medium text-lead">Website URL</Label>
                    <Input id="c-website" placeholder="https://yoursite.com" value={website} onChange={(e) => setWebsite(e.target.value)} className="mt-1.5 h-11" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-lead">Service Needed</Label>
                    <Select value={service} onValueChange={setService}>
                      <SelectTrigger className="mt-1.5 h-11">
                        <SelectValue placeholder="Select service" />
                      </SelectTrigger>
                      <SelectContent>
                        {serviceOptions.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-lead">Monthly Marketing Budget</Label>
                  <div className="mt-3 px-1">
                    <Slider value={budget} onValueChange={setBudget} min={50000} max={1000000} step={50000} />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-2.5">
                    <span>₹50k</span>
                    <span className="font-bold text-primary text-sm">{budgetLabel(budget[0])}</span>
                    <span>₹10L+</span>
                  </div>
                </div>
                <div>
                  <Label htmlFor="c-message" className="text-sm font-medium text-lead">Requirements / Message</Label>
                  <Textarea id="c-message" placeholder="Tell us about your project and goals..." value={message} onChange={(e) => setMessage(e.target.value)} rows={3} className="mt-1.5 resize-none" />
                </div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button type="submit" className="w-full gradient-primary-accent text-primary-foreground font-semibold shadow-xl h-12 text-base" size="lg"
                    disabled={submitLead.isPending}>
                    {submitLead.isPending ? "Submitting..." : "Submit Inquiry"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </motion.div>
                <p className="text-[11px] text-muted-foreground text-center">No spam. No obligations. Just actionable insights.</p>
              </form>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
