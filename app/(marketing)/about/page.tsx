import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
import Nav from "@/components/Nav";
import { Rise } from "@/components/motion-primitives";
import { BtnLink } from "@/components/Btn";
import { getAllPapers } from "@/lib/content";

export const metadata: Metadata = pageMetadata(
  "About — FirstPaper",
  "What FirstPaper is, who it's for, how the commentary is made, and where the papers come from.",
);

/** The five things the judging questions come back to. Same order as the tags. */
const checks = [
  { t: "Hedging", q: "Did the authors say shown, or suggests?" },
  { t: "Scope", q: "What did they actually show, and what are they only hoping?" },
  { t: "Generalisation", q: "Does the claim cover more ground than the experiment did?" },
  { t: "Comparison", q: "Better than what?" },
  { t: "Denominator", q: "What is that percentage a fraction of?" },
];

export default function About() {
  /* Derived from the paper files, so this page can't describe a paper that
     isn't in the library or get a licence wrong. */
  const papers = getAllPapers();

  return (
    <>
      <a className="skip" href="#about-body">
        Skip to content
      </a>
      <Nav active="about" />

      <main className="wrap">
        <div className="sect" id="about-body" style={{ paddingTop: 28 }}>
          <Rise className="ab-hero">
            <div className="ab-kick">About</div>
            <h1 className="stitle" style={{ maxWidth: "15ch" }}>
              What this is, and how it&rsquo;s made.
            </h1>
            <p className="ssub" style={{ maxWidth: 600 }}>
              FirstPaper is a free place to read a real research paper, one
              paragraph at a time, and to practise judging whether it holds
              up.
            </p>
          </Rise>

          <Rise className="ab-sec">
            <h2>What it is</h2>
            <p>
              You get the paper on one side, word for word. Our explanation
              sits beside it. Before the explanation appears, you guess what
              the paragraph says. Then you see what we think it says.
            </p>
            <p>
              After the paper come two short rounds of questions. The first
              checks that the reading landed. The second asks whether the paper
              holds up, and before you see the options, you say how sure you
              are. The last screen sets what you said against what was true.
            </p>
            <p>
              It&rsquo;s free. There are no ads, and you don&rsquo;t need an
              account.
            </p>
          </Rise>

          <Rise className="ab-sec">
            <h2>Who it&rsquo;s for</h2>
            <p>
              Anyone who has opened a research paper and closed it again.
              Mostly that means teenagers. A student with a science fair
              project. Someone in a summer research program. Someone who read a
              headline and wanted the source.
            </p>
            <p>
              It also works if you have just joined a lab or started a college
              course and are expected to read papers nobody taught you to read.
              The paper here now is pitched at someone who has taken high
              school biology. You don&rsquo;t need more than that.
            </p>
          </Rise>

          <Rise className="ab-sec">
            <h2>What the judging questions ask</h2>
            <p>
              Reading what a paper says and judging whether it holds up are
              different skills. The second one is rarer. Every judging question
              comes back to one of five things.
            </p>
            {checks.map((c) => (
              <p key={c.t}>
                <b>{c.t}.</b> {c.q}
              </p>
            ))}
            <p>
              None of them need statistics. They need you to read slowly and
              ask one more question than the paper answers.
            </p>
          </Rise>

          <Rise className="ab-sec">
            <h2>How the commentary is made</h2>
            <p>
              Everything that isn&rsquo;t the paper is ours. The explanations,
              the guesses you choose from, the questions, the answers we mark
              as right, and the plain-English recap at the end. It is
              drafted with an AI model against rules we wrote down, then read
              line by line by a person before it goes up. A check that runs
              before any paper is published confirms the questions can&rsquo;t
              be answered from the explanations alone.
            </p>
            <p>
              The guesses are written from the authors&rsquo; paragraph alone,
              never from our explanation, so you can&rsquo;t pick the right one
              by recognising how we sound. Then every set is shown to a model
              with no paragraph at all. If it can still pick the right answer
              from how the options look, say because it&rsquo;s the longest or
              the most careful, the set is thrown out. A reader learns those
              patterns fast, and then stops reading the paper.
            </p>
            <p>
              The questions go through the same test. We also check that our
              explanations never state the answer to a question that comes
              after them.
            </p>
          </Rise>

          <Rise className="ab-sec">
            <div className="ab-pull">
              FirstPaper can be wrong, and that&rsquo;s the point.
            </div>
          </Rise>

          <Rise className="ab-sec">
            <h2>It can be wrong</h2>
            <p>
              Our explanations are a reading of the paper, not the paper. The
              answers we mark as right are our judgement. Tests catch some
              mistakes. They don&rsquo;t catch all of them.
            </p>
            <p>
              So every screen says so, and the original paper is one click
              away from every paragraph. If you disagree with us and can point
              to the sentence in the paper that backs you up, you have done
              exactly what this is for.
            </p>
          </Rise>

          <Rise className="ab-sec">
            <h2>Where the papers come from</h2>
            <p>
              Every paper here is open access. The authors published it under a
              licence that lets anyone reproduce it, as long as the work is
              credited. We reproduce the text and figures word for word. We
              don&rsquo;t fix typos, shorten anything or modernise the wording.
              The authors are credited on every paragraph, with a link to the
              original.
            </p>
            {papers.map((p) => (
              <p key={p.slug}>
                <b>{p.title}.</b> {p.authors}. <i>{p.journal}</i>, {p.year}.{" "}
                {p.licence_url ? (
                  <a href={p.licence_url} target="_blank" rel="noopener noreferrer">
                    {p.licence}
                  </a>
                ) : (
                  p.licence
                )}
                .{" "}
                <a href={p.original_url} target="_blank" rel="noopener noreferrer">
                  Read the original
                </a>
                .
              </p>
            ))}
          </Rise>

          <Rise className="ab-sec">
            <h2>Who built it</h2>
            <p>
              A high school junior who tried to read real genetics research and
              couldn&rsquo;t get past the first page. Nobody teaches you how.
              This is the thing that would have helped.
            </p>
          </Rise>

          <Rise style={{ maxWidth: 720 }}>
            <BtnLink href="/library" variant="pri lg" icon="→">
              Read your first paper
            </BtnLink>
          </Rise>
        </div>
      </main>
    </>
  );
}
