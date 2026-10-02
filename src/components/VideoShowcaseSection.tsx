import { useEffect, useMemo, useRef, useState } from "react";
import { useGenericTable } from "@/hooks/useData";
import { cn } from "@/lib/utils";
import { Play, Pause, Volume2, VolumeX, ChevronLeft, ChevronRight, Loader2, RefreshCw } from "lucide-react";

type VideoItem = {
  id: string;
  title: string | null;
  description: string | null;
  poster_url: string | null;
  video_url: string;
  video_url_hd: string | null;
  video_url_sd: string | null;
  sort_order: number;
  is_active: boolean;
};

type Quality = "sd" | "hd" | "source";

// Choose an initial quality based on the visitor's connection. Falls back to
// the source (highest available) when Network Information API is unavailable.
function pickInitialQuality(): Quality {
  if (typeof navigator === "undefined") return "source";
  const conn = (navigator as any).connection;
  if (!conn) return "source";
  if (conn.saveData) return "sd";
  const t = conn.effectiveType as string | undefined;
  if (t === "slow-2g" || t === "2g") return "sd";
  if (t === "3g") return "hd";
  return "source";
}

function pickSourceForItem(item: VideoItem, q: Quality): string {
  if (q === "sd") return item.video_url_sd || item.video_url_hd || item.video_url;
  if (q === "hd") return item.video_url_hd || item.video_url || item.video_url_sd!;
  return item.video_url || item.video_url_hd || item.video_url_sd!;
}

export default function VideoShowcaseSection() {
  const { data, isLoading, isError, refetch } = useGenericTable("video_showcase_items", {
    filter: { is_active: true },
    orderBy: "sort_order",
    ascending: true,
  });
  const items = useMemo(() => ((data as any[]) || []).filter((i) => i.is_active) as VideoItem[], [data]);

  const [quality, setQuality] = useState<Quality>("source");
  useEffect(() => setQuality(pickInitialQuality()), []);
  const [muted, setMuted] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [pendingPlayId, setPendingPlayId] = useState<string | null>(null);
  const [loadingVideoId, setLoadingVideoId] = useState<string | null>(null);
  const [loadedIds, setLoadedIds] = useState<Set<string>>(() => new Set());
  const [readyIds, setReadyIds] = useState<Set<string>>(() => new Set());

  const sectionRef = useRef<HTMLElement | null>(null);
  const headingRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  // React to connection changes on the fly (e.g. user drops to 3G mid-visit).
  useEffect(() => {
    const conn = (navigator as any)?.connection;
    if (!conn?.addEventListener) return;
    const onChange = () => setQuality(pickInitialQuality());
    conn.addEventListener("change", onChange);
    return () => conn.removeEventListener("change", onChange);
  }, []);

  // Keep the section visible immediately; videos load lazily per-card instead.
  const [revealed, setRevealed] = useState(true);
  useEffect(() => {
    if (!sectionRef.current || revealed) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setRevealed(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(sectionRef.current);
    return () => io.disconnect();
  }, [revealed]);

  useEffect(() => {
    if (!items.length || activeId) return;
    setActiveId(items[0].id);
    setLoadedIds((prev) => {
      const next = new Set(prev);
      items.slice(0, 2).forEach((item) => next.add(item.id));
      return next;
    });
  }, [items, activeId]);

  // Track which reel is centered and only wake nearby videos. This keeps the
  // section visible quickly instead of asking every reel to load at once.
  useEffect(() => {
    if (!items.length) return;
    const track = trackRef.current;
    const els = track?.querySelectorAll<HTMLElement>("[data-video-card]");
    if (!els?.length) return;

    const activeObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const id = e.target.getAttribute("data-id");
          if (!id) return;
          if (e.isIntersecting && e.intersectionRatio > 0.55) {
            setActiveId(id);
          }
        });
      },
      { root: track, threshold: [0, 0.55, 0.8] }
    );

    const nearbyObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const id = e.target.getAttribute("data-id");
          if (!id) return;
          setLoadedIds((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
        });
      },
      { root: track, rootMargin: "360px", threshold: 0.01 }
    );

    els.forEach((el) => {
      activeObserver.observe(el);
      nearbyObserver.observe(el);
    });
    return () => {
      activeObserver.disconnect();
      nearbyObserver.disconnect();
    };
  }, [items.length]);

  // Convert vertical mouse wheel to horizontal scroll on desktop for a smooth
  // reels-style browse. rAF-batched to avoid jank.
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    if (window.matchMedia("(pointer: coarse)").matches) return; // touch devices scroll natively
    let pending = 0;
    let frame = 0;
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY === 0 || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      const canMoveLeft = el.scrollLeft > 0;
      const canMoveRight = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
      if ((e.deltaY < 0 && !canMoveLeft) || (e.deltaY > 0 && !canMoveRight)) return;
      e.preventDefault();
      pending += e.deltaY;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        if (!pending) return;
        el.scrollLeft += pending;
        pending = 0;
        frame = 0;
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      el.removeEventListener("wheel", onWheel as any);
    };
  }, [items.length]);

  useEffect(() => {
    if (!pendingPlayId || !loadedIds.has(pendingPlayId)) return;
    const timer = window.setTimeout(() => {
      const v = videoRefs.current[pendingPlayId];
      if (!v) return;
      Object.entries(videoRefs.current).forEach(([key, el]) => {
        if (key !== pendingPlayId && el && !el.paused) el.pause();
      });
      setLoadingVideoId(pendingPlayId);
      v.play()
        .then(() => {
          setPlayingId(pendingPlayId);
          setPendingPlayId(null);
          setLoadingVideoId(null);
        })
        .catch(() => {
          setPendingPlayId(null);
          setLoadingVideoId(null);
        });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [pendingPlayId, loadedIds, quality]);

  const togglePlay = (id: string) => {
    if (!loadedIds.has(id)) {
      setLoadingVideoId(id);
      setPendingPlayId(id);
      setLoadedIds((prev) => new Set(prev).add(id));
      return;
    }
    const v = videoRefs.current[id];
    if (!v) {
      setPendingPlayId(id);
      return;
    }
    // Pause any other playing video for a clean, single-focus experience.
    Object.entries(videoRefs.current).forEach(([key, el]) => {
      if (key !== id && el && !el.paused) el.pause();
    });
    if (v.paused) {
      setLoadingVideoId(id);
      v.play()
        .then(() => {
          setPlayingId(id);
          setLoadingVideoId(null);
        })
        .catch(() => setLoadingVideoId(null));
    } else {
      v.pause();
      setPlayingId((cur) => (cur === id ? null : cur));
    }
  };

  const scrollBy = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-video-card]");
    const step = card ? card.offsetWidth + 20 : 320;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  const qualityLabel = useMemo(
    () => (quality === "sd" ? "Data saver" : quality === "hd" ? "HD" : "Best"),
    [quality]
  );

  useEffect(() => {
    setReadyIds(new Set());
  }, [quality]);

  if (isLoading) {
    return (
      <section id="video-showcase" className="relative py-16 md:py-24 bg-gradient-to-b from-background via-surface-white to-background overflow-hidden">
        <div className="container mx-auto max-w-7xl px-4 mb-8 md:mb-12 relative">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-3">Reels · Video showcase</p>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-lead leading-tight">See our work in motion</h2>
          <p className="mt-3 text-muted-foreground max-w-xl">Loading lightweight previews first so you can start browsing faster.</p>
        </div>
        <div className="flex gap-4 md:gap-5 overflow-hidden px-4 md:px-12 pb-6">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="relative shrink-0 w-[75vw] xs:w-[65vw] sm:w-[300px] md:w-[280px] lg:w-[300px] aspect-[9/16] rounded-3xl border border-border bg-muted overflow-hidden"
            >
              <div className="absolute inset-0 animate-pulse bg-gradient-to-b from-muted via-surface-white to-muted" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section id="video-showcase" className="relative py-16 md:py-24 bg-gradient-to-b from-background via-surface-white to-background overflow-hidden">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-3">Reels · Video showcase</p>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-lead leading-tight">See our work in motion</h2>
          <p className="mt-3 text-muted-foreground">The reels are taking longer than expected. Try loading them again.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <RefreshCw className="h-4 w-4" />
            Retry videos
          </button>
        </div>
      </section>
    );
  }

  if (!items.length) return null;

  return (
    <section
      ref={sectionRef}
      id="video-showcase"
      className="relative py-16 md:py-24 bg-gradient-to-b from-background via-surface-white to-background overflow-hidden"
    >
      {/* Ambient background — pure CSS, no libs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden [mask-image:radial-gradient(ellipse_at_top,black,transparent_75%)]">
        <div className="absolute -top-32 left-1/4 w-[560px] h-[560px] rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute top-10 right-0 w-[480px] h-[480px] rounded-full bg-accent/10 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <div
        ref={headingRef}
        className="container mx-auto max-w-7xl px-4 mb-8 md:mb-12 relative"
      >
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-3">
              Reels · Video showcase
            </p>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-lead leading-tight">
              See our work in motion
            </h2>
            <p className="mt-3 text-muted-foreground max-w-xl">
              Tap any reel to play. Brand films, ad creatives, and product stories we've built for clients.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="inline-flex rounded-full border border-border bg-surface-white p-1">
              {(["sd", "hd", "source"] as Quality[]).map((q) => (
                <button
                  key={q}
                  onClick={() => setQuality(q)}
                  className={cn(
                    "px-3 py-1.5 rounded-full transition-colors font-medium",
                    quality === q ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-lead"
                  )}
                  aria-pressed={quality === q}
                >
                  {q === "sd" ? "Data saver" : q === "hd" ? "HD" : "Best"}
                </button>
              ))}
            </div>
            <button
              onClick={() => setMuted((m) => !m)}
              className="p-2 rounded-full border border-border bg-surface-white text-muted-foreground hover:text-lead transition-colors"
              aria-label={muted ? "Unmute videos" : "Mute videos"}
              title={muted ? "Unmute" : "Mute"}
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Auto-selected <span className="font-semibold text-lead">{qualityLabel}</span> for your connection.
        </p>
      </div>

      <div className="relative">
        {/* Desktop arrow controls */}
        <div className="hidden md:block">
          <button
            onClick={() => scrollBy(-1)}
            aria-label="Previous reels"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-11 w-11 rounded-full bg-surface-white border border-border shadow-lg hover:bg-white hover:scale-110 active:scale-95 transition-all flex items-center justify-center text-lead"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => scrollBy(1)}
            aria-label="Next reels"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-11 w-11 rounded-full bg-surface-white border border-border shadow-lg hover:bg-white hover:scale-110 active:scale-95 transition-all flex items-center justify-center text-lead"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div
          ref={trackRef}
          className={cn(
            "flex gap-4 md:gap-5 overflow-x-auto snap-x snap-proximity",
            "px-4 md:px-12 pb-6",
            "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          )}
          style={{ scrollBehavior: "smooth", overscrollBehaviorX: "contain" }}
        >
          {items.map((item, i) => {
            const src = pickSourceForItem(item, quality);
            const isActive = activeId === item.id;
            const isPlaying = playingId === item.id;
            const shouldLoadMedia = loadedIds.has(item.id) || isPlaying || pendingPlayId === item.id;
            const isBuffering = loadingVideoId === item.id || pendingPlayId === item.id;
            const isReady = readyIds.has(item.id);
            return (
              <button
                key={item.id}
                type="button"
                data-video-card
                data-id={item.id}
                onClick={() => togglePlay(item.id)}
                style={{
                  transitionDelay: `${Math.min(i, 4) * 40}ms`,
                }}
                className={cn(
                  "group relative shrink-0 snap-center text-left",
                  "w-[75vw] xs:w-[65vw] sm:w-[300px] md:w-[280px] lg:w-[300px]",
                  "rounded-3xl overflow-hidden border border-border bg-black shadow-xl",
                  "transition-transform duration-300 ease-out will-change-transform",
                  "hover:-translate-y-1.5",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  isActive && "ring-2 ring-primary/70 shadow-primary/20",
                  isPlaying && "ring-4 ring-primary shadow-primary/40"
                )}
              >
                {/* Portrait 9:16 reel */}
                <div className="relative aspect-[9/16] w-full">
                  <div className="absolute inset-0 bg-gradient-to-br from-lead via-primary/70 to-accent/60" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  {!item.poster_url && !isReady && (
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.35),transparent_34%),radial-gradient(circle_at_70%_65%,hsl(var(--accent)/0.35),transparent_38%)]" />
                  )}
                  <video
                    ref={(el) => { videoRefs.current[item.id] = el; }}
                    key={`${item.id}-${quality}`}
                    src={shouldLoadMedia ? src : undefined}
                    poster={item.poster_url || undefined}
                    muted={muted}
                    loop
                    playsInline
                    preload={isPlaying || pendingPlayId === item.id ? "auto" : "none"}
                    onLoadStart={() => {
                      if (pendingPlayId === item.id) setLoadingVideoId(item.id);
                    }}
                    onCanPlay={() => setLoadingVideoId((cur) => (cur === item.id ? null : cur))}
                    onLoadedData={() => {
                      setReadyIds((prev) => (prev.has(item.id) ? prev : new Set(prev).add(item.id)));
                      setLoadingVideoId((cur) => (cur === item.id ? null : cur));
                    }}
                    onWaiting={() => setLoadingVideoId(item.id)}
                    onPlay={() => setPlayingId(item.id)}
                    onPause={() => setPlayingId((cur) => (cur === item.id ? null : cur))}
                    className={cn(
                      "absolute inset-0 w-full h-full object-cover transition-opacity duration-300",
                      item.poster_url || isReady || isPlaying ? "opacity-100" : "opacity-0"
                    )}
                  />

                  {/* Gradient overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30 pointer-events-none" />

                  {/* Center play/pause pill */}
                  <div
                    className={cn(
                      "absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-300",
                      isPlaying ? "opacity-0 scale-75" : "opacity-100 scale-100"
                    )}
                  >
                    <div className="rounded-full bg-white/95 p-5 shadow-2xl ring-4 ring-white/30 group-hover:scale-110 transition-transform">
                      {isBuffering ? (
                        <Loader2 className="h-7 w-7 text-lead animate-spin" />
                      ) : (
                        <Play className="h-7 w-7 text-lead fill-lead ml-0.5" />
                      )}
                    </div>
                  </div>

                  {/* Live pause indicator (visible on hover while playing) */}
                  {isPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="rounded-full bg-black/70 p-4 shadow-xl">
                        <Pause className="h-6 w-6 text-white fill-white" />
                      </div>
                    </div>
                  )}

                  {/* Top badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span
                      className={cn(
                        "flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        isPlaying
                          ? "bg-primary text-primary-foreground"
                          : "bg-white/20 text-white border border-white/30"
                      )}
                    >
                        {isPlaying && <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />}
                       {isBuffering ? "Loading" : isPlaying ? "Playing" : "Tap to play"}
                    </span>
                  </div>

                  {/* Bottom text */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    {item.title && (
                      <h3 className="font-display font-semibold text-base md:text-lg leading-tight drop-shadow-lg">
                        {item.title}
                      </h3>
                    )}
                    {item.description && (
                      <p className="mt-1 text-xs text-white/85 line-clamp-2 drop-shadow">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Mobile hint */}
        <p className="md:hidden text-center text-[11px] text-muted-foreground mt-1">
          Swipe to browse · Tap a reel to play
        </p>
      </div>
    </section>
  );
}