import Link from "next/link";
import Nav from "@/components/Nav";
import Reveal from "@/components/Reveal";
import HeroSpotlight from "@/components/HeroSpotlight";
import DemoStrip from "@/components/DemoStrip";
import CountUp from "@/components/CountUp";

const loop = [
  {
    tone: "g",
    n: "01 — Read",
    t: "What it says",
    d: "The real paper, verbatim, with a short plain-language translation beside any paragraph that loses you. Never a summary of what's wrong — just what it means.",
  },
  {
    tone: "n",
    n: "02 — Check",
    t: "Did it land?",
    d: "Quick questions so you can't drift forward half-understanding. Instant feedback, no punishment for getting it wrong.",
  },
  {
    tone: "a",
    n: "03 — Judge",
    t: "Is it any good?",
    d: "The part everyone else skips. Sample size, controls, correlation vs cause, who funded it. You commit to an answer before you see the explanation.",
  },
];

export default function Home() {
  return (
    <>
      <Nav dark active="start" />

      <HeroSpotlight>
        <div className="hero-in">
          <div className="eyebrow">
            Science literacy · built by a high schooler
          </div>
          <h1 className="big">
            Learn to read the science — and <em>judge</em> whether it&rsquo;s
            any good.
          </h1>
          <p className="lede">
            Every other tool makes research papers easier to believe. FirstPaper
            makes you better at deciding whether to. Read a real paper, section
            by section, at your level — then learn to catch what&rsquo;s weak in
            it.
          </p>
          <div className="cta-row">
            <Link className="btn lg glow-b" href="/library">
              Read your first paper →
            </Link>
            <a className="btn lg ghost" href="#how">
              How it works
            </a>
          </div>
        </div>
        <DemoStrip />
      </HeroSpotlight>

      <div className="wrap">
        <div className="sect" id="how">
          <Reveal className="shead">
            <div className="skick">The method</div>
            <h2 className="stitle">Three moves, on every paragraph.</h2>
            <p className="ssub">
              Most tools translate a paper and hand it back. That teaches you to
              trust whatever gets simplified. This teaches you to interrogate
              it.
            </p>
          </Reveal>
          <div className="loop grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(250px,1fr))]">
            {loop.map((card) => (
              <Reveal key={card.n} className={`lc ${card.tone}`}>
                <div className="lc-n">{card.n}</div>
                <div className="lc-t">{card.t}</div>
                <div className="lc-d">{card.d}</div>
              </Reveal>
            ))}
          </div>
        </div>

        <div className="sect tight">
          <Reveal className="strip grain">
            <div className="glow" />
            <div className="stats">
              <div className="st">
                <div className="v">
                  <CountUp to={7} />
                </div>
                <div className="l">Things you learn to check</div>
              </div>
              <div className="st">
                <div className="v">
                  <CountUp to={3} />
                </div>
                <div className="l">Reading levels</div>
              </div>
              <div className="st">
                <div className="v">$0</div>
                <div className="l">Cost, forever</div>
              </div>
              <div className="st">
                <div className="v">100%</div>
                <div className="l">Open-access papers</div>
              </div>
            </div>
          </Reveal>
        </div>

        <div className="sect">
          <Reveal className="origin">
            <q>
              I wanted to read real genetics research and couldn&rsquo;t get
              past the first page. Nobody teaches you how. So I built the thing
              I wish I&rsquo;d had.
            </q>
            <div className="who">— the founder, high school junior</div>
            <div style={{ marginTop: 26 }}>
              <Link className="btn pri lg" href="/library">
                Start with one paper →
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </>
  );
}
