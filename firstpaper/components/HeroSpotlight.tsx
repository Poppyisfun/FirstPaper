"use client";

import { useRef, useState } from "react";
import type { ReactNode } from "react";

/**
 * The dark hero with grain, layered radial glows, and a spotlight that
 * follows the cursor. Pointer-only — it never moves without a mouse, and
 * prefers-reduced-motion kills the easing in globals.css.
 */
export default function HeroSpotlight({ children }: { children: ReactNode }) {
  const heroRef = useRef<HTMLDivElement>(null);
  const [spot, setSpot] = useState<{ left: number; top: number } | null>(null);

  return (
    <div
      ref={heroRef}
      className="hero grain"
      onMouseMove={(e) => {
        const rect = heroRef.current?.getBoundingClientRect();
        if (!rect) return;
        setSpot({ left: e.clientX - rect.left, top: e.clientY - rect.top });
      }}
    >
      <div className="glow" />
      <div
        className="spot"
        style={spot ? { left: spot.left, top: spot.top } : undefined}
      />
      {children}
    </div>
  );
}
