import { MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useSiteSettings } from "@/hooks/useData";

export default function WhatsAppWidget() {
  const { data: settings } = useSiteSettings();
  const whatsappNumber = settings?.whatsapp_number?.replace(/[^0-9]/g, "") || "919319914755";
  const siteName = settings?.site_name || "Tech Handlers";

  return (
    <motion.a
      href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hi ${siteName}! I want to grow my business.`)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-2xl"
      style={{ backgroundColor: "#25D366" }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 1.5, type: "spring", stiffness: 300, damping: 20 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="h-7 w-7" style={{ color: "#FFFFFF" }} />
      <span
        className="absolute w-full h-full rounded-full pulse-marker"
        style={{ backgroundColor: "#25D366", opacity: 0.3 }}
      />
    </motion.a>
  );
}
