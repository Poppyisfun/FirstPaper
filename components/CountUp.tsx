"use client";

import { useEffect, useRef } from "react";
import { animate, useInView, useReducedMotion } from "motion/react";

/**
 * Counts up to `to` the first time it scrolls into view. Writes to the node
 * rather than through state, so a 60fps count costs no React renders.
 * Reduced motion gets the final number immediately.
 */
export default function CountUp({
  to,
  delay = 0,
}: {
  to: number;
  delay?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || !inView) return;

    if (reduce) {
      el.textContent = String(to);
      return;
    }

    const controls = animate(0, to, {
      duration: 1.1,
      delay,
      ease: [0.32, 0.72, 0, 1],
      onUpdate: (v) => {
        el.textContent = String(Math.round(v));
      },
    });

    return () => controls.stop();
  }, [inView, to, delay, reduce]);

  return <span ref={ref}>0</span>;
}
