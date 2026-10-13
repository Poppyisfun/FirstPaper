import { getAllPapers } from "@/lib/content";
import {
  XP_CHECK_CORRECT,
  XP_JUDGE_CORRECT,
  XP_PARAGRAPH_PREDICTED,
} from "@/lib/scoring";

export type Topic = "Genetics" | "Evolution" | "Medicine" | "Ecology";

/** Maps a topic to its pill colour class (see .tp.* in globals.css). */
export const topicClass: Record<Topic, string> = {
  Genetics: "gen",
  Evolution: "evo",
  Medicine: "med",
  Ecology: "eco",
};

export type LibraryEntry = {
  slug: string;
  topic: Topic;
  /** Reading level this paper is pitched at. */
  level: string;
  title: string;
  /**
   * The skill practised, never the verdict. A card must not reveal whether a
   * paper is flawed or what its flaw is; finding that out is the product.
   */
  practiceGoal: string;
  minutes: number;
  /** The most XP the paper can award, derived from its content and the scoring rules. */
  xp: number;
};

/**
 * Topic is the one thing a paper file does not carry, because it describes the
 * paper rather than how the library shelves it. Anything not listed here falls
 * back to Genetics.
 */
const TOPICS: Record<string, Topic> = {
  "crispr-human-cells": "Genetics",
};

/**
 * The catalogue, built entirely from getAllPapers(). Every row is a paper that
 * exists, so a card can never advertise something that is not there and a
 * title can never drift from the paper's own metadata.
 */
export const LIBRARY: LibraryEntry[] = getAllPapers().map((paper) => ({
  slug: paper.slug,
  topic: TOPICS[paper.slug] ?? "Genetics",
  level: paper.difficulty,
  title: paper.title,
  practiceGoal: paper.practice_goal,
  minutes: paper.estimated_minutes,
  /* Derived rather than read from meta.json, whose figure (320) had drifted
     from what perfect play actually earns (336). Same reasoning as minutes:
     one source, so the card can't disagree with the results screen. */
  xp:
    paper.paragraphs.length * XP_PARAGRAPH_PREDICTED +
    paper.check.length * XP_CHECK_CORRECT +
    paper.judge.length * XP_JUDGE_CORRECT,
}));

export const FILTERS = [
  "All papers",
  "Genetics",
  "Evolution",
  "Medicine",
  "Ecology",
  "Explorer",
  "Reader",
  "Critic",
] as const;

export type Filter = (typeof FILTERS)[number];

export function matchesFilter(entry: LibraryEntry, filter: Filter): boolean {
  if (filter === "All papers") return true;
  return entry.topic === filter || entry.level === filter;
}
