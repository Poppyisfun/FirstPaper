"use client";

import { motion, useReducedMotion } from "motion/react";
import type { Tier } from "@/lib/types";

export const TIERS: { k: Tier; nm: string; ds: string }[] = [
  {
    k: "e",
    nm: "Explorer",
    ds: "Plain language, short sentences, no jargon. Built for a curious middle schooler.",
  },
  {
    k: "r",
    nm: "Reader",
    ds: "AP-level depth. Explains the reasoning behind each move, not just the meaning.",
  },
  {
    k: "c",
    nm: "Critic",
    ds: "Early-undergraduate reading. Technical terms kept, with the methodological subtext made explicit.",
  },
];

/**
 * Reading-level picker. The tier changes only which note is shown — never the
 * paper text. Rendered full size on the intro and compact in the reading bar,
 * both driven by the same state.
 */
export default function TierDial({
  tier,
  onChange,
  size = "full",
  idPrefix = "tier",
}: {
  tier: Tier;
  onChange: (t: Tier) => void;
  size?: "full" | "compact";
  idPrefix?: string;
}) {
  const reduce = useReducedMotion();
  const current = TIERS.find((t) => t.k === tier);

  return (
    <div className={size === "full" ? "dial dial-full" : "dial dial-compact"}>
      <div className="dial-row" role="radiogroup" aria-label="Reading level">
        {TIERS.map((t) => (
          <button
            key={t.k}
            type="button"
            role="radio"
            aria-checked={t.k === tier}
            className={t.k === tier ? "dial-b on" : "dial-b"}
            onClick={() => onChange(t.k)}
          >
            {t.k === tier && !reduce && (
              <motion.span
                layoutId={`${idPrefix}-dial-pill`}
                className="dial-pill"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <span className="dial-t">{t.nm}</span>
          </button>
        ))}
      </div>
      {size === "full" && current && <p className="dial-ds">{current.ds}</p>}
    </div>
  );
}
