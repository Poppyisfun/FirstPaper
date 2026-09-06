"use client";

import { useState } from "react";
import type { Paper } from "@/lib/types";
import type { Observation } from "@/lib/observations";
import ObservationsPanel from "../components/ObservationsPanel";
import type { Wager } from "@/lib/scoring";
import QuestionCard from "../components/QuestionCard";

/** The judging round — the part everyone else skips. */
export default function JudgePhase({
  paper,
  idx,
  chosen,
  wager,
  onWager,
  onChoose,
  onNext,
  observations,
}: {
  paper: Paper;
  idx: number;
  chosen: number | null;
  wager: Wager | null;
  onWager: (w: Wager) => void;
  onChoose: (i: number) => void;
  onNext: () => void;
  /** Carried in from the reading phase, so flagged phrases stay consultable. */
  observations: Observation[];
}) {
  const total = paper.judge.length;
  const last = idx === total - 1;
  const [obsOpen, setObsOpen] = useState(false);

  return (
    <div className="qwrap">
      <div className="qhead">
        <div className="qk a">Judge · does it hold up?</div>
        <div className="pips" aria-hidden="true">
          {paper.judge.map((_, i) => (
            <span
              key={i}
              className={
                i < idx ? "pip done a" : i === idx ? "pip now" : "pip"
              }
            />
          ))}
        </div>
      </div>

      <div className="judge-obs">
        <button
          type="button"
          className={obsOpen ? "bar-b obs-chip on" : "bar-b obs-chip"}
          onClick={() => setObsOpen((v) => !v)}
          aria-expanded={obsOpen}
        >
          &#9670; {observations.length} observation
          {observations.length === 1 ? "" : "s"} from your reading
        </button>
        <ObservationsPanel
          open={obsOpen}
          items={observations}
          onClose={() => setObsOpen(false)}
          variant="judge"
        />
      </div>

      <QuestionCard
        kind="judge"
        question={paper.judge[idx]}
        index={idx}
        total={total}
        chosen={chosen}
        wager={wager}
        onWager={onWager}
        onChoose={onChoose}
      />

      <div className="navrow">
        <span />
        {chosen !== null && (
          <button type="button" className="btn v" onClick={onNext}>
            {last ? "Read the plain-English version" : "Next question"}
            <span className="ic" aria-hidden="true">
              →
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
