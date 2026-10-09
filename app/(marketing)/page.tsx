import Nav from "@/components/Nav";
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
const journey = [
  {
    tone: "g",
    t: "Read the real paper",
    d: "Not a summary. The actual published text, with the real figures. Beside every paragraph is a plain language explanation written at your level. You choose Explorer, Reader, or Critic, and you can switch any time.",
  },
  {
    tone: "g",
    t: "Check what you understood",
    d: "Five quick questions on what the paper said. There is no penalty for a wrong answer. This is just to make sure the reading landed.",
  },
  {
    tone: "a",
    t: "Judge the science",
    d: "Five harder questions on whether the paper holds up. Was the sample big enough? Did they prove a cause or just find a pattern? Who paid for it? Before each answer, you say how confident you are.",
  },
  {
    tone: "g",
    t: "Read it in plain English",
    d: "A simple summary of the whole paper, with no technical words at all. Nothing stays foggy.",
  },
  {
    tone: "v",
    t: "See your results",
    d: "Your score, your rank, and the skills you unlocked.",
  },
];

/** Bottom to top, so the ladder is rendered in reverse. */
const ranks = ["Explorer", "Reader", "Critic", "Peer Reviewer"];

export default function Home() {
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

        {/* ── The journey ── */}
        <section className="sect" id="how">
          <Rise className="shead">
            <div className="skick">The journey</div>
            <h2 className="stitle">What happens when you open a paper</h2>
            <p className="ssub">
              One paper takes about 25 minutes. Here is exactly what you will
              do.
            </p>
          </Rise>

          <Stagger className="jrn">
            {journey.map((step, i) => (
              <RiseItem key={step.t} className="jrn-step">
                <div className={`jrn-m ${step.tone}`} aria-hidden="true">
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

        {/* ── XP and bonus ── */}
        <section className="sect">
          <Rise className="shead">
            <div className="skick">XP and bonus</div>
            <h2 className="stitle">How you earn, and why it matters</h2>
          </Rise>

          <div className="xpg">
            <Stagger className="xp-col">
              <RiseItem className="xp-b v">
                <h3>XP</h3>
                <p>
                  XP means experience points. You earn XP when you understand a
                  paragraph on your own, when you answer a question correctly,
                  and when you judge well. XP is a record of real reading. You
                  cannot earn it by skimming.
                </p>
              </RiseItem>

              <RiseItem className="xp-b a">
                <h3>Bonus</h3>
                <p>
                  Every paper starts you with an insight bonus. Understand a
                  paragraph yourself and you keep it. Ask for an explanation
                  and you spend a little. Asking for help is always allowed.
                  The bonus is only there to reward trying first.
                </p>
              </RiseItem>

              <RiseItem className="xp-b">
                <h3>Why collect it</h3>
                <p>
                  XP builds your rank. Everyone starts as an Explorer. Keep
                  reading well and you become a Reader, then a Critic, then a
                  Peer Reviewer. Your rank is proof of something you can do,
                  not a prize for showing up.
                </p>
              </RiseItem>

              <RiseItem className="xp-b">
                <h3>Badges</h3>
                <p>
                  You also unlock skill badges along the way. Each one marks a
                  specific thing you can now spot in any paper.
                </p>
              </RiseItem>
            </Stagger>

            <Rise className="ladder" delay={0.1}>
              <ol>
                {[...ranks].reverse().map((r, i) => {
                  const isStart = r === "Explorer";
                  return (
                    <li key={r}>
                      <div className={isStart ? "rung on" : "rung"}>
                        <span className="rung-n">{r}</span>
                        {isStart && <span className="rung-tag">You start here</span>}
                      </div>
                      {i < ranks.length - 1 && (
                        <span className="rung-c" aria-hidden="true">
                          ⌃
                        </span>
                      )}
                    </li>
                  );
                })}
              </ol>
            </Rise>
          </div>
        </section>

        {/* ── Your account ── */}
        <section className="sect tight">
          <Rise className="acct">
            <div className="skick">Your account</div>
            <h2 className="stitle">Keep everything in one place</h2>
            <p>
              Create an account and your XP stays with you. Your dashboard
              shows the papers you have finished, the ones you are partway
              through, and your current rank. As you read, it suggests new
              papers based on what you are interested in.
            </p>
            <BtnLink href="/account" variant="v lg" icon="→">
              Create your account
            </BtnLink>
          </Rise>
        </section>

        {/* ── Where this is going ── */}
        <section className="sect tight">
          <Rise className="strip">
            <div className="glow" />
            <div className="strip-prose">
              <div className="skick on-dark">Where this is going</div>
              <h2 className="strip-h">Soon, any paper in the world</h2>
              <p>
                Right now FirstPaper walks you through papers we have prepared
                by hand. Soon you will be able to drop in any research paper
                and FirstPaper will decode it. The same plain explanations. The
                same questions. The same judgment. Any paper, any field.
              </p>
            </div>
          </Rise>
        </section>

        {/* ── Origin ── */}
        <section className="sect">
          <Rise className="origin">
            <div className="origin-in">
              <q>
                I wanted to read real genetics research and could not get past
                the first page. Nobody teaches you how. So I built the thing I
                wish I had.
              </q>
              <div className="who">The founder, a high school junior</div>
            </div>
          </Rise>
        </section>

        {/* ── Final call ── */}
        <section className="sect final">
          <Rise>
            <h2 className="stitle">Start with one paper.</h2>
            <p className="ssub">
              It takes 25 minutes. You will finish knowing how to read the next
              one.
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
