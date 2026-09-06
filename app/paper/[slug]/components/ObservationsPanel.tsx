"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { Observation } from "@/lib/observations";

export const OBS_HEADER =
  "Things you flagged while reading. These are the phrases worth a second look — hedged verbs, small numbers, claims that outrun their evidence.";

export const OBS_EMPTY =
  "You didn't flag anything while reading. Open some paragraphs next time — the phrases you notice are usually the ones the judging round asks about.";

/**
 * The phrases the reader surfaced while reading, carried forward so they can
 * be consulted during the judging round. Green while reading (comprehension),
 * because flagging is still part of understanding the paper.
 */
export default function ObservationsPanel({
  open,
  items,
  onClose,
  onJump,
  variant = "reading",
}: {
  open: boolean;
  items: Observation[];
  onClose: () => void;
  /** Absent in the judge phase, where there is nothing to jump back to. */
  onJump?: (o: Observation) => void;
  variant?: "reading" | "judge";
}) {
  const reduce = useReducedMotion();

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          className={`obs ${variant}`}
          role="region"
          aria-label="Observations you flagged while reading"
          initial={reduce ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? undefined : { opacity: 0, y: -8 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="obs-top">
            <p className="obs-h">{items.length ? OBS_HEADER : OBS_EMPTY}</p>
            <button
              type="button"
              className="obs-x"
              onClick={onClose}
              aria-label="Close observations"
            >
              ✕
            </button>
          </div>

          {items.length > 0 && (
            <ul className="obs-list">
              {items.map((o) => (
                <li key={`${o.key}-${o.phrase.slice(0, 12)}`}>
                  {onJump ? (
                    <button
                      type="button"
                      className="obs-item"
                      onClick={() => onJump(o)}
                    >
                      <span className="obs-sec">{o.sectionName}</span>
                      <span className="obs-p">&ldquo;{o.phrase}&rdquo;</span>
                    </button>
                  ) : (
                    <div className="obs-item static">
                      <span className="obs-sec">{o.sectionName}</span>
                      <span className="obs-p">&ldquo;{o.phrase}&rdquo;</span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
