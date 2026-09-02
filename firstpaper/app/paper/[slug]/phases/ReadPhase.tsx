"use client";

import type { Paper, Tier } from "@/lib/types";
import Paragraph, { type ParaState } from "../components/Paragraph";
import FigureBlock from "../components/FigureBlock";
import TierDial from "../components/TierDial";

/** One section at a time. The reading surface stays deliberately quiet. */
export default function ReadPhase({
  paper,
  sec,
  tier,
  onTier,
  stateFor,
  promptKey,
  onOpenPrompt,
  onSolo,
  onPeek,
  tally,
  onBack,
  onNext,
}: {
  paper: Paper;
  sec: number;
  tier: Tier;
  onTier: (t: Tier) => void;
  stateFor: (s: number, p: number) => ParaState;
  promptKey: string | null;
  onOpenPrompt: (key: string) => void;
  onSolo: (key: string) => void;
  onPeek: (key: string) => void;
  tally: { solo: number; helped: number; skipped: number };
  onBack: () => void;
  onNext: () => void;
}) {
  const section = paper.sections[sec];
  const last = sec === paper.sections.length - 1;

  return (
    <div className="read">
      <div className="rp-bar">
        <TierDial
          tier={tier}
          onChange={onTier}
          size="compact"
          idPrefix="read"
        />
        <p className="rp-tally" aria-live="polite">
          {tally.solo} solo · {tally.helped} helped · {tally.skipped} skipped
        </p>
      </div>

      <header className="rp-head">
        <div className="pp-sn-i">
          Section {sec + 1} of {paper.sections.length}
        </div>
        <h1 className="rp-t" id="phase-heading" tabIndex={-1}>
          {section.n}
        </h1>
      </header>

      <div className="sheet">
        {section.paras.map((para, pi) => {
          const key = `${sec}-${pi}`;
          return (
            <Paragraph
              key={key}
              para={para}
              tier={tier}
              state={stateFor(sec, pi)}
              promptOpen={promptKey === key}
              onOpenPrompt={() => onOpenPrompt(key)}
              onSolo={() => onSolo(key)}
              onPeek={() => onPeek(key)}
            />
          );
        })}

        {section.figs.map((fig) => (
          <FigureBlock key={fig.n} fig={fig} paperTitle={paper.meta.title} />
        ))}

        <p className="rp-src">
          Verbatim from the paper ·{" "}
          <a href={paper.meta.url} target="_blank" rel="noopener noreferrer">
            read this section in the original
            <span aria-hidden="true"> ↗</span>
          </a>
        </p>
      </div>

      <div className="navrow">
        <button
          type="button"
          className="btn"
          onClick={onBack}
          disabled={sec === 0}
        >
          Back
        </button>
        <button type="button" className="btn pri" onClick={onNext}>
          {last ? "Finish reading" : "Next section"}
          <span className="ic" aria-hidden="true">
            →
          </span>
        </button>
      </div>
    </div>
  );
}
