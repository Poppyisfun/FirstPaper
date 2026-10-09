"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { track } from "@/lib/events";
import { sessionSeed, shuffleWithSeed } from "@/lib/shuffle";
import type {
  Explanation,
  Figure,
  ImradTag,
  Level,
  PredictionSet,
} from "@/lib/content-types";

/** One paragraph with everything the screen needs to render it. */
export type ReaderStep = {
  id: string;
  text: string;
  sectionHeading: string | null;
  imrad: ImradTag;
  explanation: Explanation;
  /** Figures this paragraph cites by name. Usually none. */
  figures: Figure[];
  /** The commitment shown before the explanation. Null if none was written. */
  prediction: PredictionSet | null;
};

export type ReaderPaper = {
  slug: string;
  title: string;
  pmcid: string;
  originalUrl: string;
  /* Bibliography. The attribution line is a condition of the licence the text
     is reproduced under, not a nicety, so it renders on every paragraph. */
  authors: string;
  year: number;
  journal: string;
  licence: string;
  licenceUrl: string | null;
};

const LEVELS: { key: Level; label: string }[] = [
  { key: "explorer", label: "Explorer" },
  { key: "reader", label: "Reader" },
  { key: "critic", label: "Critic" },
];

/** Publishers append a DOI to the caption text. That tail is not prose. */
function captionProse(caption: string | null): string {
  if (!caption) return "";
  return caption.replace(/\s*DOI:\s*https?:\/\/\S+\s*$/i, "").trim();
}

/**
 * The reading screen.
 *
 * One paragraph at a time, the paper's own words on the left in serif and our
 * explanation on the right in sans. That split is the information
 * architecture: the reader must never have to work out who is speaking.
 *
 * The explanation is earned by committing, not bought. Before it appears the
 * reader says what they think the paragraph means; once they have chosen, it
 * appears and stays. There is no cost and nothing to lose, because the point
 * is to find out whether the reading landed, and a reader who is being charged
 * for help learns to avoid help rather than to read.
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
  /** Paragraph id to the option the reader committed to. */
  const [picked, setPicked] = useState<Record<string, string>>({});
  /** Which figure is open full size, if any. */
  const [zoomed, setZoomed] = useState<Figure | null>(null);
  /* Options are ordered from a per-session seed, which only exists in the
     browser. Rendering them before mount would order them one way on the
     server and another after hydration. */
  const [seed, setSeed] = useState<string | null>(null);

  useEffect(() => setSeed(sessionSeed()), []);

  /* Opening the paper is what creates the session row. Fired once per mount
     and carrying the level, which the session needs and no later event is
     guaranteed to supply. */
  useEffect(() => {
    void track({
      name: "paper_started",
      slug: paper.slug,
      props: { level, paragraphs: steps.length },
    });
    // Once per paper, not once per level change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paper.slug]);

  const step = steps[index];
  const total = steps.length;
  const atLast = index === total - 1;
  const chosenOption = picked[step.id] ?? null;
  const hasPredicted = chosenOption !== null;

  /* Shuffled per session, so two readers see different orders and one reader
     sees the same order if they reload. Position carries no information. */
  const options = useMemo(() => {
    if (!step.prediction || !seed) return [];
    return shuffleWithSeed(step.prediction.options, `${seed}:${step.id}`);
  }, [step.prediction, step.id, seed]);

  /* Explorer and critic are not written yet. Falling back to reader keeps the
     screen useful, and the note keeps it honest about what is being shown. */
  const chosen = step.explanation[level];
  const usingFallback = chosen.trim().length === 0;
  const body = usingFallback ? step.explanation.reader : chosen;
  const fallbackLabel = LEVELS.find((l) => l.key === level)?.label ?? level;
  /* Paragraph-level, not level-level: the claim outruns its evidence whoever
     is reading. Undefined on most paragraphs, and nothing renders then. */
  const caution = step.explanation.caution?.trim() || null;

  /* Escape closes the figure. A modal that can only be dismissed by clicking
     the right thing is a trap for keyboard users. */
  useEffect(() => {
    if (!zoomed) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoomed(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomed]);

  function predict(optionId: string) {
    if (hasPredicted || !step.prediction) return;
    setPicked((prev) => ({ ...prev, [step.id]: optionId }));
    /* Whether the guess was right is the difficulty signal: a paragraph most
       readers misread is a paragraph our explanation has to work harder on.
       Fire and forget — nothing on this screen waits for it. */
    void track({
      name: "prediction_made",
      slug: paper.slug,
      props: {
        paragraph_id: step.id,
        chosen_option_id: optionId,
        correct: optionId === step.prediction.correctOptionId,
        level,
      },
    });
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

          {step.figures.length > 0 && (
            <div className="rd-figs">
              {step.figures.map((figure) => (
                <button
                  key={figure.id}
                  type="button"
                  className="rd-fig"
                  onClick={() => setZoomed(figure)}
                  aria-label={`Open ${figure.label ?? "figure"} full size`}
                >
                  {/* Not next/image: these are the authors' figures served
                      straight from public/, and optimisation would re-encode
                      a scientific image. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={figure.href ?? ""} alt={figure.label ?? "Figure"} />
                  <span className="rd-fig-l">{figure.label}</span>
                </button>
              ))}
            </div>
          )}

          <div className="rd-acts">
            {atLast ? (
              <Link
                className="rd-act rd-act-go"
                href={`/paper/${paper.slug}/check`}
              >
                Done reading — check what landed →
              </Link>
            ) : (
              <button type="button" className="rd-act" onClick={() => go(1)}>
                Next paragraph →
              </button>
            )}
          </div>
        </article>

        {/* FirstPaper speaking. Sans, always, and the only colour on the page. */}
        <aside className="rd-expl" aria-label="Explanation">
          {!hasPredicted && step.prediction && (
            <div className="rd-pred">
              <h2 className="rd-pred-q">What do you think this paragraph says?</h2>
              <p className="rd-pred-h">
                Commit before you read ours. Getting it wrong costs nothing and
                tells us more than getting it right.
              </p>
              {options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className="rd-pred-o"
                  onClick={() => predict(option.id)}
                >
                  {option.text}
                </button>
              ))}
            </div>
          )}

          {!step.prediction && !hasPredicted && (
            <p className="rd-expl-idle">
              Try saying this paragraph in your own words first.
            </p>
          )}

          {hasPredicted && step.prediction && (
            <p
              className={
                chosenOption === step.prediction.correctOptionId
                  ? "rd-pred-v ok"
                  : "rd-pred-v no"
              }
            >
              {chosenOption === step.prediction.correctOptionId
                ? "That matches what the paragraph says."
                : "Not what the paragraph says — read ours against what you picked."}
            </p>
          )}

          {hasPredicted && (
            <div className="rd-expl-in">
              <p className="rd-expl-t">{body}</p>
              {usingFallback && (
                <p className="rd-expl-note">
                  {fallbackLabel} level isn&rsquo;t written yet. Showing Reader.
                </p>
              )}
              {/* Only where the paragraph actually carries one. Rare on
                  purpose: a caution on every paragraph is a caution on none. */}
              {caution && (
                <div className="rd-caution">
                  <span className="rd-caution-k">Worth questioning</span>
                  <p className="rd-caution-t">{caution}</p>
                </div>
              )}
            </div>
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

      {zoomed && (
        <div
          className="rd-zoom"
          role="dialog"
          aria-modal="true"
          aria-label={zoomed.label ?? "Figure"}
          onClick={() => setZoomed(null)}
        >
          <div className="rd-zoom-in" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={zoomed.href ?? ""} alt={zoomed.label ?? "Figure"} />
            <div className="rd-zoom-cap">
              <b>{zoomed.label}</b>
              <p>{captionProse(zoomed.caption)}</p>
            </div>
            <button
              type="button"
              className="rd-zoom-x"
              onClick={() => setZoomed(null)}
              aria-label="Close figure"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Required by the licence the paper text is reproduced under. It names
          the authors, where the work was published, and what the licence
          permits, and it is present on every paragraph rather than once at the
          end, because a reader may never reach the end. */}
      <p className="rd-attrib">
        {paper.title}. {paper.authors} ({paper.year}){" "}
        <i>{paper.journal}</i>. Reproduced under{" "}
        {paper.licenceUrl ? (
          <a href={paper.licenceUrl} target="_blank" rel="noopener noreferrer">
            {paper.licence}
          </a>
        ) : (
          paper.licence
        )}
        . The paper&rsquo;s own text is unchanged.
      </p>
    </div>
  );
}
