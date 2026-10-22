import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
import Nav from "@/components/Nav";
import { getAllPapers } from "@/lib/content";
import HeroSpotlight from "@/components/HeroSpotlight";
import HeroCopy from "@/components/HeroCopy";
import DemoStrip from "@/components/DemoStrip";
import { Rise, Stagger, RiseItem } from "@/components/motion-primitives";
import { BtnLink } from "@/components/Btn";

const audience = [
  {
    t: "Students",
    d: "You are curious about science and want to go past the textbook. Maybe you have a science fair, a research program, or a question that a search result cannot answer.",
  },
  {
    t: "New researchers",
    d: "You just joined a lab or started a college course, and you are expected to read papers that nobody ever taught you how to read.",
  },
  {
    t: "Anyone who wants the truth",
    d: "You saw a headline that said a study shows something, and you want to know what the study actually says.",
  },
];

const gains = [
  "You stop depending on other people’s summaries.",
  "You can tell a strong study from a weak one.",
  "You know when a headline is bigger than the science behind it.",
  "You can hold your own in a lab, a class, or an argument.",
  "The skill transfers. Learn it on one paper and you carry it to every paper after.",
];

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

  return (
    <>
      <a className="skip" href="#how">
        Skip to content
      </a>
      <Nav dark />

      <HeroSpotlight>
        <HeroCopy />
        <DemoStrip />
      </HeroSpotlight>

      <main className="wrap">
        {/* ── Who this is for ── */}
        <section className="sect">
          <Rise className="shead">
            <div className="skick">Who this is for</div>
            <h2 className="stitle">Built for people who want the real thing</h2>
            <p className="ssub">
              If you can read a news article, you can learn to read a research
              paper. That is the whole idea.
            </p>
          </Rise>

          <Stagger className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(258px,1fr))]">
            {audience.map((card) => (
              <RiseItem key={card.t} className="shell">
                <article className="lc g">
                  <h3 className="lc-t">{card.t}</h3>
                  <p className="lc-d">{card.d}</p>
                </article>
              </RiseItem>
            ))}
          </Stagger>
        </section>

        {/* ── Why this matters ── */}
        <section className="sect tight">
          <Rise className="strip">
            <div className="glow" />
            <div className="strip-prose">
              <div className="skick on-dark">Why this matters</div>
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

        {/* ── What you get ── */}
        <section className="sect">
          <Rise className="shead">
            <div className="skick">What you get</div>
            <h2 className="stitle">What changes when you can read a paper</h2>
          </Rise>

          <Stagger className="gains">
            {gains.map((g) => (
              <RiseItem key={g} className="gain">
                <span className="gain-c" aria-hidden="true">
                  ✓
                </span>
                <p>{g}</p>
              </RiseItem>
            ))}
          </Stagger>
        </section>

        {/* ── How it works ── */}
        <section className="sect" id="how">
          <Rise className="shead">
            <div className="skick">How it works</div>
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
            <div className="skick">Scoring</div>
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
            <div className="skick">Your account</div>
            <h2 className="stitle">Accounts are coming</h2>
            <p>
              You do not need one. A whole paper works start to finish without
              signing up for anything, and you see your full results at the
              end.
            </p>
            <BtnLink href="/library" variant="pri lg" icon="→">
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
              It takes {minutes} minutes. You will finish knowing how to read
              the next one.
            </p>
            <div className="final-cta">
              <BtnLink href="/library" variant="pri lg" icon="→">
                Read your first paper
              </BtnLink>
            </div>
          </Rise>
        </section>
      </main>
    </>
  );
}
