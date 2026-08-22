"use client";

import { useState } from "react";
import PaperCard from "@/components/PaperCard";
import Reveal from "@/components/Reveal";
import { FILTERS, LIBRARY, matchesFilter, type Filter } from "@/content/library";

export default function LibraryGrid() {
  const [filter, setFilter] = useState<Filter>("All papers");
  const shown = LIBRARY.filter((entry) => matchesFilter(entry, filter));

  return (
    <>
      <Reveal className="filters">
        {FILTERS.map((f) => (
          <button
            key={f}
            className={f === filter ? "fl on" : "fl"}
            aria-pressed={f === filter}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </Reveal>

      <div className="cards">
        {shown.map((entry) => (
          <Reveal key={entry.slug}>
            <PaperCard entry={entry} />
          </Reveal>
        ))}
      </div>
    </>
  );
}
