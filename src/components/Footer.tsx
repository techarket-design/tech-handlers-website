import { motion } from "framer-motion";
import { Linkedin, Twitter, Instagram, Youtube, ArrowUpRight, Facebook, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { DrawLine } from "./motion/AnimationUtils";
import logoImg from "@/assets/logo.png";
import { useSiteSettings, useFooterLinks } from "@/hooks/useData";
import { TrustBadgesInline } from "@/components/TrustBadgesStrip";

const socialIcons: Record<string, any> = { Linkedin, Twitter, Instagram, Youtube, Facebook };

export default function Footer() {
  const { data: settings } = useSiteSettings();
  const { data: dbFooterLinks } = useFooterLinks();

  const siteName = settings?.site_name || "Tech Handlers";
  const logoUrl = settings?.logo_url;
  const footerDesc = (settings as any)?.footer_description || "India's results-driven digital marketing & web development agency. Turning clicks into customers and code into revenue.";
  const credentialsUrl = (settings as any)?.credentials_url || "/TechHandlers_Credentials.pdf";

  // Build social links from settings
  const socials = [
    settings?.social_linkedin && { icon: Linkedin, label: "LinkedIn", url: settings.social_linkedin },
    settings?.social_twitter && { icon: Twitter, label: "Twitter", url: settings.social_twitter },
    settings?.social_instagram && { icon: Instagram, label: "Instagram", url: settings.social_instagram },
    settings?.social_youtube && { icon: Youtube, label: "YouTube", url: settings.social_youtube },
    settings?.social_facebook && { icon: Facebook, label: "Facebook", url: settings.social_facebook },
  ].filter(Boolean) as { icon: any; label: string; url: string }[];

  // If no social links in settings, show placeholders
  const displaySocials = socials.length > 0 ? socials : [
    { icon: Linkedin, label: "LinkedIn", url: "#" },
    { icon: Twitter, label: "Twitter", url: "#" },
    { icon: Instagram, label: "Instagram", url: "#" },
    { icon: Youtube, label: "YouTube", url: "#" },
  ];

  // Group footer links by category
  const footerLinkGroups: Record<string, { label: string; url: string }[]> = {};
  if ((dbFooterLinks as any[])?.length) {
    (dbFooterLinks as any[]).forEach((link: any) => {
      if (!footerLinkGroups[link.category]) footerLinkGroups[link.category] = [];
      footerLinkGroups[link.category].push({ label: link.label, url: link.url });
    });
  } else {
    footerLinkGroups["Company"] = [
      { label: "About Us", url: "/about" }, { label: "Case Studies", url: "/case-studies" },
      { label: "Blog", url: "/blog" }, { label: "Contact", url: "#contact" },
    ];
  }

  return (
    <footer className="section-dark pt-16 pb-8 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-primary/[0.02] blur-3xl" />
        <motion.div
          className="absolute -top-20 right-0 w-[28rem] h-[28rem] rounded-full bg-accent/[0.04] blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <motion.div
          className="grid sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10 mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
        >
          <motion.div
            className="lg:col-span-2"
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center gap-2.5 mb-4">
              <img src={logoUrl || logoImg} alt={siteName} className="h-9 w-auto" />
              <span className="font-display text-lg font-bold text-surface-white">{siteName}</span>
            </div>
            <p className="text-sm text-surface-white/40 leading-relaxed max-w-xs mb-4">{footerDesc}</p>
            <a href={credentialsUrl} download target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-white/[0.06] border border-surface-white/[0.1] text-surface-white/60 hover:text-surface-white hover:bg-surface-white/10 transition-all text-xs font-medium mb-4">
              <Download className="h-3.5 w-3.5" /> Download Credentials Deck
            </a>
            <div className="flex gap-3">
              {displaySocials.map((s, i) => (
                <motion.a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg bg-surface-white/[0.05] border border-surface-white/[0.08] flex items-center justify-center text-surface-white/40 hover:text-surface-white hover:bg-surface-white/10 hover:border-surface-white/15 transition-all"
                  whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }} aria-label={s.label}>
                  <s.icon className="h-3.5 w-3.5" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Dynamic footer link groups */}
          {Object.entries(footerLinkGroups).map(([title, links]) => (
            <motion.div
              key={title}
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <h4 className="font-display font-semibold text-surface-white text-sm mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {links.map((link, i) => (
                  <li key={i}>
                    {link.url.startsWith("/") && !link.url.startsWith("//") ? (
                      <Link to={link.url} className="text-sm text-surface-white/35 hover:text-surface-white/70 transition-colors inline-flex items-center gap-1 group">
                        <span className="relative">
                          {link.label}
                          <span className="absolute left-0 -bottom-0.5 h-px w-0 bg-primary/70 transition-all duration-300 group-hover:w-full" />
                        </span>
                        <ArrowUpRight className="h-2.5 w-2.5 -translate-x-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      </Link>
                    ) : (
                      <a href={link.url} className="text-sm text-surface-white/35 hover:text-surface-white/70 transition-colors inline-flex items-center gap-1 group">
                        <span className="relative">
                          {link.label}
                          <span className="absolute left-0 -bottom-0.5 h-px w-0 bg-primary/70 transition-all duration-300 group-hover:w-full" />
                        </span>
                        <ArrowUpRight className="h-2.5 w-2.5 -translate-x-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>

        <DrawLine className="bg-surface-white/[0.06]" />

        <div className="pt-6 space-y-4">
          <TrustBadgesInline variant="compact" />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-surface-white/[0.06]">
            <p className="text-xs text-surface-white/30">&copy; {new Date().getFullYear()} {siteName}. All rights reserved.</p>
            <div className="flex flex-wrap justify-center gap-x-5 gap-y-2">
              <Link to="/privacy-policy" className="text-xs text-surface-white/30 hover:text-surface-white/60 transition-colors">Privacy Policy</Link>
              <Link to="/terms-of-service" className="text-xs text-surface-white/30 hover:text-surface-white/60 transition-colors">Terms of Service</Link>
              <Link to="/refund-policy" className="text-xs text-surface-white/30 hover:text-surface-white/60 transition-colors">Refund Policy</Link>
              <Link to="/cookie-policy" className="text-xs text-surface-white/30 hover:text-surface-white/60 transition-colors">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
