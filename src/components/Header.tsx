import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { Menu, X, ArrowRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSiteSettings, useNavLinks } from "@/hooks/useData";
import logoImg from "@/assets/logo.png";

const serviceLinks = [
  { label: "Digital Marketing", href: "/services/digital-marketing" },
  { label: "Performance Marketing", href: "/services/performance-marketing" },
  { label: "Web Development", href: "/services/web-development" },
  { label: "SEO", href: "/services/seo" },
  { label: "Social Media Marketing", href: "/services/social-media-marketing" },
  { label: "LinkedIn Automation", href: "/services/linkedin-automation" },
];

const mainNavLinks = [
  { label: "About", href: "/about", isPage: true },
  { label: "Case Studies", href: "/case-studies", isPage: true },
  { label: "Blog", href: "/blog", isPage: true },
  { label: "Contact", href: "contact" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const isAdmin = location.pathname.startsWith("/admin");
  const { data: settings } = useSiteSettings();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 40);
  });

  if (isAdmin) return null;

  const siteName = settings?.site_name || "Tech Handlers";
  const logoUrl = settings?.logo_url;

  const handleNav = (link: any) => {
    setMobileOpen(false);
    setServicesOpen(false);
    if (link.isPage || link.href.startsWith("/")) {
      navigate(link.href);
      return;
    }
    if (location.pathname !== "/") {
      navigate("/#" + link.href);
      return;
    }
    const el = document.getElementById(link.href);
    el?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <motion.header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? "bg-surface-white/80 backdrop-blur-xl shadow-[0_1px_0_hsl(var(--border))]" : "bg-transparent"
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="container mx-auto flex items-center justify-between h-16 lg:h-20 px-4 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5 group">
            <motion.img
              src={logoUrl || logoImg}
              alt={siteName}
              className="h-9 w-auto"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            />
            <span className="font-display text-xl font-bold text-lead">{siteName}</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-6">
            {/* Services Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setServicesOpen(true)}
              onMouseLeave={() => setServicesOpen(false)}
            >
              <motion.button
                className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-lead transition-colors py-1"
                whileHover="hover"
              >
                Services
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform duration-200 ${servicesOpen ? "rotate-180" : ""}`}
                />
              </motion.button>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={servicesOpen ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
                className={`absolute top-full left-1/2 -translate-x-1/2 pt-2 ${servicesOpen ? "pointer-events-auto" : "pointer-events-none"}`}
              >
                <div className="bg-background/95 backdrop-blur-xl border border-border rounded-xl shadow-xl p-2 min-w-[240px]">
                  {serviceLinks.map((link) => (
                    <button
                      key={link.label}
                      onClick={() => handleNav({ ...link, isPage: true })}
                      className={`block w-full text-left px-4 py-2.5 text-sm rounded-lg transition-colors ${
                        location.pathname === link.href
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-muted-foreground hover:text-lead hover:bg-muted/50"
                      }`}
                    >
                      {link.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Main Nav Links */}
            {mainNavLinks.map((link) => (
              <motion.button
                key={link.label}
                onClick={() => handleNav(link)}
                className="relative text-sm font-medium text-muted-foreground hover:text-lead transition-colors py-1"
                whileHover="hover"
              >
                {link.label}
                <motion.span
                  className="absolute bottom-0 left-0 right-0 h-0.5 gradient-primary-accent rounded-full"
                  variants={{ hover: { scaleX: 1, opacity: 1 } }}
                  initial={{ scaleX: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ transformOrigin: "left" }}
                />
              </motion.button>
            ))}

            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                size="sm"
                className="gradient-primary-accent text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-shadow px-5"
                onClick={() => handleNav({ href: "contact" })}
              >
                Get in Touch <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </motion.div>
          </nav>

          <motion.button
            className="lg:hidden p-2 text-lead"
            onClick={() => setMobileOpen(!mobileOpen)}
            whileTap={{ scale: 0.9 }}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </motion.button>
        </div>

        {/* Mobile Menu */}
        <motion.div
          initial={false}
          animate={mobileOpen ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="lg:hidden overflow-hidden bg-surface-white/95 backdrop-blur-xl border-b border-border"
        >
          <div className="px-4 pb-4 pt-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-0 py-2">
              Services
            </p>
            {serviceLinks.map((link, i) => (
              <motion.button
                key={link.label}
                onClick={() => handleNav({ ...link, isPage: true })}
                className={`block w-full text-left py-2.5 text-sm font-medium border-b border-border/50 last:border-0 ${
                  location.pathname === link.href ? "text-primary" : "text-muted-foreground hover:text-lead"
                }`}
                initial={{ opacity: 0, x: -20 }}
                animate={mobileOpen ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                transition={{ delay: i * 0.04 + 0.1 }}
              >
                {link.label}
              </motion.button>
            ))}

            <div className="h-px bg-border my-2" />

            {mainNavLinks.map((link, i) => (
              <motion.button
                key={link.label}
                onClick={() => handleNav(link)}
                className="block w-full text-left py-2.5 text-sm font-medium text-muted-foreground hover:text-lead"
                initial={{ opacity: 0, x: -20 }}
                animate={mobileOpen ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                transition={{ delay: (serviceLinks.length + i) * 0.04 + 0.1 }}
              >
                {link.label}
              </motion.button>
            ))}

            <Button
              className="w-full gradient-primary-accent text-primary-foreground mt-3"
              onClick={() => handleNav({ href: "contact" })}
            >
              Get in Touch
            </Button>
          </div>
        </motion.div>
      </motion.header>
    </>
  );
}
