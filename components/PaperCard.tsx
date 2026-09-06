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
  const frame = useRef<number | null>(null);

  // Feeds the radial sheen in .pc-in::after, throttled to one write per frame.
  function trackGlow(e: MouseEvent<HTMLElement>) {
    const el = ref.current;
    if (!el || frame.current !== null) return;
    const { clientX, clientY } = e;

    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${clientX - r.left}px`);
      el.style.setProperty("--my", `${clientY - r.top}px`);
    });
  }

  const body = (
    <div className="pc-in">
      <div className="pc-top">
        <span className={`tp ${topicClass[entry.topic]}`}>{entry.topic}</span>
        <span className="tier">{entry.tier}</span>
      </div>
      <h2 className="pc-t">{entry.title}</h2>
      <p className="pc-s">
        <b>You&rsquo;ll practise:</b> <SkillLine entry={entry} />
      </p>
      <div className="pc-f">
        <span>
          <span className={entry.live ? "dotst live" : "dotst"} />
          {entry.live ? "Not started" : "Coming soon"}
        </span>
        <span>{entry.minutes} min</span>
        <span className="xpb">&#9670; {entry.xp} XP</span>
      </div>
    </div>
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
        className="absolute inset-0 z-1 rounded-[26px]"
        aria-label={`${entry.title} — ${entry.tier} level, ${entry.minutes} minutes`}
      />
      {body}
    </div>
  );
}
