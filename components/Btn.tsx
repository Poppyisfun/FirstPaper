"use client";

import Link from "next/link";
import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import type { ReactNode } from "react";
import { springSnappy } from "@/components/motion-primitives";

const MotionLink = motion.create(Link);

type Common = {
  children: ReactNode;
  /** Visual variant, appended to `.btn` (pri | ghost | glow-b | v | lg). */
  variant?: string;
  /** Trailing glyph, rendered inside its own circle. */
  icon?: string;
  className?: string;
};

/**
 * Buttons carry the site's press physics: a small lift on hover and a real
 * compression on press, both on a spring so they feel like they have mass.
 * The trailing arrow lives in its own circle and drifts on hover.
 */
function useGestures() {
  const reduce = useReducedMotion();
  if (reduce) return {};
  return {
    whileHover: { y: -2 },
    whileTap: { scale: 0.97, y: 0 },
    transition: springSnappy,
  };
}

export function BtnLink({
  href,
  children,
  variant = "",
  icon,
  className = "",
}: Common & { href: string }) {
  const gestures = useGestures();

  return (
    <MotionLink
      href={href}
      className={`btn ${variant} ${className}`.trim()}
      {...gestures}
    >
      {children}
      {icon && (
        <span className="ic" aria-hidden="true">
          {icon}
        </span>
      )}
    </MotionLink>
  );
}

export function BtnAnchor({
  href,
  children,
  variant = "",
  icon,
  className = "",
}: Common & { href: string }) {
  const gestures = useGestures();

  return (
    <motion.a
      href={href}
      className={`btn ${variant} ${className}`.trim()}
      {...gestures}
    >
      {children}
      {icon && (
        <span className="ic" aria-hidden="true">
          {icon}
        </span>
      )}
    </motion.a>
  );
}

export function BtnButton({
  children,
  variant = "",
  icon,
  className = "",
  ...rest
}: Common & Omit<HTMLMotionProps<"button">, "children" | "className">) {
  const gestures = useGestures();

  return (
    <motion.button
      className={`btn ${variant} ${className}`.trim()}
      {...gestures}
      {...rest}
    >
      {children}
      {icon && (
        <span className="ic" aria-hidden="true">
          {icon}
        </span>
      )}
    </motion.button>
  );
}
