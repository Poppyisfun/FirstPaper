"use client";

import { useEffect, useRef } from "react";

/**
 * Counts 0 → `to` once, on a 90ms tick like the reference. Writes to the node
 * directly rather than re-rendering per tick. Renders the final value
 * immediately when the viewer prefers reduced motion, so the number is never
 * withheld from anyone.
 */
export default function CountUp({
  to,
  delay = 600,
}: {
  to: number;
  delay?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (
      typeof matchMedia !== "undefined" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      el.textContent = String(to);
      return;
    }

    let iv: ReturnType<typeof setInterval>;
    const start = setTimeout(() => {
      let c = 0;
      iv = setInterval(() => {
        c++;
        el.textContent = String(c);
        if (c >= to) clearInterval(iv);
      }, 90);
    }, delay);

    return () => {
      clearTimeout(start);
      clearInterval(iv);
    };
  }, [to, delay]);

  return <span ref={ref}>0</span>;
}
