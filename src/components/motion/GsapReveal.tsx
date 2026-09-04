import { useLayoutEffect, useRef, type ReactNode, type ElementType, type CSSProperties } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useIsMobile } from "@/hooks/use-mobile";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type Direction = "up" | "down" | "left" | "right" | "fade" | "zoom";

interface GsapRevealProps {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  direction?: Direction;
  distance?: number;
  duration?: number;
  delay?: number;
  stagger?: number;
  start?: string;
  /** When true, animate children individually (direct children get staggered reveal) */
  staggerChildren?: boolean;
  /** Reduce/disable animation on mobile */
  disableOnMobile?: boolean;
}

export default function GsapReveal({
  children,
  as: Tag = "div",
  className,
  style,
  direction = "up",
  distance = 40,
  duration = 0.9,
  delay = 0,
  stagger = 0.08,
  start = "top 85%",
  staggerChildren = false,
  disableOnMobile = false,
}: GsapRevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const isMobile = useIsMobile();

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (disableOnMobile && isMobile) return;

    const targets: Element[] = staggerChildren ? Array.from(el.children) : [el];
    if (targets.length === 0) return;

    const from: gsap.TweenVars = { opacity: 0 };
    if (direction === "up") from.y = distance;
    if (direction === "down") from.y = -distance;
    if (direction === "left") from.x = -distance;
    if (direction === "right") from.x = distance;
    if (direction === "zoom") from.scale = 0.9;

    const ctx = gsap.context(() => {
      gsap.from(targets, {
        ...from,
        duration,
        delay,
        stagger: staggerChildren ? stagger : 0,
        ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          start,
          toggleActions: "play none none none",
        },
      });
    }, el);

    return () => ctx.revert();
  }, [direction, distance, duration, delay, stagger, start, staggerChildren, disableOnMobile, isMobile]);

  const Component: any = Tag;
  return (
    <Component ref={ref} className={className} style={style}>
      {children}
    </Component>
  );
}
