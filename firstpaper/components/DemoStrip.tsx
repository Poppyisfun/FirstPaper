"use client";

import { useState } from "react";

/**
 * One line from a real study. Clicking the button lights the over-claiming
 * phrase and reveals why it doesn't match the design — the whole product in
 * miniature.
 */
export default function DemoStrip() {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="demo">
      <div className="demo-l">Try it — one line from a real study</div>
      <div className="demo-card">
        <p className="demo-q">
          Carriers of the A-allele reported higher morning alertness than
          non-carriers. These findings suggest the variant{" "}
          <mark className={revealed ? "lit" : undefined}>
            drives morning alertness
          </mark>{" "}
          and may represent a target for alertness-boosting supplements.
        </p>
        {!revealed && (
          <button
            className="btn ghost"
            onClick={() => setRevealed(true)}
            aria-expanded={false}
          >
            What should you notice?
          </button>
        )}
        <div className={revealed ? "demo-out on" : "demo-out"}>
          <b>The verb doesn&rsquo;t match the design.</b> They measured a{" "}
          <i>correlation</i> — two things lining up. But &ldquo;drives&rdquo;
          claims a <i>cause</i>. Nothing in a study like this can support that
          word. Once you start reading verbs this way, you can&rsquo;t stop.
          That&rsquo;s the whole skill.
        </div>
      </div>
    </div>
  );
}
