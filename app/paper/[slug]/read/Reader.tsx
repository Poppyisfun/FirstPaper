"use client";

import { useState } from "react";
import Link from "next/link";
import type { Explanation, ImradTag, Level } from "@/lib/content-types";

/** One paragraph with everything the screen needs to render it. */
export type ReaderStep = {
  id: string;
  text: string;
  sectionHeading: string | null;
  imrad: ImradTag;
  explanation: Explanation;
};

export type ReaderPaper = {
  slug: string;
  title: string;
  pmcid: string;
  originalUrl: string;
};

const LEVELS: { key: Level; label: string }[] = [
  { key: "explorer", label: "Explorer" },
  { key: "reader", label: "Reader" },
  { key: "critic", label: "Critic" },
];

const START_BONUS = 100;
const EXPLAIN_COST = 4;

/**
 * The reading screen.
 *
 * One paragraph at a time, the paper's own words on the left in serif and our
 * explanation on the right in sans. That split is the information
 * architecture: the reader must never have to work out who is speaking.
 *
 * Green is the only colour here, and it belongs to the explanation. Everything
 * else stays neutral, because this screen is held for twenty minutes and
 * anything decorative becomes an irritation by paragraph eight.
 */
export default function Reader({
  paper,
  steps,
}: {
  paper: ReaderPaper;
  steps: ReaderStep[];
}) {
  const [index, setIndex] = useState(0);
  const [level, setLevel] = useState<Level>("reader");
  const [bonus, setBonus] = useState(START_BONUS);
  /** Paragraph ids already paid for. Revealing is charged once, never again. */
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  const step = steps[index];
  const total = steps.length;
  const isRevealed = revealed.has(step.id);
  const atLast = index === total - 1;

  /* Explorer and critic are not written yet. Falling back to reader keeps the
     screen useful, and the note keeps it honest about what is being shown. */
  const chosen = step.explanation[level];
  const usingFallback = chosen.trim().length === 0;
  const body = usingFallback ? step.explanation.reader : chosen;
  const fallbackLabel = LEVELS.find((l) => l.key === level)?.label ?? level;

  function reveal() {
    if (isRevealed) return;
    setRevealed((prev) => new Set(prev).add(step.id));
    setBonus((v) => Math.max(0, v - EXPLAIN_COST));
  }

  function go(delta: number) {
    setIndex((i) => Math.min(Math.max(i + delta, 0), total - 1));
  }

  const percent = ((index + 1) / total) * 100;

  return (
    <div className="rd">
      <header className="rd-head">
        <div className="rd-head-in">
          <div className="rd-where">
            <Link className="rd-back" href="/library">
              ← Library
            </Link>
            <span className="rd-count">
              Paragraph {index + 1} of {total}
            </span>
            {step.sectionHeading && (
              <span className="rd-sec">{step.sectionHeading}</span>
            )}
          </div>

          <div className="rd-controls">
            <span className="rd-bonus">
              <span className="rd-bonus-n">{bonus}</span> bonus
            </span>
            <div
              className="rd-levels"
              role="radiogroup"
              aria-label="Explanation level"
            >
              {LEVELS.map((l) => (
                <button
                  key={l.key}
                  type="button"
                  role="radio"
                  aria-checked={level === l.key}
                  className={level === l.key ? "rd-lvl on" : "rd-lvl"}
                  onClick={() => setLevel(l.key)}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div
          className="rd-bar"
          role="progressbar"
          aria-valuenow={index + 1}
          aria-valuemin={1}
          aria-valuemax={total}
          aria-label="Progress through this paper"
        >
          <i style={{ width: `${percent}%` }} />
        </div>
      </header>

      <main className="rd-body">
        {/* The scientists speaking. Serif, always. */}
        <article className="rd-paper" aria-label="Paragraph from the paper">
          <p dangerouslySetInnerHTML={{ __html: step.text }} />

          <div className="rd-acts">
            <button type="button" className="rd-act" onClick={() => go(1)} disabled={atLast}>
              I understood this
            </button>
            <button
              type="button"
              className="rd-act rd-act-explain"
              onClick={reveal}
              disabled={isRevealed}
              aria-expanded={isRevealed}
            >
              {isRevealed ? "Explanation shown" : `Explain it  −${EXPLAIN_COST}`}
            </button>
          </div>
        </article>

        {/* FirstPaper speaking. Sans, always, and the only colour on the page. */}
        <aside className="rd-expl" aria-label="Explanation">
          {isRevealed ? (
            <div className="rd-expl-in">
              <p className="rd-expl-t">{body}</p>
              {usingFallback && (
                <p className="rd-expl-note">
                  {fallbackLabel} level isn&rsquo;t written yet. Showing Reader.
                </p>
              )}
            </div>
          ) : (
            <p className="rd-expl-idle">
              Try saying this paragraph in your own words first. The explanation
              is here when you want it.
            </p>
          )}

          <p className="rd-honest">
            <b>FirstPaper can be wrong, and that&rsquo;s the point.</b> The
            paragraph on the left is the authors&rsquo;. Everything in green is
            ours, and commentary can be mistaken. Check us against the original.
          </p>
        </aside>
      </main>

      <footer className="rd-foot">
        <button
          type="button"
          className="rd-nav"
          onClick={() => go(-1)}
          disabled={index === 0}
        >
          ← Previous
        </button>

        <a
          className="rd-orig"
          href={`https://europepmc.org/article/PMC/${paper.pmcid}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Read the original on Europe PMC ↗
        </a>

        <button
          type="button"
          className="rd-nav"
          onClick={() => go(1)}
          disabled={atLast}
        >
          Next →
        </button>
      </footer>
    </div>
  );
}
