"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import type { ComponentProps, ReactNode } from "react";

/* ────────────────────────────────────────────────────────────────────────
   Shared motion vocabulary. Everything on the site animates through these
   so timing and easing stay consistent, and so `prefers-reduced-motion` is
   honoured in exactly one place instead of per component.
   ──────────────────────────────────────────────────────────────────────── */

/** Matches --ez in globals.css. */
export const EZ = [0.32, 0.72, 0, 1] as const;

export const springSoft = {
  type: "spring",
  stiffness: 260,
  damping: 26,
  mass: 0.9,
} as const;

export const springSnappy = {
  type: "spring",
  stiffness: 420,
  damping: 30,
} as const;

/** Heavy fade-up with a defocus. */
const riseVariants: Variants = {
  hidden: { opacity: 0, y: 28, filter: "blur(6px)" },
  shown: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.85, ease: EZ },
  },
};

const staticVariants: Variants = {
  hidden: { opacity: 1 },
  shown: { opacity: 1, transition: { duration: 0 } },
};

/**
 * The tags Rise can render as. Props are typed against motion.div throughout —
 * these all take the same shared attributes we actually pass.
 */
const TAGS = {
  div: motion.div,
  section: motion.section,
  article: motion.article,
  p: motion.p,
  h1: motion.h1,
  h2: motion.h2,
  figure: motion.figure,
} as const;

type RiseProps = {
  children: ReactNode;
  className?: string;
  /** Stagger, in seconds. Ignored inside a <Stagger>, which drives its own. */
  delay?: number;
  /** Render as a different element. */
  as?: keyof typeof TAGS;
} & Omit<ComponentProps<typeof motion.div>, "variants" | "initial" | "children">;

/**
 * Fades and lifts its children when they scroll into view, once.
 * Collapses to a plain fade-free render when the viewer prefers reduced motion.
 */
export function Rise({
  children,
  className,
  delay = 0,
  as = "div",
  ...rest
}: RiseProps) {
  const reduce = useReducedMotion();
  const Tag = TAGS[as] as typeof motion.div;

  return (
    <Tag
      className={className}
      variants={reduce ? staticVariants : riseVariants}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, amount: 0.15, margin: "0px 0px -60px 0px" }}
      transition={reduce ? undefined : { delay }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/**
 * Parent that reveals its <RiseItem> children one after another.
 * Use for card grids so the stagger comes from the container, not hand-tuned
 * per-item delays.
 */
export function Stagger({
  children,
  className,
  gap = 0.09,
  ...rest
}: {
  children: ReactNode;
  className?: string;
  /** Seconds between each child. */
  gap?: number;
} & Omit<ComponentProps<typeof motion.div>, "variants" | "initial">) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, amount: 0.1, margin: "0px 0px -60px 0px" }}
      variants={{
        hidden: {},
        shown: { transition: { staggerChildren: reduce ? 0 : gap } },
      }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** A single item inside <Stagger>. */
export function RiseItem({
  children,
  className,
  ...rest
}: {
  children: ReactNode;
  className?: string;
} & Omit<ComponentProps<typeof motion.div>, "variants">) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      variants={reduce ? staticVariants : riseVariants}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
