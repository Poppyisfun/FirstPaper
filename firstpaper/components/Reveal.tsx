"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties, ElementType, ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  /** Element to render as — defaults to a div. */
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
};

/**
 * Fade-up on scroll, ported from the reference IntersectionObserver.
 * Toggles the class on the node directly rather than through state — the
 * class IS the animation, so this is DOM sync, not render state. Falls back
 * to visible when IO is unavailable; prefers-reduced-motion is handled in
 * globals.css, which pins .reveal to its resting state.
 */
export default function Reveal({
  children,
  as: Tag = "div",
  className = "",
  style,
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("in");
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={className ? `reveal ${className}` : "reveal"}
      style={style}
    >
      {children}
    </Tag>
  );
}
