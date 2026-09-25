import { papers } from "@/content/papers";
import type {
  Explanation,
  Explanations,
  Figure,
  ImradTag,
  Level,
  LoadedPaper,
  Paragraph,
  ParagraphHit,
  PaperMeta,
  PaperSource,
  Section,
} from "@/lib/content-types";

/**
 * The read side of the paper content.
 *
 * Papers are JSON committed to the repo and imported at build time, so every
 * function here is a lookup over already-loaded, already-typed data. Nothing
 * reads a file or parses at runtime, and nothing here touches the database:
 * paper content never lives in Postgres.
 */
export type {
  Explanation,
  Explanations,
  Figure,
  ImradTag,
  Level,
  LoadedPaper,
  Paragraph,
  ParagraphHit,
  PaperMeta,
  PaperSource,
  Section,
};

/** Every paper the app ships, in library order. */
export function getAllPapers(): LoadedPaper[] {
  return papers;
}

/** One paper, or undefined when no folder backs the slug. */
export function getPaper(slug: string): LoadedPaper | undefined {
  return papers.find((paper) => paper.meta.slug === slug);
}

/** Whether a paper exists for this slug. */
export function hasPaper(slug: string): boolean {
  return papers.some((paper) => paper.meta.slug === slug);
}

/** Every slug that has a paper behind it. Used for generateStaticParams. */
export function getAllPaperSlugs(): string[] {
  return papers.map((paper) => paper.meta.slug);
}

/**
 * One paragraph by id, with its section context and our commentary.
 *
 * Returns undefined for an unknown paper or an id that is not in it, so a bad
 * link is handled the same way as a missing paper. The explanation is null
 * rather than absent when a paragraph has no commentary yet, which keeps the
 * caller from having to tell "no entry" apart from "empty entry".
 */
export function getParagraph(
  slug: string,
  paragraphId: string,
): ParagraphHit | undefined {
  const paper = getPaper(slug);
  if (!paper) return undefined;

  for (const section of paper.source.sections) {
    const index = section.paragraphs.findIndex((p) => p.id === paragraphId);
    if (index === -1) continue;

    return {
      id: paragraphId,
      sectionIndex: section.index,
      paragraphIndex: index,
      sectionHeading: section.heading,
      imrad: section.imrad,
      paragraph: section.paragraphs[index],
      explanation: paper.explanations[paragraphId] ?? null,
    };
  }

  return undefined;
}

/** Every paragraph in reading order, flattened across sections. */
export function getParagraphs(slug: string): Paragraph[] {
  const paper = getPaper(slug);
  if (!paper) return [];
  return paper.source.sections.flatMap((section) => section.paragraphs);
}

/** Our commentary for one paragraph at one reading level, or null. */
export function getExplanation(
  slug: string,
  paragraphId: string,
  level: Level,
): string | null {
  const paper = getPaper(slug);
  const entry = paper?.explanations[paragraphId];
  if (!entry) return null;

  const text = entry[level];
  return text.length > 0 ? text : null;
}

/** Total paragraphs in a paper. Used for progress and the checkpoint. */
export function countParagraphs(paper: LoadedPaper): number {
  return paper.source.sections.reduce(
    (total, section) => total + section.paragraphs.length,
    0,
  );
}

/** Total figures in a paper. */
export function countFigures(paper: LoadedPaper): number {
  return paper.source.figures.length;
}
