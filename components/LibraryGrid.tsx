"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import PaperCard from "@/components/PaperCard";
import { Rise, springSoft } from "@/components/motion-primitives";
import { FILTERS, LIBRARY, matchesFilter, type Filter } from "@/content/library";

/**
 * Below this many papers the filter row is hidden.
 *
 * Filters over a one-item shelf read as broken: most values return nothing,
 * and a reader cannot tell an empty category from a bug. They come back on
 * their own once there is something to filter.
 */
const MIN_PAPERS_FOR_FILTERS = 4;

export default function LibraryGrid() {
  const [filter, setFilter] = useState<Filter>("All papers");
  const showFilters = LIBRARY.length >= MIN_PAPERS_FOR_FILTERS;
  const shown = showFilters
    ? LIBRARY.filter((entry) => matchesFilter(entry, filter))
    : LIBRARY;
  const reduce = useReducedMotion();

  return (
    <>
      {showFilters && (
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
      )}

      <motion.div className="cards" layout={!reduce}>
        <AnimatePresence mode="popLayout">
          {shown.map((entry) => (
            <motion.div
              key={entry.slug}
              layout={!reduce}
              initial={reduce ? false : { opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduce ? undefined : { opacity: 0, scale: 0.94 }}
              transition={reduce ? { duration: 0 } : springSoft}
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
        {showFilters && filter !== "All papers" && ` · ${filter}`}
      </p>
    </>
  );
}
