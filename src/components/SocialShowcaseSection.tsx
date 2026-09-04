import { useEffect, useMemo, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Heart, MessageCircle, Instagram, Facebook, Twitter, Linkedin, Youtube, ExternalLink, Sparkles } from "lucide-react";
import { useGenericTable, useSiteSettings } from "@/hooks/useData";

const platformMeta: Record<string, { icon: any; ring: string; gradient: string; label: string }> = {
  instagram: { icon: Instagram, ring: "ring-pink-500/40", gradient: "from-fuchsia-500 via-pink-500 to-amber-400", label: "Instagram" },
  facebook:  { icon: Facebook,  ring: "ring-blue-500/40",  gradient: "from-blue-600 to-indigo-500", label: "Facebook" },
  twitter:   { icon: Twitter,   ring: "ring-sky-500/40",   gradient: "from-sky-500 to-cyan-400", label: "Twitter / X" },
  linkedin:  { icon: Linkedin,  ring: "ring-blue-700/40",  gradient: "from-blue-700 to-blue-500", label: "LinkedIn" },
  youtube:   { icon: Youtube,   ring: "ring-red-500/40",   gradient: "from-red-600 to-rose-500", label: "YouTube" },
};

const fallbackPosts = [
  { id: "f1", platform: "instagram", image_url: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800", caption: "Festive campaign creative for a D2C beauty brand 💄✨", likes: 2410, comments: 184, author_name: "Glow Beauty Co.", author_handle: "Client · Beauty" },
  { id: "f2", platform: "linkedin",  image_url: "https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=800", caption: "Thought-leadership post we built for a SaaS founder.", likes: 980, comments: 72, author_name: "NorthEdge SaaS", author_handle: "Client · B2B SaaS" },
  { id: "f3", platform: "facebook",  image_url: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800", caption: "Lead-gen ad creative that scaled a real-estate brand.", likes: 1820, comments: 142, author_name: "Skyline Realty", author_handle: "Client · Real Estate" },
  { id: "f4", platform: "instagram", image_url: "https://images.unsplash.com/photo-1556155092-490a1ba16284?w=800", caption: "Reel concept + edit for a fast-growing café chain ☕️", likes: 3120, comments: 218, author_name: "Brew & Co.", author_handle: "Client · F&B" },
  { id: "f5", platform: "twitter",   image_url: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800", caption: "Launch tweet thread we wrote for a fintech client.", likes: 740, comments: 96, author_name: "PayPivot", author_handle: "Client · Fintech" },
  { id: "f6", platform: "youtube",   image_url: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800", caption: "Ad film we produced for a D2C wellness brand 📈", likes: 2210, comments: 312, author_name: "VitaLeaf", author_handle: "Client · Wellness" },
];

function FloatingShape({ className, delay = 0 }: { className: string; delay?: number }) {
  return (
    <motion.div
      className={className}
      animate={{ y: [0, -22, 0], rotate: [0, 6, 0] }}
      transition={{ duration: 7 + delay, repeat: Infinity, ease: "easeInOut", delay }}
    />
  );
}

function PostCard({ post, index }: { post: any; index: number }) {
  const meta = platformMeta[post.platform] || platformMeta.instagram;
  const Icon = meta.icon;
  const ref = useRef<HTMLAnchorElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.a
      ref={ref}
      href={post.link_url || "#"}
      target={post.link_url ? "_blank" : undefined}
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.55, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -8, scale: 1.015 }}
      className="group relative block break-inside-avoid mb-5 rounded-2xl overflow-hidden bg-surface-white shadow-[0_4px_24px_-8px_rgba(0,0,0,0.12)] hover:shadow-[0_18px_44px_-12px_rgba(0,0,0,0.25)] transition-shadow border border-border/40"
    >
      {/* Top gradient bar */}
      <div className={`h-1 bg-gradient-to-r ${meta.gradient}`} />

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className={`relative w-9 h-9 rounded-full bg-gradient-to-br ${meta.gradient} p-[2px]`}>
          <div className="w-full h-full rounded-full bg-surface-white flex items-center justify-center">
            <Icon className="h-4 w-4 text-lead" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-lead truncate">{post.author_name || "Tech Handlers"}</p>
          <p className="text-[11px] text-muted-foreground truncate">{post.author_handle || meta.label}</p>
        </div>
        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Image */}
      <div className="relative overflow-hidden bg-muted aspect-[4/5]">
        <motion.img
          src={post.image_url}
          alt={post.caption || "Social post"}
          loading="lazy"
          className="w-full h-full object-cover"
          whileHover={{ scale: 1.06 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Caption + meta */}
      <div className="p-4 space-y-2">
        {post.caption && (
          <p className="text-sm text-lead/80 line-clamp-2 leading-relaxed">{post.caption}</p>
        )}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Heart className="h-3.5 w-3.5 text-rose-500" /> {Number(post.likes || 0).toLocaleString()}
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="h-3.5 w-3.5 text-sky-500" /> {Number(post.comments || 0).toLocaleString()}
          </span>
        </div>
      </div>
    </motion.a>
  );
}

export default function SocialShowcaseSection() {
  const { data: settings } = useSiteSettings();
  const { data: dbPosts } = useGenericTable("social_posts" as any, { filter: { is_active: true }, orderBy: "sort_order" });

  const posts = useMemo(() => {
    const list = (dbPosts as any[])?.length ? (dbPosts as any[]) : fallbackPosts;
    return list;
  }, [dbPosts]);

  const heading = (settings as any)?.social_showcase_heading || "Creative We Ship For Clients";
  const subheading = (settings as any)?.social_showcase_subheading || "Reels, ads, posts and campaigns we've designed and shipped for brands across India.";

  return (
    <section id="social" className="relative py-20 lg:py-28 overflow-hidden bg-gradient-to-b from-surface-white via-surface-white to-muted/30">
      {/* Decorative animated shapes */}
      <div className="absolute inset-0 pointer-events-none">
        <FloatingShape className="absolute top-12 -left-10 w-72 h-72 rounded-full bg-gradient-to-br from-pink-400/20 to-fuchsia-500/10 blur-3xl" />
        <FloatingShape className="absolute top-1/3 -right-16 w-96 h-96 rounded-full bg-gradient-to-br from-sky-400/20 to-indigo-500/10 blur-3xl" delay={1.2} />
        <FloatingShape className="absolute bottom-10 left-1/3 w-80 h-80 rounded-full bg-gradient-to-br from-amber-300/20 to-rose-400/10 blur-3xl" delay={2.4} />
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <motion.div
          className="text-center max-w-2xl mx-auto mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-pink-500/10 via-fuchsia-500/10 to-sky-500/10 border border-pink-500/20 mb-4"
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles className="h-3.5 w-3.5 text-pink-500" />
            <span className="text-xs font-semibold tracking-wide uppercase bg-gradient-to-r from-pink-600 to-sky-600 bg-clip-text text-transparent">Client Work · Social Wall</span>
          </motion.div>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-lead leading-tight">
            {heading}
          </h2>
          <p className="mt-4 text-base md:text-lg text-muted-foreground">{subheading}</p>
        </motion.div>

        {/* Masonry grid */}
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 max-w-6xl mx-auto">
          {posts.map((p: any, i: number) => (
            <PostCard key={p.id} post={p} index={i} />
          ))}
        </div>

        {/* Marquee handles caption */}
        <motion.p
          className="text-center text-xs text-muted-foreground mt-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          Want this kind of creative for your brand? <span className="font-semibold text-lead">Talk to us.</span>
        </motion.p>
      </div>
    </section>
  );
}
