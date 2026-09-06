"use client";

import Link from "next/link";
import type { Paper } from "@/lib/types";
import { RANK_NOTE, rankFor } from "@/lib/scoring";

export default function ResultsPhase({
  paper,
  xp,
  quizScore,
  judgeScore,
  solo,
  totalParas,
  earned,
  onReplay,
}: {
  paper: Paper;
  xp: number;
  quizScore: number;
  judgeScore: number;
  solo: number;
  totalParas: number;
  earned: Set<string>;
  onReplay: () => void;
}) {
  const rank = rankFor(xp);

  return (
    <div className="res">
      <div className="rankcard">
        <div className="glow" />
        <div className="rl2">Your rank on this paper</div>
        <div className="rn" id="phase-heading" tabIndex={-1}>
          {rank}
        </div>
        <div className="rx">{xp} XP earned on this paper</div>
      </div>

      <div className="scores">
        <div className="sc g">
          <div className="v">
            {quizScore}/{paper.quiz.length}
          </div>
          <div className="l">Comprehension</div>
        </div>
        <div className="sc a">
          <div className="v">
            {judgeScore}/{paper.judge.length}
          </div>
          <div className="l">Judgement</div>
        </div>
        <div className="sc v2">
          <div className="v">
            {solo}/{totalParas}
          </div>
          <div className="l">Read solo</div>
        </div>
      </div>

      <p className="res-note">{RANK_NOTE[rank]}</p>

      <div className="badges">
        {paper.badges.map((b) => {
          const got = earned.has(b.k);
          return (
            <div className={got ? "bd got" : "bd"} key={b.k}>
              <div className="ic" aria-hidden="true">
                {b.ic}
              </div>
              <div className="nm">{b.nm}</div>
              <div className="ds">{got ? b.ds : "Locked"}</div>
            </div>
          );
        })}
      </div>

      <div className="navrow res-nav">
        <button type="button" className="btn" onClick={onReplay}>
          Read it again
        </button>
        <Link className="btn pri" href="/library">
          Next paper
          <span className="ic" aria-hidden="true">
            →
          </span>
        </Link>
      </div>
    </div>
  );
}
