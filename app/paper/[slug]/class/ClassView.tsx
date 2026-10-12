import {
  MIN_READERS,
  type ClassView as ClassViewData,
  type QuestionSplit,
} from "@/lib/aggregate";
import { TAG_PHRASE } from "@/lib/scoring";

/** How to point back at one paragraph: label, section, and the authors' text. */
export type ParagraphInfo = {
  label: string;
  section: string;
  /** The authors' HTML, verbatim from source.json. */
  html: string;
  opening: string;
};

const round = Math.round;

/** "Results, paragraph 9", or just "Abstract" where the two would repeat. */
function where(p: ParagraphInfo): string {
  return p.label.toLowerCase() === p.section.toLowerCase()
    ? p.section
    : `${p.section}, ${p.label.toLowerCase()}`;
}

function readers(n: number): string {
  return `${n} ${n === 1 ? "reader" : "readers"}`;
}

/** The suppression line, worded the same everywhere on the page. */
function Hidden({ count }: { count: number }) {
  return (
    <p className="cv-hidden">
      {count} of {MIN_READERS} readers. Hidden until {MIN_READERS}.
    </p>
  );
}

function TagLine({ tag }: { tag: string | null }) {
  if (!tag) return null;
  return (
    <p className="cv-tag">
      Tests <b>{tag}</b>
      {TAG_PHRASE[tag] ? `: ${TAG_PHRASE[tag]}` : ""}
    </p>
  );
}

/** One question's split, as a bar per option in the paper's order. */
function Split({ q }: { q: QuestionSplit }) {
  if (!q.split.shown) return <Hidden count={q.split.readers} />;
  return (
    <>
      <ul className="cv-split" aria-label={`How ${readers(q.split.readers)} answered`}>
        {q.split.value.options.map((o) => (
          <li key={o.optionId} className={o.correct ? "ours" : ""}>
            <span className="cv-opt">
              {o.text}
              {o.correct && <em className="cv-ours">our answer</em>}
            </span>
            <span className="cv-bar" aria-hidden="true">
              <i style={{ width: `${o.share}%` }} />
            </span>
            <span className="cv-n">
              {round(o.share)}% <small>({o.count})</small>
            </span>
          </li>
        ))}
      </ul>
      <p className="cv-meta">{readers(q.split.readers)} answered.</p>
    </>
  );
}

/** The comprehension round, more briefly: our answer's share and the strongest pull away from it. */
function BriefSplit({ q }: { q: QuestionSplit }) {
  if (!q.split.shown) return <Hidden count={q.split.readers} />;
  const options = q.split.value.options;
  const ours = options.find((o) => o.correct);
  const pull = options
    .filter((o) => !o.correct && o.count > 0)
    .sort((a, b) => b.share - a.share)[0];
  return (
    <p className="cv-brief">
      {round(ours?.share ?? 0)}% of {readers(q.split.readers)} chose our answer.
      {pull && (
        <>
          {" "}
          The most-chosen other answer, at {round(pull.share)}%: &ldquo;{pull.text}&rdquo;
        </>
      )}
    </p>
  );
}

/**
 * The class view, as markup. Pure: everything it shows is in `view`, and
 * every line in it is either computed from MIN_READERS readers or replaced by
 * the sentence saying it isn't.
 */
export default function ClassView({
  title,
  originalUrl,
  view,
  paragraphs,
}: {
  title: string;
  originalUrl: string;
  /** Null when the data can't be read. */
  view: ClassViewData | null;
  paragraphs: Record<string, ParagraphInfo>;
}) {
  return (
    <div className="ph ph-res">
      <header className="ph-head">
        <span className="ph-kick">Class view</span>
      </header>

      <main className="rs cv">
        <p className="rs-paper cv-paper">{title}</p>
        <h1 className="cv-h1">Where readers of this paper agreed, and where they split.</h1>
        <p className="rs-print">
          This page pools everyone who has read this paper on FirstPaper. There
          are no names and no rows per student, because FirstPaper never knows
          who is reading. If your class is the only group reading this paper,
          these readers are your class.
        </p>
        <p className="rs-print">
          Any line built from fewer than {MIN_READERS} readers is hidden, and
          says so. A split across three people is three people, not a pattern.
          We hold this page to the same rule as a reader&rsquo;s own results.
        </p>

        {!view ? (
          <p className="cv-lead">
            The reading data can&rsquo;t be loaded right now, so there is
            nothing to show. That is a problem on our side, not a sign that
            nobody has read the paper.
          </p>
        ) : (
          <>
            <p className="cv-lead">
              {readers(view.started)} started this paper.{" "}
              {view.reachedResults} reached their results.
            </p>

            {/* ── The lesson plan ─────────────────────────────────── */}
            <section className="rs-gate" aria-label="Where they divided hardest">
              <h2 className="rs-detail-h">Where they divided hardest</h2>
              {view.dividedHardest && view.dividedHardest.split.shown ? (
                <>
                  <p className="rs-gate-p">
                    No answer to this question won more than{" "}
                    {round(view.dividedHardest.split.value.plurality)}% of{" "}
                    {readers(view.dividedHardest.split.readers)}. A question
                    the room disagrees on is usually the best place to start a
                    discussion.
                  </p>
                  <TagLine tag={view.dividedHardest.tag} />
                  <h3 className="cv-q">{view.dividedHardest.prompt}</h3>
                  <Split q={view.dividedHardest} />
                  {view.dividedHardest.paragraphIds
                    .slice(0, 1)
                    .map((id) => paragraphs[id])
                    .filter(Boolean)
                    .map((p) => (
                      <figure key={p.label} className="cv-para">
                        <figcaption>
                          The paragraph it rests on &middot; {where(p)}
                        </figcaption>
                        <blockquote dangerouslySetInnerHTML={{ __html: p.html }} />
                      </figure>
                    ))}
                </>
              ) : (
                <p className="cv-hidden">
                  Not enough readers yet to say where they divided. This needs{" "}
                  {MIN_READERS} readers on at least one judging question.
                </p>
              )}
            </section>

            {/* ── Every judging question ─────────────────────────── */}
            <section className="rs-detail" aria-label="Judging questions">
              <h2 className="rs-detail-h">Every judging question</h2>
              {view.judge.map((q) => (
                <div key={q.questionId} className="rs-grp">
                  <TagLine tag={q.tag} />
                  <h3 className="cv-q">{q.prompt}</h3>
                  <Split q={q} />
                </div>
              ))}
            </section>

            {/* ── Comprehension, briefly ─────────────────────────── */}
            <section className="rs-detail" aria-label="Comprehension questions">
              <h2 className="rs-detail-h">Comprehension questions</h2>
              {view.check.map((q) => (
                <div key={q.questionId} className="rs-grp">
                  <h3 className="cv-q cv-q-s">{q.prompt}</h3>
                  <BriefSplit q={q} />
                </div>
              ))}
            </section>

            {/* ── Where the paper lost people ────────────────────── */}
            <section className="rs-detail" aria-label="Paragraphs where first guesses missed">
              <h2 className="rs-detail-h">Paragraphs where first guesses most often missed</h2>
              <p className="rs-grp-n">
                Before each explanation, readers guess what the paragraph says.
                These are the paragraphs where that guess missed most often,
                which is where the paper lost people.
              </p>
              {view.paragraphMisses.length > 0 ? (
                <ol className="cv-paras">
                  {view.paragraphMisses.map((m) => {
                    const p = paragraphs[m.paragraphId];
                    return (
                      <li key={m.paragraphId}>
                        <span className="cv-para-l">
                          {p ? where(p) : m.paragraphId}
                        </span>
                        <span className="cv-n">
                          {m.missed} of {m.readers} missed ({round(m.missRate)}%)
                        </span>
                        {p && <q>{p.opening}</q>}
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <p className="cv-hidden">
                  No paragraph has {MIN_READERS} guesses yet.
                </p>
              )}
              {view.paragraphsSuppressed > 0 && view.paragraphMisses.length > 0 && (
                <p className="cv-meta">
                  {view.paragraphsSuppressed}{" "}
                  {view.paragraphsSuppressed === 1 ? "paragraph has" : "paragraphs have"}{" "}
                  fewer than {MIN_READERS} guesses and{" "}
                  {view.paragraphsSuppressed === 1 ? "is" : "are"} hidden.
                </p>
              )}
            </section>

            {/* ── The group's calibration ────────────────────────── */}
            <section className="rs-detail" aria-label="Confidence against accuracy">
              <h2 className="rs-detail-h">Confidence against accuracy</h2>
              {view.confidence.shown ? (
                <>
                  <p className="rs-gate-p">
                    On the judging questions, readers said they were{" "}
                    {round(view.confidence.value.meanConfidence)}% sure on
                    average. They were right{" "}
                    {round(view.confidence.value.accuracy)}% of the time.
                    Guessing scores {round(view.confidence.value.guessing)}%.
                  </p>
                  <p className="cv-meta">
                    Pooled across {readers(view.confidence.readers)}. It says
                    how the group read the paper, not how any one reader did.
                  </p>
                </>
              ) : (
                <Hidden count={view.confidence.readers} />
              )}
            </section>
          </>
        )}

        <p className="ph-honest">
          <b>FirstPaper can be wrong, and that&rsquo;s the point.</b> &ldquo;Our
          answer&rdquo; is our judgement. A question the room split on may be
          one we wrote badly, and that is worth checking against{" "}
          <a href={originalUrl} target="_blank" rel="noopener noreferrer">
            the original paper
          </a>
          .
        </p>
      </main>
    </div>
  );
}
