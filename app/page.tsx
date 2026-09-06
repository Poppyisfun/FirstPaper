import Nav from "@/components/Nav";
import HeroSpotlight from "@/components/HeroSpotlight";
import HeroCopy from "@/components/HeroCopy";
import DemoStrip from "@/components/DemoStrip";
import CountUp from "@/components/CountUp";
import { Rise, Stagger, RiseItem } from "@/components/motion-primitives";
import { BtnLink } from "@/components/Btn";

const loop = [
  {
    tone: "g",
    n: "01 — Read",
    t: "What it says",
    d: "The real paper, verbatim. Any paragraph that loses you has a plain-language translation sitting next to it: what the sentence means, not what's wrong with it.",
  },
  {
    tone: "n",
    n: "02 — Check",
    t: "Did it land?",
    d: "A few quick questions, so you can't drift forward half-understanding. Get one wrong and nothing happens except that you find out.",
  },
  {
    tone: "a",
    n: "03 — Judge",
    t: "Is it any good?",
    d: "The part everyone else skips. Sample size, controls, correlation dressed up as cause, who paid for it. You commit to an answer before the explanation appears.",
  },
];

/** `count` animates up from zero; `text` renders as-is. */
const stats: { count?: number; text?: string; l: string }[] = [
  { count: 7, l: "Things you learn to check" },
  { count: 3, l: "Reading levels" },
  { text: "$0", l: "Cost, forever" },
  { text: "100%", l: "Open-access papers" },
];

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
        <section className="sect" id="how">
          <Rise className="shead">
            <div className="skick">The method</div>
            <h2 className="stitle">Three moves, on every paragraph.</h2>
            <p className="ssub">
              Most tools translate a paper and hand it back. That teaches you to
              trust whatever gets simplified. This teaches you to argue with it.
            </p>
          </Rise>

          <Stagger className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
            {loop.map((card) => (
              <RiseItem key={card.n} className="shell">
                <article className={`lc ${card.tone}`}>
                  <div className="lc-n">{card.n}</div>
                  <h3 className="lc-t">{card.t}</h3>
                  <p className="lc-d">{card.d}</p>
                </article>
              </RiseItem>
            ))}
          </Stagger>
        </section>

        <section className="sect tight">
          <Rise className="strip">
            <div className="glow" />
            <div className="stats">
              {stats.map((s, i) => (
                <div className="st" key={s.l}>
                  <div className="v">
                    {s.count !== undefined ? (
                      <CountUp to={s.count} delay={0.15 + i * 0.08} />
                    ) : (
                      s.text
                    )}
                  </div>
                  <div className="l">{s.l}</div>
                </div>
              ))}
            </div>
          </Rise>
        </section>

        <section className="sect">
          <Rise className="origin">
            <div className="origin-in">
              <q>
                I wanted to read real genetics research and couldn&rsquo;t get
                past the first page. Nobody teaches you how. So I built the
                thing I wish I&rsquo;d had.
              </q>
              <div className="who">— the founder, high school junior</div>
              <div style={{ marginTop: 30 }}>
                <BtnLink href="/library" variant="pri lg" icon="→">
                  Start with one paper
                </BtnLink>
              </div>
            </div>
          </Rise>
        </section>
      </main>
    </>
  );
}
