"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { flushNow, track } from "@/lib/events";
import { sessionSeed, shuffleWithSeed } from "@/lib/shuffle";
import type { CheckQuestion } from "@/lib/schema";

/**
 * The check round: did the reading land?
 *
 * No penalty and no scoring drama. A wrong answer here is information about
 * which paragraph did not survive the trip, and a reader who is being punished
 * for it starts guessing defensively instead of honestly.
 *
 * Neutral colour throughout. Green, amber and violet carry meaning elsewhere
 * in the product and borrowing them here would dilute all three.
 */
export default function Check({
  slug,
  questions,
}: {
  slug: string;
  questions: CheckQuestion[];
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [seed, setSeed] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState(() => Date.now());

  useEffect(() => setSeed(sessionSeed()), []);

  const question = questions[index];
  const atLast = index === questions.length - 1;

  /* Shuffled per session. In the stored file the correct option is written
     first every time, so a fixed order would be the entire answer key. */
  const options = useMemo(() => {
    if (!seed) return [];
    return shuffleWithSeed(question.options, `${seed}:${question.id}`);
  }, [question, seed]);

  function submit() {
    if (answered) return;
    if (!selected) {
      setError(true);
      return;
    }
    setError(false);
    setAnswered(selected);
    void track({
      name: "check_answered",
      slug,
      props: {
        question_id: question.id,
        /* Globally unique across papers, unlike question_id which is only
           unique within one. Recorded now because it cannot be backfilled
           and it is what lets us ask whether the skill transfers. */
        item_id: `${slug}:check:${question.id}`,
        taxonomy_tag: null,
        chosen_option_id: selected,
        correct: selected === question.correct,
        ms: Date.now() - startedAt,
      },
    });
  }

  function next() {
    if (atLast) {
      void flushNow().then(() => router.push(`/paper/${slug}/judge`));
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
    setAnswered(null);
    setError(false);
    setStartedAt(Date.now());
  }

  const isCorrect = answered === question.correct;

  return (
    <div className="ph">
      <header className="ph-head">
        <span className="ph-kick">Check</span>
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
          <div className="ph-fb">
            <p className="ph-fb-v">
              {isCorrect ? "Correct." : "Not quite."}
            </p>
            <p className="ph-fb-t">{question.feedback}</p>
          </div>
        )}

        <div className="ph-acts">
          {answered ? (
            <button type="button" className="ph-go" onClick={next}>
              {atLast ? "On to judging →" : "Next question →"}
            </button>
          ) : (
            <button type="button" className="ph-go" onClick={submit}>
              Check this answer
            </button>
          )}
        </div>

        <p className="ph-honest">
          <b>FirstPaper can be wrong, and that&rsquo;s the point.</b> These
          questions are ours, not the authors&rsquo;. Nothing here is scored
          against you.
        </p>
      </main>
    </div>
  );
}
