"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { Para, Tier } from "@/lib/types";

export type ParaState = "open" | "solo" | "peek";

/**
 * One paragraph of the paper: the authors' verbatim text, plus the green dot
 * that offers help but asks you to try first.
 *
 * `para.t` goes through dangerouslySetInnerHTML because the source carries
 * <i>, <sub>, <sup> and <mark class="t">. It is never transformed — changing
 * the tier swaps the note beside it and nothing else.
 */
export default function Paragraph({
  para,
  tier,
  state,
  promptOpen,
  onOpenPrompt,
  onSolo,
  onPeek,
}: {
  para: Para;
  tier: Tier;
  state: ParaState;
  promptOpen: boolean;
  onOpenPrompt: () => void;
  onSolo: () => void;
  onPeek: () => void;
}) {
  const reduce = useReducedMotion();
  const resolved = state !== "open";

  const dotClass =
    state === "solo" ? "dot solo" : state === "peek" ? "dot read" : "dot";

  const rise = reduce
    ? {}
    : {
        initial: { opacity: 0, y: -6 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -6 },
        transition: { duration: 0.28, ease: [0.32, 0.72, 0, 1] as const },
      };

  return (
    <div className="rp-row">
      <div className={resolved ? "rp-main resolved" : "rp-main"}>
        {para.h && <h3 className="pp-h">{para.h}</h3>}

        <div className="rp-para">
          <button
            type="button"
            className={dotClass}
            onClick={onOpenPrompt}
            disabled={resolved}
            aria-label="Explain this paragraph"
            data-hint="Explain this paragraph"
            aria-expanded={promptOpen}
          >
            {state === "solo" ? "✓" : state === "peek" ? "◆" : "?"}
          </button>

          {/* Verbatim from the paper. Never altered. */}
          <p dangerouslySetInnerHTML={{ __html: para.t }} />

          <AnimatePresence initial={false}>
            {promptOpen && !resolved && (
              <motion.div className="think" key="think" {...rise}>
                <div className="think-l">&#9670; Try it yourself first</div>
                <p>
                  Say this paragraph back in your own words, in your head. Did
                  it make sense?
                </p>
                <div className="think-row">
                  <button type="button" className="tb solo" onClick={onSolo}>
                    I&rsquo;ve got it · +8 XP
                  </button>
                  <button type="button" className="tb" onClick={onPeek}>
                    Show me anyway · −5 bonus
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Desktop: right margin column. Below 900px the grid collapses and this
          falls inline directly beneath the paragraph. */}
      <div className="rp-margin">
        <AnimatePresence initial={false}>
          {state === "peek" && (
            <motion.aside className="note" key={tier} {...rise}>
              <b>In plain language</b>
              {para.n[tier]}
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
