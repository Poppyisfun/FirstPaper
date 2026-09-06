import { getPaper } from "@/content/papers";

export type Topic = "Genetics" | "Evolution" | "Medicine" | "Ecology";
export type Tier = "Explorer" | "Reader" | "Critic";

/** Maps a topic to its pill colour class (see .tp.* in globals.css). */
export const topicClass: Record<Topic, string> = {
  Genetics: "gen",
  Evolution: "evo",
  Medicine: "med",
  Ecology: "eco",
};

export type LibraryEntry = {
  slug: string;
  /**
   * Derived, never hand-set: true when content/papers has a file for this
   * slug. A card with no paper behind it is disabled and unclickable.
   */
  live: boolean;
  topic: Topic;
  tier: Tier;
  title: string;
  /**
   * The skill practised — never the verdict. A card must not reveal whether a
   * paper is flawed or what its flaw is; finding that out is the product.
   * Supports one <b> emphasis, rendered via `skillEmphasis`.
   */
  skill: string;
  skillEmphasis?: string;
  minutes: number;
  xp: number;
};

/**
 * Catalogue rows. `slug` must match the paper's own slug once one is built —
 * that match is what makes the card live and what /paper/[slug] resolves.
 */
const ENTRIES: Omit<LibraryEntry, "live">[] = [
  {
    slug: "dna-breakage-gamgfp",
    topic: "Genetics",
    tier: "Reader",
    title:
      "Engineered proteins detect spontaneous DNA breakage in human and bacterial cells",
    skill: "Tracing a claim back to the experiment that earned it, and reading what a control is for",
    skillEmphasis: "for",
    minutes: 18,
    xp: 350,
  },
  {
    slug: "gene-variant-sleep-timing",
    topic: "Genetics",
    tier: "Explorer",
    title:
      "A single gene variant and its association with self-reported sleep timing",
    skill: "Telling a correlation from a cause when the authors blur them",
    skillEmphasis: "correlation",
    minutes: 12,
    xp: 240,
  },
  {
    slug: "finch-beak-morphology-drought",
    topic: "Evolution",
    tier: "Explorer",
    title: "Beak morphology shifts in a finch population after a drought season",
    skill: "Reading a figure before you read the conclusion",
    minutes: 14,
    xp: 260,
  },
  {
    slug: "supplement-cognitive-performance-trial",
    topic: "Medicine",
    tier: "Critic",
    title:
      "A randomised trial of a dietary supplement on cognitive performance",
    skill: "Finding who paid, and whether it shows in the conclusion",
    minutes: 22,
    xp: 420,
  },
  {
    slug: "soil-microbiome-grassland",
    topic: "Ecology",
    tier: "Reader",
    title: "Soil microbiome diversity across restored and undisturbed grassland",
    skill: "Judging whether a sample really represents what it claims to",
    minutes: 16,
    xp: 300,
  },
  {
    slug: "crispr-off-target-sequencing",
    topic: "Genetics",
    tier: "Critic",
    title: "CRISPR off-target effects measured by whole-genome sequencing",
    skill: "Spotting the limits an author states — and the ones they don't",
    minutes: 24,
    xp: 440,
  },
];

/**
 * One source of truth: a row is live only if a paper file backs its slug, and
 * a built paper's title comes from its own locked metadata rather than being
 * retyped here, so the two can never drift.
 */
export const LIBRARY: LibraryEntry[] = ENTRIES.map((entry) => {
  const paper = getPaper(entry.slug);
  return {
    ...entry,
    live: paper !== undefined,
    title: paper?.meta.title ?? entry.title,
  };
});

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
  return entry.topic === filter || entry.tier === filter;
}
