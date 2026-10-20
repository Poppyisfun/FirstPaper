import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  MIN_READERS,
  getClassAggregate,
  type ClassAggregate,
  type QuestionAggregate,
} from "@/lib/aggregate";
import { getParagraph, getPaper } from "@/lib/content";
import { TAG_PHRASE } from "@/lib/scoring";

/*
 * The class view. PLACEHOLDER COPY throughout: the wording is to be replaced.
 *
 * Rendered per request, because the numbers come from the database; the query
 * itself is cached in lib/aggregate.ts, so a busy page does not mean a busy
 * database. Not prerendered: there is nothing to know at build time.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Class view",
  robots: { index: false, follow: false },
};

const round = (n: number) => Math.round(n);

/** Said wherever a line is withheld, so a gap is never mistaken for a zero. */
function Withheld({ what }: { what: string }) {
  return (
    <p className="cl-withheld">
      Withheld: fewer than {MIN_READERS} readers have {what} yet. We don&rsquo;t
      publish a number that can&rsquo;t support itself.
    </p>
  );
}

function Split({ q, brief }: { q: QuestionAggregate; brief?: boolean }) {
  if (!q.split.shown) return <Withheld what="answered this question" />;
  return (
    <>
      <ul className={brief ? "cl-split cl-split-brief" : "cl-split"}>
        {q.split.value.map((o) => (
          <li key={o.id} className={o.correct ? "cl-opt right" : "cl-opt"}>
            <div className="cl-opt-top">
              <span className="cl-opt-t">
                {o.correct && <b className="cl-key">Paper&rsquo;s answer · </b>}
                {o.text}
              </span>
              <span className="cl-opt-n">{round(o.share)}%</span>
            </div>
            <div className="cl-track" aria-hidden>
              <i style={{ width: `${o.share}%` }} />
            </div>
          </li>
        ))}
      </ul>
      <p className="cl-n">{q.split.readers} readers</p>
    </>
  );
}

function Lead({ data, slug }: { data: ClassAggregate; slug: string }) {
  const q = data.judge.find((j) => j.id === data.mostDivided?.questionId);
  if (!q || !q.split.shown) {
    return (
      <section className="cl-lead">
        <span className="cl-k">Where they divided hardest</span>
        <Withheld what="answered any one judging question" />
      </section>
    );
  }
  const paragraphs = q.paragraphIds
    .map((id) => getParagraph(slug, id))
    .filter((p) => p !== undefined);
  return (
    <section className="cl-lead">
      <span className="cl-k">Where they divided hardest</span>
      <h2 className="cl-q">{q.prompt}</h2>
      {q.tag && (
        <p className="cl-tag">
          <span>{q.tag}</span> {TAG_PHRASE[q.tag] ?? ""}
        </p>
      )}
      <Split q={q} />
      {paragraphs.map((p) => (
        <blockquote key={p.id} className="cl-para">
          <span className="cl-k">{p.section ?? p.imrad}</span>
          <p dangerouslySetInnerHTML={{ __html: p.source_text }} />
        </blockquote>
      ))}
    </section>
  );
}

export default async function ClassPage({
  params,
}: PageProps<"/paper/[slug]/class">) {
  const { slug } = await params;
  const paper = getPaper(slug);
  if (!paper) notFound();

  let data: ClassAggregate | null = null;
  try {
    data = await getClassAggregate(slug);
  } catch (err) {
    /* Shown as unavailable rather than as empty: "no data" and "no readers"
       are different claims.

       Logged, because the reader-facing message is deliberately vague and a
       swallowed error here is invisible: the only consumer of the embedded
       join is this page, so a query that fails in production fails silently
       and looks like an empty class. */
    console.error(
      `class aggregate failed for ${slug}:`,
      err instanceof Error ? err.message : err,
    );
  }

  return (
    <div className="ph ph-class">
      <header className="ph-head">
        <span className="ph-kick">Class view</span>
      </header>

      <main className="rs cl">
        <h1 className="rc-t">{paper.title}</h1>
        <p className="cl-intro">
          How everyone reading this paper on FirstPaper is getting on, taken
          together. There are no names and no individual rows: this shows where
          readers agreed and where they split, not who said what. Any line
          drawn from fewer than {MIN_READERS} readers is withheld.
        </p>

        {!data ? (
          <p className="cl-withheld">
            The class numbers can&rsquo;t be loaded right now. Try again in a
            few minutes.
          </p>
        ) : (
          <>
            <section className="cl-sec">
              {data.reach.shown ? (
                <dl className="rs-stats cl-reach">
                  <div>
                    <dt>Started</dt>
                    <dd>{data.reach.value.started}</dd>
                  </div>
                  <div>
                    <dt>Reached results</dt>
                    <dd>{data.reach.value.reachedResults}</dd>
                  </div>
                </dl>
              ) : (
                <Withheld what="started this paper" />
              )}
            </section>

            <Lead data={data} slug={slug} />

            <section className="cl-sec">
              <h2 className="cl-h">Confidence against accuracy</h2>
              {data.calibration.shown ? (
                <>
                  <div className="ph-pair">
                    <div>
                      <span className="ph-pair-k">Mean stated confidence</span>
                      <span className="ph-pair-v">
                        {round(data.calibration.value.meanConfidence)}%
                      </span>
                    </div>
                    <div>
                      <span className="ph-pair-k">Mean accuracy</span>
                      <span className="ph-pair-v">
                        {round(data.calibration.value.meanAccuracy)}%
                      </span>
                    </div>
                  </div>
                  <p className="cl-n">
                    Judging round · {data.calibration.readers} readers
                  </p>
                </>
              ) : (
                <Withheld what="finished the judging round" />
              )}
            </section>

            <section className="cl-sec">
              <h2 className="cl-h">Judging round</h2>
              {data.judge.map((q, i) => (
                <article key={q.id} className="cl-item">
                  <p className="ph-n">
                    Question {i + 1}
                    {q.tag ? ` · ${q.tag}` : ""}
                  </p>
                  <h3 className="cl-iq">{q.prompt}</h3>
                  <Split q={q} />
                </article>
              ))}
            </section>

            <section className="cl-sec">
              <h2 className="cl-h">Comprehension check</h2>
              {data.check.map((q, i) => (
                <article key={q.id} className="cl-item cl-item-brief">
                  <p className="ph-n">Question {i + 1}</p>
                  <h3 className="cl-iq">{q.prompt}</h3>
                  <Split q={q} brief />
                </article>
              ))}
            </section>

            <section className="cl-sec">
              <h2 className="cl-h">Paragraphs that surprised readers</h2>
              <p className="cl-sub">
                Before our explanation appears, readers predict what each
                paragraph says. These are the paragraphs where predictions most
                often missed.
              </p>
              {data.missedParagraphs.length > 0 ? (
                <ol className="cl-paras">
                  {data.missedParagraphs.map((m) => {
                    const hit = getParagraph(slug, m.paragraphId);
                    return (
                      <li key={m.paragraphId}>
                        <span className="cl-k">
                          {m.section} · {round(m.wrongShare)}% predicted
                          differently
                        </span>
                        {hit && (
                          <p
                            className="cl-para-t"
                            dangerouslySetInnerHTML={{
                              __html: hit.source_text,
                            }}
                          />
                        )}
                      </li>
                    );
                  })}
                </ol>
              ) : null}
              {data.paragraphsWithheld > 0 && (
                <Withheld
                  what={`predicted ${
                    data.missedParagraphs.length > 0
                      ? `the other ${data.paragraphsWithheld} paragraphs`
                      : "any paragraph"
                  }`}
                />
              )}
            </section>

            <p className="ph-honest">
              <b>FirstPaper can be wrong, and that&rsquo;s the point.</b> These
              are group patterns, not grades. Updated every few minutes.{" "}
              <a href={paper.original_url} target="_blank" rel="noreferrer">
                Read the original paper
              </a>
              .
            </p>
          </>
        )}
      </main>
    </div>
  );
}
