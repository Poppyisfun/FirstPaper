"use client";

import type { Paper } from "@/lib/types";
import QuestionCard from "../components/QuestionCard";

/** Comprehension. Getting one wrong costs nothing — you still get the reason. */
export default function QuizPhase({
  paper,
  idx,
  chosen,
  onChoose,
  onNext,
}: {
  paper: Paper;
  idx: number;
  chosen: number | null;
  onChoose: (i: number) => void;
  onNext: () => void;
}) {
  const total = paper.quiz.length;
  const last = idx === total - 1;

  return (
    <div className="qwrap">
      <div className="qhead">
        <div className="qk g">Check · did it land?</div>
        <div className="pips" aria-hidden="true">
          {paper.quiz.map((_, i) => (
            <span
              key={i}
              className={i < idx ? "pip done" : i === idx ? "pip now" : "pip"}
            />
          ))}
        </div>
      </div>

      <QuestionCard
        kind="quiz"
        question={paper.quiz[idx]}
        index={idx}
        total={total}
        chosen={chosen}
        wager={null}
        onWager={() => {}}
        onChoose={onChoose}
      />

      <div className="navrow">
        <span />
        {chosen !== null && (
          <button type="button" className="btn pri" onClick={onNext}>
            {last ? "To the judging round" : "Next question"}
            <span className="ic" aria-hidden="true">
              →
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
