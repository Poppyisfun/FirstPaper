"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import PaperCard from "@/components/PaperCard";
import { Rise, springSoft } from "@/components/motion-primitives";
import { FILTERS, LIBRARY, matchesFilter, type Filter } from "@/content/library";

export default function LibraryGrid() {
  const [filter, setFilter] = useState<Filter>("All papers");
  const shown = LIBRARY.filter((entry) => matchesFilter(entry, filter));
  const reduce = useReducedMotion();

  return (
    <>
      <Rise className="filters" delay={0.08}>
        {FILTERS.map((f) => (
          <button
            key={f}
            className={f === filter ? "fl on" : "fl"}
            aria-pressed={f === filter}
            onClick={() => setFilter(f)}
          >
            {/* The dark pill is one element that slides between filters. */}
            {f === filter && !reduce && (
              <motion.span
                layoutId="filter-pill"
                className="fl-pill"
                transition={springSoft}
              />
            )}
            <span className="fl-t">{f}</span>
          </button>
        ))}
      </Rise>

      <motion.div className="cards" layout={!reduce}>
        <AnimatePresence mode="popLayout">
          {shown.map((entry) => (
            <motion.div
              key={entry.slug}
              layout={!reduce}
              initial={reduce ? false : { opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduce ? undefined : { opacity: 0, scale: 0.94 }}
              transition={springSoft}
              className="flex"
            >
              <PaperCard entry={entry} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      <p
        aria-live="polite"
        className="mt-6 font-mono text-[9.5px] uppercase tracking-[0.13em] text-ink-soft"
      >
        {shown.length} {shown.length === 1 ? "paper" : "papers"}
        {filter !== "All papers" && ` · ${filter}`}
      </p>
    </>
  );
}
