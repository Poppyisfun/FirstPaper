import type { Metadata } from "next";
import Nav from "@/components/Nav";
import { Rise } from "@/components/motion-primitives";
import { BtnLink } from "@/components/Btn";

export const metadata: Metadata = {
  title: "About — FirstPaper",
  description:
    "Why FirstPaper exists: a free tool that teaches teenagers to read real scientific research, and to judge whether it's any good.",
};

const steps = [
  {
    n: "01",
    h: "You read the real paper",
    p: "Not a summary. The published text, verbatim, figures included, exactly as the scientists wrote it. Every paragraph has a green dot offering a plain-language translation at your reading level, but it asks you to try first.",
  },
  {
    n: "02",
    h: "You check that it landed",
    p: "Five questions on what the paper actually says. No tricks, no penalty for getting one wrong. This exists so you can't drift forward half-understanding.",
  },
  {
    n: "03",
    h: "You judge the science",
    p: "Five harder questions on whether it holds up: controls, sample size, claim strength, funding. You commit to an answer, and say how confident you are, before you see the explanation.",
  },
  {
    n: "04",
    h: "You get the whole thing in plain English",
    p: "A jargon-free version of the entire paper, so nothing stays foggy at the end.",
  },
];

const faq = [
  {
    q: "Do I need to know biology already?",
    a: "No. Explorer level assumes nothing past middle-school science. The papers are picked partly for being approachable to someone starting cold.",
  },
  {
    q: "Is the paper text really unedited?",
    a: "Yes. It's reproduced verbatim under the authors' open licence, with a link to the original on every section. Only the commentary is ours.",
  },
  {
    q: "What if I get everything wrong?",
    a: "Then you've found out what you didn't know, which is the point. Nothing is graded, nothing is recorded against you, and every explanation appears whether you got it right or not.",
  },
  {
    q: "Can teachers use this with a class?",
    a: "Yes, and it's free for that too. It was designed with science clubs and research programs in mind.",
  },
  {
    q: "How do you choose papers?",
    a: "They have to be open-access, genuinely interesting, and approachable enough to be a real entry point. The library deliberately includes papers with weaknesses. You can't learn to spot weak science if everything you're shown is airtight.",
  },
];

export default function About() {
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
              Why FirstPaper exists.
            </h1>
            <p className="ssub" style={{ maxWidth: 600 }}>
              A free tool that teaches teenagers to read real scientific
              research, and to judge whether it&rsquo;s any good. Built by a
              high schooler who couldn&rsquo;t do either.
            </p>
          </Rise>

          <Rise className="ab-sec">
            <h2>The wall</h2>
            <p>
              There&rsquo;s a moment that happens to a lot of curious teenagers.
              You get interested in something real — CRISPR, antibiotic
              resistance, how memory works — and you decide to stop reading
              articles <i>about</i> the science and go read the science itself.
              You find a paper. You open it.
            </p>
            <p>
              And you get about four sentences in before it closes over your
              head. Not because you aren&rsquo;t smart enough. Because a research
              paper is written by specialists, for specialists, in a format
              nobody ever taught you to read. The structure is unfamiliar, half
              the words are jargon, and the statistics assume a course you
              haven&rsquo;t taken.
            </p>
            <p>
              So you close the tab. <b>That&rsquo;s the wall.</b> And the thing
              about the wall is that it doesn&rsquo;t feel like a missing skill.
              It feels like a verdict about you.
            </p>
          </Rise>

          <Rise className="ab-sec">
            <div className="ab-pull">
              Reading a research paper is a learnable skill. Almost nobody
              teaches it before university, and that gap decides who gets to
              participate in science.
            </div>
          </Rise>

          <Rise className="ab-sec">
            <h2>Why the existing tools make it worse</h2>
            <p>
              There are AI tools that will explain a paper to you. They&rsquo;re
              built for graduate students, and they do one thing: you paste in a
              dense passage, and they hand back a simpler version.
            </p>
            <p>
              That sounds helpful. It&rsquo;s the problem. A tool that makes
              papers <b>easier to believe</b> trains the most dangerous habit in
              science, which is accepting a claim because someone explained it
              confidently. You finish with an answer and no new ability. Next
              paper, same wall.
            </p>
            <div className="ab-cmp">
              <div className="ab-c bad">
                <div className="h">What they do</div>
                <p>
                  Translate the hard parts. You understand this one passage, and
                  you trust it because the explanation sounded authoritative.
                  Nothing transfers.
                </p>
              </div>
              <div className="ab-c good">
                <div className="h">What FirstPaper does</div>
                <p>
                  Teaches you the moves: read it, check you got it, then
                  interrogate whether it holds up. The skill transfers to every
                  paper you ever open.
                </p>
              </div>
            </div>
          </Rise>

          <Rise className="ab-sec">
            <h2>The bet</h2>
            <p>
              FirstPaper is built on a claim that comprehension is the easy
              half. The rarer skill is <b>judgement</b>: knowing whether the
              sample was big enough, whether a correlation got dressed up as a
              cause, whether the conclusion outran the data, whether the funder
              happens to sell the thing the paper recommends.
            </p>
            <p>
              That skill isn&rsquo;t only for scientists. It&rsquo;s what stands
              between you and a confident wrong headline, a supplement ad citing
              a study, a viral claim with a real-looking chart. Learning it on a
              genetics paper is just the cleanest place to practise.
            </p>
          </Rise>

          <Rise className="ab-sec">
            <h2>How it works</h2>
            <div className="ab-steps">
              {steps.map((s) => (
                <div className="ab-step" key={s.n}>
                  <div className="ab-num">{s.n}</div>
                  <div>
                    <h4>{s.h}</h4>
                    <p>{s.p}</p>
                  </div>
                </div>
              ))}
            </div>
          </Rise>

          <Rise className="ab-sec">
            <h2>Three reading levels</h2>
            <p>
              <b>Explorer</b> is plain language for a curious middle schooler.{" "}
              <b>Reader</b> is AP level and explains the reasoning behind each
              move. <b>Critic</b> is early-undergraduate reading with the
              methodological subtext made explicit.
            </p>
            <p>
              You pick, and you can change it mid-paper. The paper itself never
              changes, only the help does. That matters: you&rsquo;re always
              reading the real thing, never a watered-down version of it.
            </p>
          </Rise>

          <Rise className="ab-sec">
            <h2>Why it tells you it might be wrong</h2>
            <p>
              A tool whose whole subject is accuracy has no business pretending
              to be infallible. The explanations here are written with care and
              checked, and they can still be wrong.
            </p>
            <p>
              So FirstPaper says so, on every page, and links every section to
              the original paper. <b>Checking us is part of the exercise.</b> If
              you finish a paper here and never once opened the source,
              you&rsquo;ve learned less than you think.
            </p>
          </Rise>

          <Rise className="ab-sec">
            <h2>Free, and staying that way</h2>
            <p>
              No account, no paywall, no ads. Every paper in the library is
              open-access, from <b>PubMed Central</b> and <b>bioRxiv</b>,
              reproduced under licences that permit it and always credited to
              the authors who did the work.
            </p>
            <p>
              Charging teenagers for access to science would undercut the whole
              point of building this.
            </p>
          </Rise>

          <Rise className="ab-sec">
            <h2>Who made it</h2>
            <p>
              A high school junior who hit this exact wall trying to read
              genetics research, got frustrated enough to do something about it,
              and built the tool he wished had existed.
            </p>
            <p>
              Which is also why the judging layer sits at the centre of the
              product instead of being bolted on at the end.{" "}
              <b>
                Learning to be appropriately skeptical was the harder half, and
                nobody was teaching it.
              </b>
            </p>
          </Rise>

          <Rise className="ab-sec">
            <div className="ab-kick">Questions</div>
            <div className="ab-faq">
              {faq.map((item) => (
                <div className="ab-q" key={item.q}>
                  <h4>{item.q}</h4>
                  <p>{item.a}</p>
                </div>
              ))}
            </div>
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
