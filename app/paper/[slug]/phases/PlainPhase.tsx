"use client";

import type { Paper } from "@/lib/types";

/** The whole paper in plain English, so nothing stays foggy at the end. */
export default function PlainPhase({
  paper,
  onNext,
}: {
  paper: Paper;
  onNext: () => void;
}) {
  return (
    <div className="plain-wrap">
      <div className="qhead">
        <div className="qk g">Plain English</div>
        <h1 className="gate-h" id="phase-heading" tabIndex={-1}>
          The whole paper, without the jargon
        </h1>
      </div>

      {/* FirstPaper's recap — our words, not the authors'. */}
      <article
        className="plain"
        dangerouslySetInnerHTML={{ __html: paper.plain }}
      />

      <div className="navrow">
        <span />
        <button type="button" className="btn pri" onClick={onNext}>
          See how you did
          <span className="ic" aria-hidden="true">
            →
          </span>
        </button>
      </div>
    </div>
  );
}
