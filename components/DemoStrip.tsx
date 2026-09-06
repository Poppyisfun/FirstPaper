"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { BtnButton } from "@/components/Btn";
import { EZ } from "@/components/motion-primitives";

/**
 * One line from a real study. Pressing the button lights the over-claiming
 * phrase and explains why it doesn't match the design — the whole product in
 * miniature. The highlight sweeps in like a marker stroke.
 */
export default function DemoStrip() {
  const [revealed, setRevealed] = useState(false);
  const reduce = useReducedMotion();

  return (
    <div className="demo">
      <div className="demo-l">Try it · one line from a real study</div>

      <div className="demo-shell">
        <div className="demo-card">
          <p className="demo-q">
            Carriers of the A-allele reported higher morning alertness than
            non-carriers. These findings suggest the variant{" "}
            <span className="swipe">
              <motion.span
                className="swipe-ink"
                aria-hidden="true"
                initial={false}
                animate={{ scaleX: revealed ? 1 : 0 }}
                transition={
                  reduce
                    ? { duration: 0 }
                    : { duration: 0.62, ease: EZ, delay: 0.05 }
                }
              />
              <span className="swipe-t">drives morning alertness</span>
            </span>{" "}
            and may represent a target for alertness-boosting supplements.
          </p>

          <AnimatePresence initial={false} mode="wait">
            {!revealed ? (
              <motion.div
                key="ask"
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                <BtnButton
                  variant="ghost"
                  icon="↓"
                  onClick={() => setRevealed(true)}
                  aria-controls="demo-answer"
                  aria-expanded={false}
                >
                  What should you notice?
                </BtnButton>
              </motion.div>
            ) : (
              <motion.div
                key="answer"
                id="demo-answer"
                className="demo-out"
                role="region"
                aria-live="polite"
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: EZ, delay: 0.28 }}
              >
                <b>The verb doesn&rsquo;t match the design.</b> They measured a{" "}
                <i>correlation</i> — two things lining up. But
                &ldquo;drives&rdquo; claims a <i>cause</i>, and nothing in a
                study built like this can carry that word. Once you start
                reading verbs this way you can&rsquo;t stop. That&rsquo;s the
                whole skill.
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
