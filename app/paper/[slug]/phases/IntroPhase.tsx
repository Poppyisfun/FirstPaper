"use client";

import type { Paper, Tier } from "@/lib/types";
import TierDial from "../components/TierDial";

/** Pre-flight. Sets expectations, explains the dot, picks a reading level. */
export default function IntroPhase({
  paper,
  tier,
  onTier,
  onStart,
}: {
  paper: Paper;
  tier: Tier;
  onTier: (t: Tier) => void;
  onStart: () => void;
}) {
  const figs = paper.sections.reduce((a, s) => a + s.figs.length, 0);

  return (
    <div className="intro">
      <header className="intro-head">
        <div className="ab-kick">Before you start</div>
        <h1 className="stitle" id="phase-heading" tabIndex={-1}>
          You&rsquo;re about to read a real research paper. All of it.
        </h1>
        <p className="ssub">
          Not a summary — the actual published text, figures included. It will
          feel hard in places. That&rsquo;s the point.
        </p>
      </header>

      <div className="intro-grid">
        <section className="icard">
          <h2 className="icard-h">What makes this different</h2>
          <p>
            Every other AI tool makes papers easier to <b>believe</b>. This
            teaches you to <b>judge</b> whether a paper deserves believing.
          </p>
        </section>

        <section className="icard">
          <h2 className="icard-h">What you&rsquo;ll actually do</h2>
          <ul className="icard-list">
            <li>
              <b>Read</b> — the paper itself, section by section.
            </li>
            <li>
              <b>Check</b> — a few questions on what it says.
            </li>
            <li>
              <b>Judge</b> — whether the evidence holds up.
            </li>
            <li>
              <b>Recap</b> — the whole thing in plain English.
            </li>
          </ul>
        </section>

        <section className="icard">
          <h2 className="icard-h">What you&rsquo;ll walk away able to do</h2>
          <ul className="icard-list">
            <li>Read a verb as a hedge</li>
            <li>Say what a control is for</li>
            <li>Spot a small sample, and what rescues it</li>
            <li>Read a figure before the conclusion</li>
            <li>Check who paid</li>
          </ul>
        </section>
      </div>

      <section className="dot-x">
        <div className="dot-x-top">
          <span className="dot-demo" aria-hidden="true">
            ?
          </span>
          <div>
            <h2 className="dot-x-h">The green dot</h2>
            <p>
              Every paragraph has a green dot beside it. The dot is help, and
              help is always available — but it asks you to try first.
            </p>
          </div>
        </div>

        <p>
          Tapping doesn&rsquo;t reveal the answer. It opens a prompt:{" "}
          <i>say this paragraph back in your own words.</i> Then two choices:
        </p>

        <ul className="dot-x-list">
          <li>
            <b className="g">I&rsquo;ve got it</b> — +8 XP. This is the one
            worth chasing.
          </li>
          <li>
            <b className="a">Show me anyway</b> — costs 5 from your insight
            bonus, never from XP, never below zero.
          </li>
        </ul>

        <p className="dot-x-warn">
          <b>Asking for help is never wrong.</b> The explanations exist because
          papers are genuinely hard. But{" "}
          <b>skipping a paragraph entirely earns you nothing at all</b> — the
          dots are how you engage with the reading.
        </p>
      </section>

      <section className="intro-tier">
        <h2 className="icard-h">Choose your reading level</h2>
        <TierDial tier={tier} onChange={onTier} size="full" idPrefix="intro" />
      </section>

      <section className="honest-promise">
        <b>FirstPaper can be wrong — that&rsquo;s the point.</b> The paper text
        and figures are the authors&rsquo; own work. Everything in green, amber
        and violet is our commentary, and commentary can be mistaken. Every
        section links to{" "}
        <a href={paper.meta.url} target="_blank" rel="noopener noreferrer">
          the original
        </a>
        . Checking us is part of the exercise.
      </section>

      <div className="intro-cta">
        <button type="button" className="btn pri lg" onClick={onStart}>
          Start reading
          <span className="ic" aria-hidden="true">
            →
          </span>
        </button>
        <p className="intro-meta">
          {paper.sections.length} sections · {figs} figures · about 25 minutes
        </p>
      </div>
    </div>
  );
}
