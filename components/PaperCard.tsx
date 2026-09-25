"use client";

import Link from "next/link";
import { useRef } from "react";
import type { MouseEvent } from "react";
import { topicClass, type LibraryEntry } from "@/content/library";

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

  return (
    <div ref={ref} className="pc" onMouseMove={trackGlow}>
      {/* Reading starts at the first phase, not at a separate intro screen. */}
      <Link
        href={`/paper/${entry.slug}/read`}
        className="absolute inset-0 z-1 rounded-[26px]"
        aria-label={`${entry.title} — ${entry.level} level, ${entry.minutes} minutes`}
      />
      <div className="pc-in">
        <div className="pc-top">
          <span className={`tp ${topicClass[entry.topic]}`}>{entry.topic}</span>
          <span className="tier">{entry.level}</span>
        </div>
        <h2 className="pc-t">{entry.title}</h2>
        <p className="pc-s">{entry.practiceGoal}</p>
        <div className="pc-f">
          <span>
            <span className="dotst live" />
            Not started
          </span>
          <span>{entry.minutes} min</span>
          <span className="xpb">&#9670; {entry.xp} XP</span>
        </div>
      </div>
    </div>
  );
}
