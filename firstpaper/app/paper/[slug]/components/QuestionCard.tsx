"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { JudgeQuestion, QuizQuestion } from "@/lib/types";
import type { Wager } from "@/lib/scoring";

const EZ = [0.32, 0.72, 0, 1] as const;

/** Human label for the judging skill a question drills. */
const MODE_LABEL: Record<string, string> = {
  "calibrate-verb": "Calibrate the verb",
  "spot-control": "Spot the control",
  "find-limitation": "Find the limitation",
  "sample-size": "Weigh the sample",
  "weigh-source": "Weigh the source",
};

/**
 * Shared by the quiz and the judging round. Judge mode adds the confidence
 * wager, the "think about it" nudge and the carry-forward takeaway.
 *
 * In judge mode the options stay disabled until a wager is chosen — that
 * forces a metacognitive beat before answering and is deliberate.
 */
export default function QuestionCard({
  kind,
  question,
  index,
  total,
  chosen,
  wager,
  onWager,
  onChoose,
}: {
  kind: "quiz" | "judge";
  question: QuizQuestion | JudgeQuestion;
  index: number;
  total: number;
  chosen: number | null;
  wager: Wager | null;
  onWager: (w: Wager) => void;
  onChoose: (i: number) => void;
}) {
  const reduce = useReducedMotion();
  const judge = kind === "judge" ? (question as JudgeQuestion) : null;
  const answered = chosen !== null;
  const locked = judge !== null && wager === null;
  const correct = answered && question.o[chosen].c === 1;

  const rise = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.34, ease: EZ },
      };

  return (
    <div className={judge ? "qcard a" : "qcard"}>
      <div className="qn">
        <span>
          Question {index + 1} of {total}
        </span>
        {judge && (
          <span className="bmode">
            {MODE_LABEL[judge.mode] ?? judge.mode}
          </span>
        )}
      </div>

      <h2 className="qq" id="phase-heading" tabIndex={-1}>
        {question.q}
      </h2>

      {judge && <p className="qt">{judge.th}</p>}

      {judge && (
        <div className="wager">
          <div className="wl">&#9670; How sure are you?</div>
          <div className="wbs">
            <button
              type="button"
              className="wb"
              aria-pressed={wager === 1}
              disabled={answered}
              onClick={() => onWager(1)}
            >
              Just guessing · 1&times;
            </button>
            <button
              type="button"
              className="wb"
              aria-pressed={wager === 2}
              disabled={answered}
              onClick={() => onWager(2)}
            >
              Pretty sure · 2&times;
            </button>
          </div>
          <p className="wn">
            Guess honestly and a wrong answer costs nothing. Claim certainty and
            miss, and you lose 20 XP. Knowing how sure you are is a scientific
            skill too.
          </p>
        </div>
      )}

      <div className={locked ? "opts locked" : "opts"}>
        {question.o.map((opt, i) => {
          let cls = "opt";
          if (answered) {
            if (i === chosen) cls += opt.c === 1 ? " ok" : " no";
            else if (opt.c === 1) cls += " ok";
            else cls += " dim";
          }
          return (
            <button
              key={i}
              type="button"
              className={cls}
              disabled={answered || locked}
              onClick={() => onChoose(i)}
            >
              {opt.t}
            </button>
          );
        })}
      </div>

      {locked && (
        <p className="opts-hint">Pick how sure you are to unlock the options.</p>
      )}

      <AnimatePresence initial={false}>
        {answered && (
          <motion.div
            className={correct ? "fb good" : "fb bad"}
            key="fb"
            role="status"
            {...rise}
          >
            <span dangerouslySetInnerHTML={{ __html: question.o[chosen].f }} />
            {judge && (
              <div className="tk">
                <b>Carry this to the next paper</b>
                {judge.tk}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
