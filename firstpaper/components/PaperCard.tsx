"use client";

import Link from "next/link";
import { useRef } from "react";
import type { MouseEvent } from "react";
import { topicClass, type LibraryEntry } from "@/content/library";

/** Renders the skill line with its one emphasised term, if the entry has one. */
function SkillLine({ entry }: { entry: LibraryEntry }) {
  if (!entry.skillEmphasis) return <>{entry.skill}</>;
  const [before, ...rest] = entry.skill.split(entry.skillEmphasis);
  return (
    <>
      {before}
      <b>{entry.skillEmphasis}</b>
      {rest.join(entry.skillEmphasis)}
    </>
  );
}

export default function PaperCard({ entry }: { entry: LibraryEntry }) {
  const ref = useRef<HTMLDivElement>(null);

  // Feeds the radial-gradient sheen in .pc::after.
  function trackGlow(e: MouseEvent<HTMLElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  }

  const body = (
    <>
      <div className="pc-top">
        <span className={`tp ${topicClass[entry.topic]}`}>{entry.topic}</span>
        <span className="tier">{entry.tier}</span>
      </div>
      <div className="pc-t">{entry.title}</div>
      <div className="pc-s">
        <b>You&rsquo;ll practise:</b> <SkillLine entry={entry} />
      </div>
      <div className="pc-f">
        <span>
          <span className="dotst" />
          {entry.live ? "Not started" : "Coming soon"}
        </span>
        <span>{entry.minutes} min</span>
        <span className="xpb">&#9670; {entry.xp} XP</span>
      </div>
    </>
  );

  if (!entry.live) {
    return (
      <div ref={ref} className="pc soon" aria-disabled="true">
        {body}
      </div>
    );
  }

  return (
    <div ref={ref} className="pc" onMouseMove={trackGlow}>
      <Link
        href={`/paper/${entry.slug}`}
        className="absolute inset-0 z-1"
        aria-label={entry.title}
      />
      {body}
    </div>
  );
}
