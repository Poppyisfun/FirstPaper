"use client";

import { forwardRef, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { Para, Tier } from "@/lib/types";

export type ParaState = "open" | "solo" | "peek";

/** What the dot means in each state, for the tooltip and the screen reader. */
const DOT_LABEL: Record<ParaState, string> = {
  open: "Stuck on this paragraph? Open the prompt",
  solo: "You marked this one as understood on your own",
  peek: "Explanation shown for this paragraph",
};

/**
 * One paragraph of the paper: the authors' verbatim text, plus the green dot
 * that offers help but asks you to try first.
 *
 * `para.t` goes through dangerouslySetInnerHTML because the source carries
 * <i>, <sub>, <sup> and <mark class="t">. It is never transformed — changing
 * the tier swaps the note beside it and nothing else.
 *
 * The note lives in the DOM directly under its paragraph. On a wide viewport
 * CSS lifts it into the right-hand gutter, aligned with the paragraph it
 * belongs to; narrower than that it simply stays where it is. One node either
 * way, so nothing is duplicated for screen readers and the text column never
 * reflows when a note opens.
 */
const Paragraph = forwardRef<
  HTMLButtonElement,
  {
    para: Para;
    tier: Tier;
    state: ParaState;
    promptOpen: boolean;
    /** Draws the attention pulse; only ever true for one dot at a time. */
    pulse: boolean;
    coach?: ReactNode;
    onOpenPrompt: () => void;
    onSolo: () => void;
    onPeek: () => void;
  }
>(function Paragraph(
  { para, tier, state, promptOpen, pulse, coach, onOpenPrompt, onSolo, onPeek },
  dotRef,
) {
  const reduce = useReducedMotion();
  const resolved = state !== "open";

  const dotClass = [
    "dot",
    state === "solo" ? "solo" : state === "peek" ? "read" : "",
    pulse && !reduce ? "pulse" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const rise = reduce
    ? {}
    : {
        initial: { opacity: 0, y: -6 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -6 },
        transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const },
      };

  return (
    <div className="rp-block">
      {para.h && <h3 className="pp-h">{para.h}</h3>}

      <div className={resolved ? "rp-para resolved" : "rp-para"}>
        <span className="dot-wrap">
          <button
            type="button"
            ref={dotRef}
            className={dotClass}
            onClick={onOpenPrompt}
            disabled={resolved}
            title={DOT_LABEL[state]}
            aria-label={DOT_LABEL[state]}
            aria-expanded={resolved ? undefined : promptOpen}
          >
            {state === "solo" ? "✓" : state === "peek" ? "◆" : "?"}
          </button>
          {!resolved && (
            <span className="dot-lbl" aria-hidden="true">
              Stuck?
            </span>
          )}
          {coach}
        </span>

        {/* Verbatim from the paper. Never altered. */}
        <p dangerouslySetInnerHTML={{ __html: para.t }} />

        <AnimatePresence initial={false}>
          {promptOpen && !resolved && (
            <motion.div className="think" key="think" {...rise}>
              <div className="think-l">&#9670; Try it yourself first</div>
              <p>
                Say this paragraph back in your own words, in your head. Did it
                make sense?
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
});

export default Paragraph;
