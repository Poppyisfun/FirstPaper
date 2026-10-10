"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { flushNow, readLog, track } from "@/lib/events";
import {
  TAG_PHRASE,
  calibrationNote,
  calibrationSentence,
  deriveResults,
  patternLine,
  type Results as ResultsData,
} from "@/lib/scoring";

/**
 * The results screen.
 *
 * One number is the point of this product, and it gets the room: what the
 * reader claimed, against what was true. Everything else on the screen is
 * quieter than it so that it lands.
 *
 * The two bars underneath carry the second finding. Most people read well and
 * judge badly, and seeing comprehension sit above appraisal is more use than
 * being told it.
 *
 * Nothing here congratulates a bad calibration gap or scolds one. Being
 * underconfident is stated as what it is: a real result, and a different one.
 */
export default function Results({
  slug,
  title,
  paragraphsTotal,
  sectionOf,
  questionPrompts,
}: {
  slug: string;
  title: string;
  paragraphsTotal: number;
  sectionOf: Record<string, string>;
  questionPrompts: Record<string, string>;
}) {
  /* Derived from the session's events at read time, never stored. Reading
     happens after mount because the log lives in the browser. */
  const [data, setData] = useState<ResultsData | null>(null);

  useEffect(() => {
    const log = readLog(slug);
    setData(deriveResults(log, paragraphsTotal, sectionOf));
    /* Reaching this screen is the end of the paper. Recorded so the session
       can be closed server-side; the number on screen does not wait for it. */
    if (log.length > 0) {
      void track({ name: "paper_completed", slug }).then(() => flushNow());
    }
    // sectionOf is a fixed server-rendered map; it never changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, paragraphsTotal]);

  if (!data) {
    return (
      <div className="ph ph-res">
        <main className="rs">
          <p className="rs-loading">Working out how that went&hellip;</p>
        </main>
      </div>
    );
  }

  const nothingDone =
    data.checkAnswered === 0 &&
    data.judgeAnswered === 0 &&
    data.paragraphsPredicted === 0;

  if (nothingDone) {
    return (
      <div className="ph ph-res">
        <main className="rs">
          <h1 className="rs-big">Nothing to score yet.</h1>
          <p className="rs-note">
            There are no answers recorded for this session, so there is no
            calibration to report. Start the paper and the numbers will mean
            something.
          </p>
          <div className="ph-acts">
            <Link className="ph-go" href={`/paper/${slug}/read`}>
              Start reading →
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const pattern = patternLine(data.missedTags);
  const note = calibrationNote(data.calibration);

  return (
    <div className="ph ph-res">
      <header className="ph-head">
        <span className="ph-kick">Results</span>
      </header>

      <main className="rs">
        {/* The centrepiece. Real size, real space, nothing beside it. */}
        <h1 className="rs-big">{calibrationSentence(data.calibration)}</h1>
        {note && <p className="rs-note">{note}</p>}

        {/* The gap between these two is the real story. */}
        <section className="rs-bars" aria-label="Accuracy by round">
          <Bar
            label="Comprehension"
            sub="What the paper said"
            value={data.checkAccuracy}
            count={`${data.checkCorrect}/${data.checkAnswered}`}
          />
          <Bar
            label="Appraisal"
            sub="Whether it holds up"
            value={data.appraisalAccuracy}
            count={`${data.judgeCorrect}/${data.judgeAnswered}`}
          />
        </section>

        {pattern && <p className="rs-pattern">{pattern}</p>}

        {/* XP lives in the library as a progress marker. It is not on this
            screen: results gets one headline and it is the confidence
            sentence. Rank is gone entirely. */}
        <dl className="rs-stats">
          <div>
            <dt>Read without a wrong prediction</dt>
            <dd>
              {data.paragraphsPredictedCorrectly} of {data.paragraphsTotal}
            </dd>
          </div>
        </dl>

        {/* ── The per-session breakdown ──────────────────────────────
            Everything above is the headline. This is the working: which
            question, which answer, and for the judging round what they
            staked on it. No account needed; it is all in this session. */}
        <section className="rs-detail" aria-label="Question by question">
          <h2 className="rs-detail-h">Question by question</h2>

          {data.checkAnswers.length > 0 && (
            <div className="rs-grp">
              <h3 className="rs-grp-h">
                Comprehension <span>{data.checkCorrect} of {data.checkAnswered}</span>
              </h3>
              <ol className="rs-qs">
                {data.checkAnswers.map((a) => (
                  <li key={a.questionId} className={a.correct ? "ok" : "no"}>
                    <span className="rs-q-v">{a.correct ? "right" : "wrong"}</span>
                    <span className="rs-q-t">
                      {questionPrompts[a.questionId] ?? a.questionId}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {data.judgeAnswers.length > 0 && (
            <div className="rs-grp">
              <h3 className="rs-grp-h">
                Appraisal <span>{data.judgeCorrect} of {data.judgeAnswered}</span>
              </h3>
              <ol className="rs-qs">
                {data.judgeAnswers.map((a) => (
                  <li key={a.questionId} className={a.correct ? "ok" : "no"}>
                    <span className="rs-q-v">{a.correct ? "right" : "wrong"}</span>
                    <span className="rs-q-t">
                      {questionPrompts[a.questionId] ?? a.questionId}
                    </span>
                    {a.confidence !== null && (
                      <span className="rs-q-c">
                        said {a.confidence}% sure
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {data.tagBreakdown.length > 0 && (
            <div className="rs-grp">
              <h3 className="rs-grp-h">By what it tested</h3>
              <ul className="rs-tags">
                {data.tagBreakdown.map((t) => (
                  <li key={t.tag} className={t.correct === 0 ? "zero" : ""}>
                    <b>{t.tag}</b>
                    <span>{t.correct} of {t.total}</span>
                    <i>{TAG_PHRASE[t.tag] ?? ""}</i>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.missedPredictions.length > 0 && (
            <div className="rs-grp">
              <h3 className="rs-grp-h">
                Paragraphs you read differently to us{" "}
                <span>
                  {data.missedPredictions.length} of {data.paragraphsPredicted}
                </span>
              </h3>
              <p className="rs-grp-n">
                Your first guess did not match ours here. That is not a score
                against you — it is where our explanation had the most work to
                do.
              </p>
              <ul className="rs-miss">
                {Object.entries(
                  data.missedPredictions.reduce<Record<string, number>>(
                    (acc, m) => {
                      const key = m.section || "Elsewhere";
                      acc[key] = (acc[key] ?? 0) + 1;
                      return acc;
                    },
                    {},
                  ),
                ).map(([section, count]) => (
                  <li key={section}>
                    <b>{section}</b>
                    <span>{count}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <p className="rs-paper">{title}</p>

        <p className="ph-honest">
          <b>FirstPaper can be wrong, and that&rsquo;s the point.</b> These
          scores measure you against our judgement, which is not the same as
          measuring you against the truth.
        </p>
      </main>
    </div>
  );
}

/** One accuracy bar. Null means nothing was answered, which is not zero. */
function Bar({
  label,
  sub,
  value,
  count,
}: {
  label: string;
  sub: string;
  value: number | null;
  count: string;
}) {
  const pct = value ?? 0;
  return (
    <div className="rs-bar">
      <div className="rs-bar-top">
        <span className="rs-bar-l">{label}</span>
        <span className="rs-bar-n">
          {value === null ? "not answered" : `${Math.round(pct)}%`}
        </span>
      </div>
      <div
        className="rs-bar-track"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label} accuracy`}
      >
        <i style={{ width: `${pct}%` }} />
      </div>
      <div className="rs-bar-sub">
        <span>{sub}</span>
        <span>{value === null ? "" : count}</span>
      </div>
    </div>
  );
}
