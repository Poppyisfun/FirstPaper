"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { flushNow, readLog, track, type PaperEvent } from "@/lib/events";
import {
  TAG_PHRASE,
  calibrationDirection,
  deriveResults,
  judgementCount,
  perTagTally,
  perTagVerdict,
  type AnsweredQuestion,
  type Results as ResultsData,
} from "@/lib/scoring";
import {
  counter,
  counterNote,
  directionLines,
  gateNote,
  guessingFor,
  headline,
  smallPrint,
  tagRule,
  tagTallyLine,
  tagVerdictLine,
} from "@/lib/results-copy";

/** What the screen needs to know about one question in this paper. */
export type QuestionRef = {
  prompt: string;
  tag: string | null;
  correctOptionId: string;
  /** Option id to option text. */
  options: Record<string, string>;
};

/** How to point back at one paragraph of the paper. */
export type ParagraphRef = {
  section: string;
  /** "Paragraph 9", numbered as the reading screen numbers it, or "Abstract". */
  label: string;
  /** The paragraph's first few words, verbatim. */
  opening: string;
};

/**
 * The results screen.
 *
 * One number is the point of this product, and it gets the room: what the
 * reader claimed, against what was true. It is a tally, and it is shown as
 * one. Under it, in small print, is how little five questions can carry and
 * where guessing sits, because 40% on four-option questions is a point and a
 * half above guessing, and that is the actual finding.
 *
 * Which way a reader leans is gated at 20 judgements across papers, and each
 * appraisal tag at 6. Below a gate the screen shows the count and the
 * distance to the gate, never a verdict, kind or otherwise.
 *
 * The register is a mirror, not a grade. Underconfidence is stated as plainly
 * as overconfidence. Nothing congratulates a gap and nothing scolds one.
 */
export default function Results({
  slug,
  title,
  paragraphsTotal,
  paragraphs,
  checkIds,
  judgeIds,
  questions,
  optionCounts,
}: {
  slug: string;
  title: string;
  paragraphsTotal: number;
  paragraphs: Record<string, ParagraphRef>;
  checkIds: string[];
  judgeIds: string[];
  questions: Record<string, QuestionRef>;
  /** "<slug>:<questionId>" to option count, for every paper. */
  optionCounts: Record<string, number>;
}) {
  /* Derived from events at read time, never stored. Reading happens after
     mount because the session log lives in the browser. */
  const [data, setData] = useState<ResultsData | null>(null);
  const [local, setLocal] = useState<PaperEvent[]>([]);
  /* This reader's judgements on every paper, from the durable record. Null
     until it answers; an empty list if it cannot. */
  const [history, setHistory] = useState<PaperEvent[] | null>(null);

  useEffect(() => {
    const sectionOf = Object.fromEntries(
      Object.entries(paragraphs).map(([id, p]) => [id, p.section]),
    );
    const log = readLog(slug);
    setData(deriveResults(log, paragraphsTotal, sectionOf));
    setLocal(readLog());
    /* Reaching this screen is the end of the paper. Recorded so the session
       can be closed server-side; the number on screen does not wait for it. */
    if (log.length > 0) {
      void track({ name: "paper_completed", slug }).then(() => flushNow());
    }
    // paragraphs is a fixed server-rendered map; it never changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, paragraphsTotal]);

  useEffect(() => {
    let live = true;
    /* After the flush above has had a chance to land, so this paper's
       judgements are in the count even on a first visit. Duplicates of the
       local log are harmless: each question counts once. */
    const t = setTimeout(() => {
      fetch("/api/events", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : { events: [] }))
        .then((body: { events?: PaperEvent[] }) => {
          if (live) setHistory(Array.isArray(body.events) ? body.events : []);
        })
        .catch(() => live && setHistory([]));
    }, 600);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, []);

  const everything = useMemo(() => [...(history ?? []), ...local], [history, local]);
  const optionCountOf = (s: string, q: string) => optionCounts[`${s}:${q}`];

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
          <h1 className="rs-big">Nothing to show you yet.</h1>
          <p className="rs-note">
            This page holds up what you said against what turned out to be
            true. There are no answers from this session to hold up. Read the
            paper, and this page will have something to tell you.
          </p>
          <div className="ph-acts">
            <Link className="ph-go" href={`/paper/${slug}/read`}>
              Start reading →
            </Link>
          </div>
          <Honesty />
        </main>
      </div>
    );
  }

  /* Guessing, per round, from the real option counts of the questions the
     reader actually answered (or the whole round, if they answered none). */
  const countsFor = (answers: AnsweredQuestion[], ids: string[]) =>
    (answers.length > 0 ? answers.map((a) => a.questionId) : ids)
      .map((id) => optionCounts[`${slug}:${id}`])
      .filter((n): n is number => typeof n === "number");
  const checkGuessing = guessingFor(countsFor(data.checkAnswers, checkIds));
  const judgeGuessing = guessingFor(countsFor(data.judgeAnswers, judgeIds));

  const meanConfidence =
    data.calibration.kind === "measured" ? data.calibration.meanConfidence : 0;
  const total = judgementCount(everything);
  const direction = calibrationDirection(everything);
  const tallies = perTagTally(everything);
  const print = smallPrint(data.judgeAnswered, data.judgeCorrect, judgeGuessing, total);
  const toGo = counterNote(total);

  /* This session's appraisal answers, grouped by what they tested, so a
     "0 of 1" sits where it can be seen next to a "1 of 1". */
  const byTag = new Map<string, AnsweredQuestion[]>();
  for (const a of data.judgeAnswers) {
    const tag = a.tag ?? questions[a.questionId]?.tag ?? "untagged";
    byTag.set(tag, [...(byTag.get(tag) ?? []), a]);
  }

  /* Missed predictions, grouped by section in reading order. */
  const missedBySection = new Map<string, string[]>();
  for (const m of data.missedPredictions) {
    const key = m.section || "Elsewhere";
    missedBySection.set(key, [...(missedBySection.get(key) ?? []), m.paragraphId]);
  }

  return (
    <div className="ph ph-res">
      <header className="ph-head">
        <span className="ph-kick">Results</span>
      </header>

      <main className="rs">
        {/* The centrepiece. Real size, real space, nothing beside it. */}
        <h1 className="rs-big">
          {headline(data.judgeAnswered, meanConfidence, data.appraisalAccuracy ?? 0)}
        </h1>
        {print && <p className="rs-print">{print}</p>}

        {/* The gap between these two is the real story, and the guessing line
            makes it larger, not smaller. */}
        <section className="rs-bars" aria-label="Accuracy by round">
          <Bar
            label="Comprehension"
            sub="What the paper said"
            value={data.checkAccuracy}
            guessing={checkGuessing}
            count={`${data.checkCorrect} of ${data.checkAnswered}`}
          />
          <Bar
            label="Appraisal"
            sub="Whether it holds up"
            value={data.appraisalAccuracy}
            guessing={judgeGuessing}
            count={`${data.judgeCorrect} of ${data.judgeAnswered}`}
          />
        </section>

        {/* ── Across papers: the gated layer ───────────────────────── */}
        <section className="rs-gate" aria-label="Across every paper you've judged">
          <h2 className="rs-detail-h">Across every paper you&rsquo;ve judged</h2>

          {direction ? (
            <>
              {directionLines(direction).map((line) => (
                <p key={line} className="rs-gate-p">
                  {line}
                </p>
              ))}
            </>
          ) : (
            <div className="rs-count">
              <p className="rs-count-n">
                <b>{counter(total)}</b> judgements
              </p>
              {toGo && <p className="rs-gate-p">{toGo}</p>}
              <p className="rs-gate-n">{gateNote()}</p>
            </div>
          )}

          {tallies.length > 0 && <p className="rs-gate-n">{tagRule()}</p>}
          {tallies.length > 0 && (
            <ul className="rs-tags">
              {tallies.map((t) => {
                const verdict = perTagVerdict(everything, t.tag, optionCountOf);
                return (
                  <li key={t.tag}>
                    <b>{t.tag}</b>
                    <span>
                      {t.correct} of {t.total} right
                    </span>
                    <i>
                      {verdict
                        ? tagVerdictLine(verdict)
                        : tagTallyLine(TAG_PHRASE[t.tag], t.total)}
                    </i>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <dl className="rs-stats">
          <div>
            <dt>XP</dt>
            <dd>{data.xp}</dd>
          </div>
          <div>
            <dt>Rank</dt>
            <dd>{data.rank}</dd>
          </div>
          <div>
            <dt>First guesses that matched ours</dt>
            <dd>
              {data.paragraphsPredictedCorrectly} of {data.paragraphsTotal}
            </dd>
          </div>
        </dl>

        {/* ── This paper, question by question ─────────────────────── */}
        <section className="rs-detail" aria-label="Question by question">
          <h2 className="rs-detail-h">This paper, question by question</h2>

          {data.checkAnswers.length > 0 && (
            <div className="rs-grp">
              <h3 className="rs-grp-h">
                Comprehension{" "}
                <span>
                  {data.checkCorrect} of {data.checkAnswered}
                </span>
              </h3>
              <ol className="rs-qs">
                {data.checkAnswers.map((a) => (
                  <Answer key={a.questionId} a={a} q={questions[a.questionId]} />
                ))}
              </ol>
            </div>
          )}

          {[...byTag.entries()].map(([tag, answers]) => {
            const right = answers.filter((a) => a.correct).length;
            return (
              <div className="rs-grp" key={tag}>
                <h3 className="rs-grp-h">
                  Appraisal · {tag}{" "}
                  <span>
                    {right} of {answers.length}
                  </span>
                </h3>
                {TAG_PHRASE[tag] && (
                  <p className="rs-grp-n">
                    {TAG_PHRASE[tag].charAt(0).toUpperCase() + TAG_PHRASE[tag].slice(1)}.
                  </p>
                )}
                <ol className="rs-qs">
                  {answers.map((a) => (
                    <Answer key={a.questionId} a={a} q={questions[a.questionId]} />
                  ))}
                </ol>
              </div>
            );
          })}

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
                against you. It is where our explanation had the most work to
                do.
              </p>
              {[...missedBySection.entries()].map(([section, ids]) => (
                <div key={section} className="rs-miss">
                  <h4 className="rs-miss-h">{section}</h4>
                  <ul>
                    {ids.map((id) => (
                      <li key={id}>
                        <b>{paragraphs[id]?.label ?? id}</b>
                        <q>{paragraphs[id]?.opening}</q>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>

        <p className="rs-paper">{title}</p>

        <Honesty />
      </main>
    </div>
  );
}

function Honesty() {
  return (
    <p className="ph-honest">
      <b>FirstPaper can be wrong, and that&rsquo;s the point.</b> These scores
      measure you against our judgement, which is not the same as measuring you
      against the truth.
    </p>
  );
}

/** One answered question: what they chose, whether it matched, what they staked. */
function Answer({ a, q }: { a: AnsweredQuestion; q: QuestionRef | undefined }) {
  const chosen = q?.options[a.chosenOptionId];
  const ours = q?.options[q.correctOptionId];
  return (
    <li className={a.correct ? "ok" : "no"}>
      <span className="rs-q-v">{a.correct ? "right" : "wrong"}</span>
      <span className="rs-q-t">
        {q?.prompt ?? a.questionId}
        {chosen && (
          <span className="rs-q-a">
            You said: {chosen}
          </span>
        )}
        {!a.correct && ours && (
          <span className="rs-q-a">Our answer: {ours}</span>
        )}
      </span>
      {a.confidence !== null && (
        <span className="rs-q-c">said {a.confidence}% sure</span>
      )}
    </li>
  );
}

/** One accuracy bar. Null means nothing was answered, which is not zero. */
function Bar({
  label,
  sub,
  value,
  guessing,
  count,
}: {
  label: string;
  sub: string;
  value: number | null;
  /** 0-100, from the real option counts. */
  guessing: number;
  count: string;
}) {
  const pct = value ?? 0;
  const g = Math.round(guessing);
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
        aria-label={`${label} accuracy. Guessing scores ${g}%.`}
      >
        <i style={{ width: `${pct}%` }} />
        {g > 0 && (
          <span className="rs-bar-g" style={{ left: `${guessing}%` }} aria-hidden="true">
            <em>guessing</em>
          </span>
        )}
      </div>
      <div className="rs-bar-sub">
        <span>{sub}</span>
        <span>{value === null ? "" : count}</span>
      </div>
    </div>
  );
}
