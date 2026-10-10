"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { flushNow, track } from "@/lib/events";
import { sessionSeed, shuffleWithSeed } from "@/lib/shuffle";
import type { JudgeQuestion } from "@/lib/schema";

/**
 * The judge round: does the paper hold up?
 *
 * The confidence slider is the point of this screen, and the ordering is the
 * point of the slider. The reader commits to how sure they are BEFORE the
 * options exist in the DOM at all — not rendered-but-disabled, not blurred,
 * not present and ignorable. A confidence stated while the options are visible
 * is a reaction to the options, and a calibration number built from that
 * measures nothing.
 *
 * Violet, because this is where the work changes from "what did it say" to
 * "does it hold up", and the reader should be able to feel that shift.
 */
export default function Judge({
  slug,
  questions,
}: {
  slug: string;
  questions: JudgeQuestion[];
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [confidence, setConfidence] = useState(50);
  const [committed, setCommitted] = useState<number | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [seed, setSeed] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState(() => Date.now());

  useEffect(() => setSeed(sessionSeed()), []);

  const question = questions[index];
  const atLast = index === questions.length - 1;

  const options = useMemo(() => {
    if (!seed) return [];
    return shuffleWithSeed(question.options, `${seed}:${question.id}`);
  }, [question, seed]);

  function commit() {
    if (committed !== null) return;
    setCommitted(confidence);
    setStartedAt(Date.now());
    void track({
      name: "confidence_stated",
      slug,
      props: {
        question_id: question.id,
        confidence,
        tag: question.tag,
      },
    });
  }

  function submit() {
    if (answered || committed === null) return;
    if (!selected) {
      setError(true);
      return;
    }
    setError(false);
    setAnswered(selected);
    void track({
      name: "judge_answered",
      slug,
      props: {
        question_id: question.id,
        /* Globally unique across papers; question_id is only unique within
           one. Cannot be backfilled, so it goes in before paper two. */
        item_id: `${slug}:judge:${question.id}`,
        taxonomy_tag: question.tag,
        chosen_option_id: selected,
        correct: selected === question.correct,
        confidence: committed,
        tag: question.tag,
        ms: Date.now() - startedAt,
      },
    });
  }

  function next() {
    if (atLast) {
      void flushNow().then(() => router.push(`/paper/${slug}/recap`));
      return;
    }
    setIndex((i) => i + 1);
    setConfidence(50);
    setCommitted(null);
    setSelected(null);
    setAnswered(null);
    setError(false);
    setStartedAt(Date.now());
  }

  const isCorrect = answered === question.correct;

  return (
    <div className="ph ph-judge">
      <header className="ph-head">
        <span className="ph-kick">Judge</span>
        <div className="ph-dots" role="progressbar" aria-valuenow={index + 1}
             aria-valuemin={1} aria-valuemax={questions.length}
             aria-label={`Question ${index + 1} of ${questions.length}`}>
          {questions.map((q, i) => (
            <i key={q.id}
               className={i < index ? "done" : i === index ? "on" : ""} />
          ))}
        </div>
      </header>

      <main className="ph-body">
        <p className="ph-n">
          Question {index + 1} of {questions.length}
        </p>
        <h1 className="ph-q">{question.prompt}</h1>

        {committed === null ? (
          /* The options are not in the DOM yet. That is the whole design. */
          <div className="ph-conf">
            <p className="ph-conf-h">
              Before you see the options: how sure are you that you can answer
              this?
            </p>
            <output className="ph-conf-n" aria-live="polite">
              {confidence}%
            </output>
            <input
              className="ph-conf-s"
              type="range"
              min={0}
              max={100}
              step={1}
              value={confidence}
              onChange={(e) => setConfidence(Number(e.target.value))}
              aria-label="How confident are you, 0 to 100 per cent"
            />
            <div className="ph-conf-ends">
              <span>No idea</span>
              <span>Certain</span>
            </div>
            <button type="button" className="ph-go" onClick={commit}>
              Lock it in and show the options →
            </button>
            <p className="ph-conf-w">
              You cannot change this once the options appear. That is what makes
              the number mean anything.
            </p>
          </div>
        ) : (
          <>
            <p className="ph-staked">
              You said <b>{committed}% sure</b> before seeing these.
            </p>

            <div className="ph-opts" role="radiogroup" aria-label="Answer options">
              {options.map((option) => {
                const chosen = selected === option.id;
                const isAnswer = option.id === question.correct;
                let cls = "ph-opt";
                if (answered) {
                  if (isAnswer) cls += " right";
                  else if (chosen) cls += " wrong";
                  else cls += " muted";
                } else if (chosen) {
                  cls += " on";
                }
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={chosen}
                    className={cls}
                    disabled={answered !== null}
                    onClick={() => {
                      setSelected(option.id);
                      setError(false);
                    }}
                  >
                    {option.text}
                  </button>
                );
              })}
            </div>

            {error && (
              <p className="ph-err" role="alert">
                Choose an answer first.
              </p>
            )}

            {answered && (
              <>
                {/* The juxtaposition is the screen. Side by side, same size,
                    no commentary joining them: the reader draws the line. */}
                <div className="ph-pair">
                  <div className="ph-pair-c">
                    <span className="ph-pair-k">You said</span>
                    <b className="ph-pair-v">{committed}% sure</b>
                  </div>
                  <div className="ph-pair-c">
                    <span className="ph-pair-k">You were</span>
                    <b className={isCorrect ? "ph-pair-v ok" : "ph-pair-v no"}>
                      {isCorrect ? "right" : "wrong"}
                    </b>
                  </div>
                </div>
                <div className="ph-fb">
                  <p className="ph-fb-t">{question.feedback}</p>
                </div>
              </>
            )}

            <div className="ph-acts">
              {answered ? (
                <button type="button" className="ph-go" onClick={next}>
                  {atLast ? "See the recap →" : "Next question →"}
                </button>
              ) : (
                <button type="button" className="ph-go" onClick={submit}>
                  Lock in this answer
                </button>
              )}
            </div>
          </>
        )}

        <p className="ph-honest">
          <b>FirstPaper can be wrong, and that&rsquo;s the point.</b> These
          judgements are ours. Disagreeing with us is a legitimate result.
        </p>
      </main>
    </div>
  );
}
