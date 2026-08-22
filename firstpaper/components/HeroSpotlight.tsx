"use client";

import { useRef } from "react";
import type { ReactNode } from "react";

/**
 * The dark hero with layered radial glows and a spotlight that follows the
 * cursor. Writes the position straight to the node's transform so the pointer
 * never triggers a React render, and only fades the spot in once the pointer
 * has actually moved — touch users never see a stray blob.
 */
export default function HeroSpotlight({ children }: { children: ReactNode }) {
  const heroRef = useRef<HTMLDivElement>(null);
  const spotRef = useRef<HTMLDivElement>(null);
  const frame = useRef<number | null>(null);

  function track(e: React.MouseEvent<HTMLDivElement>) {
    const hero = heroRef.current;
    const spot = spotRef.current;
    if (!hero || !spot) return;

    const { clientX, clientY } = e;
    if (frame.current !== null) return;

    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      const r = hero.getBoundingClientRect();
      spot.style.transform = `translate(${clientX - r.left}px, ${clientY - r.top}px) translate(-50%, -50%)`;
      spot.classList.add("lit");
    });
  }

  return (
    <div ref={heroRef} className="hero" onMouseMove={track}>
      <div className="glow" />
      <div ref={spotRef} className="spot" />
      {children}
    </div>
  );
}
