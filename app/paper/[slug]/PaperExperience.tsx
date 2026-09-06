"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Nav from "@/components/Nav";
import HonestyNote from "@/components/HonestyNote";
import type { Paper, Tier } from "@/lib/types";
import {
  PEEK_COST,
  QUIZ_XP,
  SOLO_XP,
  START_BONUS,
  floor0,
  judgeDelta,
  progressFor,
  type Phase,
  type Wager,
} from "@/lib/scoring";
import ProgressHUD from "./components/ProgressHUD";
import type { ParaState } from "./components/Paragraph";
import IntroPhase from "./phases/IntroPhase";
import ReadPhase from "./phases/ReadPhase";
import GatePhase from "./phases/GatePhase";
import QuizPhase from "./phases/QuizPhase";
import JudgePhase from "./phases/JudgePhase";
import PlainPhase from "./phases/PlainPhase";
import ResultsPhase from "./phases/ResultsPhase";

/**
 * Owns every piece of progress for one paper. All state is React state and
 * lives only for the session — no localStorage, by design.
 *
 * Phase order is locked: intro → read → gate → quiz → judge → plain → results.
 */
export default function PaperExperience({ paper }: { paper: Paper }) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [tier, setTier] = useState<Tier>("r");
  const [sec, setSec] = useState(0);
  const [xp, setXp] = useState(0);
  const [bonus, setBonus] = useState(START_BONUS);
  const [solo, setSolo] = useState<Set<string>>(new Set());
  const [peek, setPeek] = useState<Set<string>>(new Set());
  const [promptKey, setPromptKey] = useState<string | null>(null);
  const [qIdx, setQIdx] = useState(0);
  const [jIdx, setJIdx] = useState(0);
  const [quizChosen, setQuizChosen] = useState<number | null>(null);
  const [judgeChosen, setJudgeChosen] = useState<number | null>(null);
  const [wager, setWager] = useState<Wager | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [judgeScore, setJudgeScore] = useState(0);
  const [earned, setEarned] = useState<Set<string>>(new Set());
  /** The bonus is banked once, so revisiting the gate cannot pay twice. */
  const [banked, setBanked] = useState(0);
  const [hasBanked, setHasBanked] = useState(false);

  const totalParas = useMemo(
    () => paper.sections.reduce((a, s) => a + s.paras.length, 0),
    [paper],
  );

  /* Move focus to the new heading so keyboard and screen-reader users are not
     stranded at the top of an apparently unchanged document. */
  const shell = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = shell.current?.querySelector<HTMLElement>("#phase-heading");
    h?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [phase, sec, qIdx, jIdx]);

  const stateFor = useCallback(
    (s: number, p: number): ParaState => {
      const key = `${s}-${p}`;
      if (solo.has(key)) return "solo";
      if (peek.has(key)) return "peek";
      return "open";
    },
    [solo, peek],
  );

  const markSolo = useCallback((key: string) => {
    setSolo((prev) => {
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      return next;
    });
    setXp((v) => floor0(v + SOLO_XP));
    setPromptKey(null);
  }, []);

  const markPeek = useCallback((key: string) => {
    setPeek((prev) => {
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      return next;
    });
    // Costs the insight bonus only. Never XP, never below zero.
    setBonus((v) => floor0(v - PEEK_COST));
    setPromptKey(null);
  }, []);

  /** Solo / helped / skipped across the sections already passed. */
  const tally = useMemo(() => {
    let s = 0;
    let h = 0;
    let seen = 0;
    for (let i = 0; i <= sec && i < paper.sections.length; i++) {
      const n = paper.sections[i].paras.length;
      seen += n;
      for (let p = 0; p < n; p++) {
        const key = `${i}-${p}`;
        if (solo.has(key)) s++;
        else if (peek.has(key)) h++;
      }
    }
    return { solo: s, helped: h, skipped: seen - s - h };
  }, [sec, solo, peek, paper]);

  function enterGate() {
    if (!hasBanked) {
      setBanked(bonus);
      setXp((v) => floor0(v + bonus));
      setBonus(0);
      setHasBanked(true);
    }
    setPhase("gate");
  }

  function answerQuiz(i: number) {
    if (quizChosen !== null) return;
    setQuizChosen(i);
    if (paper.quiz[qIdx].o[i].c === 1) {
      setXp((v) => floor0(v + QUIZ_XP));
      setQuizScore((v) => v + 1);
    }
  }

  function nextQuiz() {
    if (qIdx < paper.quiz.length - 1) {
      setQIdx((v) => v + 1);
      setQuizChosen(null);
    } else {
      setPhase("judge");
    }
  }

  function answerJudge(i: number) {
    if (judgeChosen !== null || wager === null) return;
    setJudgeChosen(i);

    const q = paper.judge[jIdx];
    const correct = q.o[i].c === 1;
    setXp((v) => floor0(v + judgeDelta(correct, wager)));

    if (correct) {
      setJudgeScore((v) => v + 1);
      setEarned((prev) => {
        const next = new Set(prev);
        next.add(q.bk);
        return next;
      });
    }
  }

  function nextJudge() {
    if (jIdx < paper.judge.length - 1) {
      setJIdx((v) => v + 1);
      setJudgeChosen(null);
      setWager(null);
    } else {
      setPhase("plain");
    }
  }

  function replay() {
    setPhase("intro");
    setSec(0);
    setXp(0);
    setBonus(START_BONUS);
    setSolo(new Set());
    setPeek(new Set());
    setPromptKey(null);
    setQIdx(0);
    setJIdx(0);
    setQuizChosen(null);
    setJudgeChosen(null);
    setWager(null);
    setQuizScore(0);
    setJudgeScore(0);
    setEarned(new Set());
    setBanked(0);
    setHasBanked(false);
  }

  const label =
    phase === "intro"
      ? "Before you start"
      : phase === "read"
        ? `Reading · ${sec + 1} of ${paper.sections.length}`
        : phase === "gate"
          ? "Checkpoint"
          : phase === "quiz"
            ? `Quiz · ${qIdx + 1} of ${paper.quiz.length}`
            : phase === "judge"
              ? `Judging · ${jIdx + 1} of ${paper.judge.length}`
              : phase === "plain"
                ? "Plain English"
                : "Results";

  const pct = progressFor({
    phase,
    sec,
    sections: paper.sections.length,
    qIdx,
    quizLen: paper.quiz.length,
    jIdx,
    judgeLen: paper.judge.length,
  });

  return (
    <>
      <a className="skip" href="#phase-heading">
        Skip to content
      </a>

      <Nav hud={<ProgressHUD label={label} pct={pct} xp={xp} bonus={bonus} />} />

      <main className="wrap" ref={shell}>
        <div className="px">
          <div className="px-head">
            <span className="px-t">{paper.meta.title}</span>
            <a
              className="px-src"
              href={paper.meta.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {paper.meta.cite}
              <span aria-hidden="true"> ↗</span>
            </a>
          </div>

          {phase === "intro" && (
            <IntroPhase
              paper={paper}
              tier={tier}
              onTier={setTier}
              onStart={() => setPhase("read")}
            />
          )}

          {phase === "read" && (
            <ReadPhase
              paper={paper}
              sec={sec}
              tier={tier}
              onTier={setTier}
              stateFor={stateFor}
              promptKey={promptKey}
              onOpenPrompt={setPromptKey}
              onSolo={markSolo}
              onPeek={markPeek}
              tally={tally}
              onBack={() => setSec((v) => Math.max(0, v - 1))}
              onNext={() => {
                if (sec < paper.sections.length - 1) setSec((v) => v + 1);
                else enterGate();
              }}
            />
          )}

          {phase === "gate" && (
            <GatePhase
              total={totalParas}
              solo={solo.size}
              helped={peek.size}
              banked={banked}
              onBack={() => setPhase("read")}
              onNext={() => setPhase("quiz")}
            />
          )}

          {phase === "quiz" && (
            <QuizPhase
              paper={paper}
              idx={qIdx}
              chosen={quizChosen}
              onChoose={answerQuiz}
              onNext={nextQuiz}
            />
          )}

          {phase === "judge" && (
            <JudgePhase
              paper={paper}
              idx={jIdx}
              chosen={judgeChosen}
              wager={wager}
              onWager={setWager}
              onChoose={answerJudge}
              onNext={nextJudge}
            />
          )}

          {phase === "plain" && (
            <PlainPhase paper={paper} onNext={() => setPhase("results")} />
          )}

          {phase === "results" && (
            <ResultsPhase
              paper={paper}
              xp={xp}
              quizScore={quizScore}
              judgeScore={judgeScore}
              solo={solo.size}
              totalParas={totalParas}
              earned={earned}
              onReplay={replay}
            />
          )}

          {/* Part of the product, on every phase — not a footnote. */}
          <div className="px-honest">
            <HonestyNote />
          </div>
        </div>
      </main>
    </>
  );
}
