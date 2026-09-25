import { papers } from "@/content/papers";
import type { Figure, Para, Paper, Section, Tier } from "@/lib/types";

/**
 * The read side of the paper content.
 *
 * Papers live in content/papers as typed TypeScript modules rather than loose
 * JSON. That is deliberate: the shape is checked at compile time, and
 * scripts/verify-content.js fingerprints the module so the authors' text
 * cannot drift without failing the build. Everything here is therefore a
 * lookup over already-loaded, already-typed data, with no file reading and no
 * parsing at runtime.
 *
 * Types are re-exported from lib/types.ts rather than redefined, so there is
 * one definition of the paper shape in the codebase.
 */
export type { Paper, Section, Para, Figure, Tier };

/**
 * Addresses one paragraph within a paper: "sectionIndex-paragraphIndex".
 * Paragraphs carry no id of their own, and this is already the key the reading
 * experience uses for solo, peek and observation state.
 */
export type ParagraphId = `${number}-${number}`;

export type ParagraphHit = {
  id: ParagraphId;
  sectionIndex: number;
  paragraphIndex: number;
  sectionName: string;
  paragraph: Para;
};

/** Every built paper, in library order. */
export function getAllPapers(): Paper[] {
  return papers;
}

/** One paper, or undefined when no data file backs the slug. */
export function getPaper(slug: string): Paper | undefined {
  return papers.find((p) => p.slug === slug);
}

/** Whether a paper exists for this slug. */
export function hasPaper(slug: string): boolean {
  return papers.some((p) => p.slug === slug);
}

/** Every slug that has a paper behind it. */
export function getAllPaperSlugs(): string[] {
  return papers.map((p) => p.slug);
}

/** Builds the id for a paragraph position. */
export function paragraphId(
  sectionIndex: number,
  paragraphIndex: number,
): ParagraphId {
  return `${sectionIndex}-${paragraphIndex}`;
}

/**
 * One paragraph by id, with the section it belongs to. Returns undefined for an
 * unknown paper or an id that points outside the paper, so callers can treat a
 * bad link the same way they treat a missing paper.
 */
export function getParagraph(
  slug: string,
  id: ParagraphId | string,
): ParagraphHit | undefined {
  const paper = getPaper(slug);
  if (!paper) return undefined;

  const [rawSection, rawParagraph] = String(id).split("-");
  const sectionIndex = Number(rawSection);
  const paragraphIndex = Number(rawParagraph);

  if (!Number.isInteger(sectionIndex) || !Number.isInteger(paragraphIndex)) {
    return undefined;
  }

  const section: Section | undefined = paper.sections[sectionIndex];
  const paragraph = section?.paras[paragraphIndex];
  if (!section || !paragraph) return undefined;

  return {
    id: paragraphId(sectionIndex, paragraphIndex),
    sectionIndex,
    paragraphIndex,
    sectionName: section.n,
    paragraph,
  };
}

/** Total paragraphs in a paper. Used for progress and the gate. */
export function countParagraphs(paper: Paper): number {
  return paper.sections.reduce((total, s) => total + s.paras.length, 0);
}

/** Total figures in a paper. */
export function countFigures(paper: Paper): number {
  return paper.sections.reduce((total, s) => total + s.figs.length, 0);
}
