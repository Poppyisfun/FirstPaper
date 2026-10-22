import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
import Nav from "@/components/Nav";
import { getAllPapers } from "@/lib/content";
import { chanceBaseline, pct, wilsonInterval } from "@/lib/stats";
import HeroCopy from "@/components/HeroCopy";
import DemoStrip from "@/components/DemoStrip";
import { Rise, Stagger, RiseItem } from "@/components/motion-primitives";
import { BtnLink } from "@/components/Btn";

/**
 * My own run through this paper. Not an average, not a typical result, and
 * not a claim about readers: nobody else has finished it yet.
 *
 * Named constants rather than inline numbers so they can never be mistaken
 * for something derived from data we do not have.
 *
 * WHEN THERE ARE READERS: once five or more people have completed the paper,
 * this figure can be rebuilt from events as a real aggregate, under the same
 * suppression rule the class view uses (MIN_READERS in lib/aggregate.ts).
 * Do not build that switch before the fifth reader exists. A switch with
 * nothing to switch to is how a placeholder becomes a published number.
 */
const MY_RUN = {
  check: { right: 4, of: 5, label: "Comprehension", gloss: "what the paper said" },
  judge: { right: 2, of: 5, label: "Appraisal", gloss: "whether it holds up" },
} as const;

/** Marker colour follows the phase colours used inside the paper itself. */
const steps = [
  {
    t: "Read the real paper",
    d: "Not a summary. The actual published text, with the real figures. Beside every paragraph is a plain language explanation.",
  },
  {
    t: "Check what you understood",
    d: "Five quick questions on what the paper said. There is no penalty for a wrong answer. This is just to make sure the reading landed.",
  },
  {
    /* Violet, matching the judge screen. Amber means caution everywhere
       else in the product, and spending it on a step marker here taught the
       wrong association before the reader ever met a real caution. */
    t: "Judge the science",
    d: "Five harder questions on whether the paper holds up. What did they actually show, and what are they only hoping? Does the claim cover more ground than the experiment did? Did the authors say shown, or suggests? Better than what? What is that percentage a fraction of? Before you see the options, you say how sure you are.",
  },
  {
    t: "Read it in plain English",
    d: "A simple summary of the whole paper, with no technical words at all. Nothing stays foggy.",
  },
  {
    t: "See your results",
    d: "How often you were right, set against how sure you said you were. That gap is the thing worth knowing. One paper is five judgements, which is not much to go on, and the page says so. After four, it can tell you which way you lean.",
  },
];

export const metadata: Metadata = pageMetadata(
  "FirstPaper — read real research, and judge it",
  "FirstPaper teaches teenagers to read and critically judge real scientific papers, section by section.",
);

export default function Home() {
  /* Derived, not asserted. The landing page and the library card used to
     disagree because each carried its own number; meta.json is the one
     place a paper says how long it takes. */
  const minutes = Math.min(...getAllPapers().map((p) => p.estimated_minutes));

  /* The hero's catalogue line and its two numbers come from the paper file.
     The DOI is carried inside original_url rather than in the `doi` field,
     which is null, so it is read back out rather than typed. */
  const first = getAllPapers()[0];
  const heroPaper = {
    title: first.title,
    firstAuthor: first.authors.split(",")[0].trim().split(" ")[0],
    journal: first.journal,
    year: first.year,
    pmcid: first.pmcid,
    doi: first.original_url.match(/doi\.org\/(.+)$/)?.[1] ?? first.doi,
    licence: `CC BY ${first.licence_url.match(/licenses\/by\/([0-9.]+)/)?.[1] ?? ""}`.trim(),
    licenceUrl: first.licence_url,
    paragraphs: first.paragraphs.length,
    minutes: first.estimated_minutes,
  };

  /* The guessing line, from the real option counts. Drawn only when every
     question offers the same number, because a single line across both bars
     would otherwise be wrong for one of them. */
  const optionCounts = new Set(
    [...first.check, ...first.judge].map((q) => q.options.length),
  );
  const chance =
    optionCounts.size === 1 ? chanceBaseline([...optionCounts][0]) : null;

  /* Five questions is not much, and the interval says so. Same function the
     results screen uses, so the figure and the screen cannot disagree. */
  const rows = [MY_RUN.check, MY_RUN.judge].map((r) => {
    const [lo, hi] = wilsonInterval(r.right, r.of);
    return { ...r, share: pct(r.right / r.of), lo: pct(lo), hi: pct(hi) };
  });

  return (
    <>
      <a className="skip" href="#how">
        Skip to content
      </a>
      <Nav dark />

      <div className="hero">
        <HeroCopy paper={heroPaper} />
        <DemoStrip />
      </div>

      <main className="wrap">
        {/* ── The gap ──
            Deliberately not wrapped in Rise: no reveal on load. It is the
            argument, not an effect, and it should be there when the page is. */}
        <section className="sect gap-sect">
          <figure className="gap">
            <div className="gap-idx">
              <span className="gap-idx-n">002</span>
              <span>One run, mine</span>
            </div>

            <p className="gap-lead">
              I wrote every explanation in this paper and have read it more
              times than anyone alive. I still got {MY_RUN.judge.right} of{" "}
              {MY_RUN.judge.of} right on whether it holds up.
            </p>

            <div
              className="gap-plot"
              style={
                chance !== null
                  ? ({ "--chance": pct(chance) / 100 } as React.CSSProperties)
                  : undefined
              }
            >
              {chance !== null && (
                <div className="gap-chance" aria-hidden="true">
                  <span className="gap-chance-l">guessing {pct(chance)}%</span>
                </div>
              )}

              {rows.map((r) => (
                <div className="gap-row" key={r.label}>
                  <div className="gap-lab">
                    <b>{r.label}</b>
                    <span>{r.gloss}</span>
                    <span className="gap-of">
                      {r.right} of {r.of}
                    </span>
                  </div>
                  <div className="gap-track">
                    <span
                      className="gap-fill"
                      style={{ width: `${r.share}%` }}
                    />
                    <span className="gap-n" style={{ left: `${r.share}%` }}>
                      {r.share}%
                    </span>
                    {chance !== null && (
                      <span className="gap-tick" aria-hidden="true" />
                    )}
                  </div>
                </div>
              ))}

              {chance !== null && (
                <p className="gap-chance-m" aria-hidden="true">
                  guessing {pct(chance)}%
                </p>
              )}
            </div>

            <figcaption className="gap-say">
              Reading a paper and judging it are different skills. Almost
              nobody is taught the second one.
            </figcaption>

            <p className="gap-prov">
              One person, one reading, {MY_RUN.check.of + MY_RUN.judge.of}{" "}
              questions
              {chance !== null &&
                `, ${[...optionCounts][0]} options each, so guessing scores ${pct(chance)}%`}
              .{" "}
              {rows
                .map(
                  (r) =>
                    `${r.label} was ${r.right} of ${r.of}, which really means somewhere between ${r.lo}% and ${r.hi}%`,
                )
                .join("; ")}
              . That is not an average, and there is nothing to average yet.
            </p>
          </figure>
        </section>

        {/* ── Who it is for ──
            Three identical cards used to sit here, which was the banned card
            pattern and a rule of three at once. Two sentences now. */}
        <section className="sect">
          <Rise className="shead">
            <div className="skick">
              <span className="skick-n">003</span>Who it is for
            </div>
            <h2 className="stitle">
              If you can read a news article, you can read this.
            </h2>
            <p className="ssub">
              Mostly teenagers. Someone with a science fair project, or
              someone who has just joined a lab and been handed papers nobody
              taught them to read. The paper here is pitched at a reader who
              has taken high school biology, and you do not need more than
              that.
            </p>
          </Rise>
        </section>

        {/* ── Why this matters ── */}
        <section className="sect tight">
          <Rise className="strip">
            <div className="glow" />
            <div className="strip-prose">
              <div className="skick on-dark">
                <span className="skick-n">004</span>Why this matters
              </div>
              <h2 className="strip-h">
                Every important claim traces back to a paper
              </h2>
              <p>
                Every big claim about health, science, and the world comes from
                a research paper. The paper is the source. Everything else is
                someone retelling it, and every retelling loses something or
                adds something.
              </p>
              <p>
                Most people never read the source. They read the headline, the
                summary, the post.
              </p>
              <p>
                When you finally open the real paper, it shuts you out.
                Unfamiliar structure. Technical words. Statistics nobody taught
                you. So you close it and go back to the summary. That is not a
                failure of intelligence. It is a missing skill. And you can
                start learning it today.
              </p>
            </div>
          </Rise>
        </section>

        {/* ── What changes ──
            Five parallel bullets used to sit here, all of them abstractions.
            One argument runs instead, built from a number in this paper, and
            one short line follows it. */}
        <section className="sect">
          <Rise className="shead">
            <div className="skick">
              <span className="skick-n">005</span>What changes
            </div>
            <h2 className="stitle">
              You start asking what a number is a fraction of.
            </h2>
          </Rise>

          <Rise className="runs">
            <p>
              The paper I picked reports an editing rate from a Surveyor
              assay. It reads like a share of cells. It is band intensity on a
              gel: cut fragments over cut plus uncut, measured from DNA pooled
              across the whole dish. Only 30 to 50 percent of those cells ever
              took up the plasmids, so among the cells that actually got the
              machinery, the real rate is roughly two to three times the
              figure you first read. None of it is hidden. It takes somebody
              asking what the denominator was, and almost nobody asks.
            </p>
            <p className="runs-after">
              Learn that on one paper and you have it for the next one.
            </p>
          </Rise>
        </section>

        {/* ── How it works ── */}
        <section className="sect" id="how">
          <Rise className="shead">
            <div className="skick">
              <span className="skick-n">006</span>How it works
            </div>
            <h2 className="stitle">What happens when you open a paper</h2>
            <p className="ssub">
              One paper takes about {minutes} minutes. Here is exactly what
              you will do.
            </p>
          </Rise>

          <Stagger className="jrn">
            {steps.map((step, i) => (
              <RiseItem key={step.t} className="jrn-step">
                <div className="jrn-m" aria-hidden="true">
                  {i + 1}
                </div>
                <div className="jrn-b">
                  <h3 className="jrn-t">{step.t}</h3>
                  <p>{step.d}</p>
                </div>
              </RiseItem>
            ))}
          </Stagger>
        </section>

        {/* ── Scoring ── */}
        <section className="sect">
          <Rise className="shead">
            <div className="skick">
              <span className="skick-n">007</span>Scoring
            </div>
            <h2 className="stitle">What earns XP, and what costs nothing</h2>
          </Rise>

          <Stagger className="xp-col">
            <RiseItem className="xp-b v">
              <h3>XP</h3>
              <p>
                XP means experience points. You earn it when your first guess
                about a paragraph matches what it says, and when you answer a
                question correctly. Nothing you get wrong takes any away.
              </p>
            </RiseItem>

            <RiseItem className="xp-b a">
              <h3>Guess first</h3>
              <p>
                Before each explanation, you pick what you think the paragraph
                says. Then ours appears, and stays. A wrong guess costs
                nothing. It shows us where people get stuck, which is how the
                explanations get better.
              </p>
            </RiseItem>
          </Stagger>
        </section>

        {/* ── Your account ── */}
        <section className="sect tight">
          <Rise className="acct">
            <div className="skick">
              <span className="skick-n">008</span>Your account
            </div>
            <h2 className="stitle">Accounts are coming</h2>
            <p>
              You do not need one. A whole paper works start to finish without
              signing up for anything, and you see your full results at the
              end.
            </p>
            <BtnLink href="/library" variant="pri lg">
              Read a paper instead
            </BtnLink>
          </Rise>
        </section>

        {/* The origin story used to sit here. It is gone rather than
            rewritten: who built this is provenance, and provenance belongs on
            About. The page now runs from what you get to the closing action,
            which is shorter and reads more certain for it. */}

        {/* ── Final call ── */}
        <section className="sect final">
          <Rise>
            <h2 className="stitle">Start with one paper.</h2>
            <p className="ssub">
              It takes {minutes} minutes, and you do not need an account.
            </p>
            <div className="final-cta">
              <BtnLink href="/library" variant="pri lg">
                Read your first paper
              </BtnLink>
            </div>
          </Rise>
        </section>
      </main>
    </>
  );
}
