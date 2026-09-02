"use client";

import { gateTone } from "@/lib/scoring";

/**
 * The checkpoint between reading and being tested. The message a reader gets
 * depends on how much they actually engaged, and saying nothing when someone
 * skipped all 57 paragraphs would be the dishonest option.
 */
export default function GatePhase({
  total,
  solo,
  helped,
  banked,
  onBack,
  onNext,
}: {
  total: number;
  solo: number;
  helped: number;
  banked: number;
  onBack: () => void;
  onNext: () => void;
}) {
  const engaged = solo + helped;
  const skipped = total - engaged;
  const tone = gateTone(engaged, total);

  return (
    <div className="gate">
      <h1 className="gate-h" id="phase-heading" tabIndex={-1}>
        Before the questions
      </h1>

      <div className={`gate-msg ${tone}`}>
        {tone === "warn" && (
          <>
            <p>
              You went through all {total} paragraphs without touching a single
              dot. That&rsquo;s allowed — but it means nothing here is checking
              whether the reading landed, and the quiz is about to be brutal.
            </p>
            <p>
              The dots aren&rsquo;t a penalty. They&rsquo;re the part where you
              find out whether you actually understood a paragraph or just moved
              your eyes over it. Worth going back for.
            </p>
          </>
        )}

        {tone === "good" && (
          <p>
            You engaged with <b>{engaged} of {total}</b> paragraphs —{" "}
            <b>{solo}</b> on your own, <b>{helped}</b> with help. That&rsquo;s
            thorough reading. The paragraphs you cracked yourself are the ones
            that&rsquo;ll still be there next week.
          </p>
        )}

        {tone === "neutral" && (
          <p>
            You engaged with <b>{engaged} of {total}</b> paragraphs —{" "}
            <b>{solo}</b> solo, <b>{helped}</b> with help, and <b>{skipped}</b>{" "}
            skipped past. Asking for help was never the problem; skipping is
            where understanding leaks. Still, you&rsquo;ve got enough to work
            with.
          </p>
        )}
      </div>

      <div className="gate-stats">
        <div className="gs">
          <div className="v g">{solo}</div>
          <div className="l">Solo</div>
        </div>
        <div className="gs">
          <div className="v">{helped}</div>
          <div className="l">With help</div>
        </div>
        <div className="gs">
          <div className="v">{skipped}</div>
          <div className="l">Skipped</div>
        </div>
        <div className="gs">
          <div className="v v2">{banked}</div>
          <div className="l">Bonus banked</div>
        </div>
      </div>

      <div className="navrow">
        <button type="button" className="btn" onClick={onBack}>
          Go back and read
        </button>
        <button type="button" className="btn pri" onClick={onNext}>
          Start the quiz
          <span className="ic" aria-hidden="true">
            →
          </span>
        </button>
      </div>
    </div>
  );
}
