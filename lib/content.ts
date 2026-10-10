import { papers } from "@/content/papers";
import type {
  CheckQuestion,
  Difficulty,
  Figure,
  Imrad,
  JudgeQuestion,
  Paper,
  Paragraph,
  Prediction,
  Tag,
} from "@/lib/schema";

/**
 * The read side of the paper content.
 *
 * Papers are JSON committed to the repo, validated against the frozen schema
 * in lib/schema.ts when this module loads, and imported at build time. Every
 * function here is a lookup over already-parsed, already-typed data. Nothing
 * reads a file at runtime, and nothing here touches the database: paper
 * content never lives in Postgres.
 */
export type {
  CheckQuestion,
  Difficulty,
  Figure,
  Imrad,
  JudgeQuestion,
  Paper,
  Paragraph,
  Prediction,
  Tag,
};

/** Every paper the app ships, in library order. */
export function getAllPapers(): Paper[] {
  return papers;
}

/** One paper, or undefined when no folder backs the slug. */
export function getPaper(slug: string): Paper | undefined {
  return papers.find((paper) => paper.slug === slug);
}

/** Whether a paper exists for this slug. */
export function hasPaper(slug: string): boolean {
  return papers.some((paper) => paper.slug === slug);
}

/** Every slug that has a paper behind it. Used for generateStaticParams. */
export function getAllPaperSlugs(): string[] {
  return papers.map((paper) => paper.slug);
}

/** One paragraph by id, or undefined for an unknown paper or id. */
export function getParagraph(
  slug: string,
  paragraphId: string,
): Paragraph | undefined {
  return getPaper(slug)?.paragraphs.find((p) => p.id === paragraphId);
}

/** Every paragraph in reading order. */
export function getParagraphs(slug: string): Paragraph[] {
  return getPaper(slug)?.paragraphs ?? [];
}

/**
 * Paragraphs the reader actually walks through, excluding the abstract.
 *
 * The abstract is an orientation step rather than paragraph one: it already
 * summarises the whole paper, so it is numbered separately in the reader.
 */
export function getBodyParagraphs(slug: string): Paragraph[] {
  return getParagraphs(slug).filter((p) => p.imrad !== "abstract");
}

/** Total paragraphs in a paper, orientation step included. */
export function countParagraphs(paper: Paper): number {
  return paper.paragraphs.length;
}

/** Total figures in a paper. */
export function countFigures(paper: Paper): number {
  return paper.figures.length;
}

/** The figures a given paragraph cites by name, and that have an image. */
export function figuresFor(paper: Paper, paragraphId: string): Figure[] {
  return paper.figures.filter(
    (figure) => figure.src && figure.referenced_by.includes(paragraphId),
  );
}

/** Paragraph id to the section heading it sits under. */
export function sectionIndex(paper: Paper): Record<string, string> {
  return Object.fromEntries(
    paper.paragraphs.map((p) => [p.id, p.section ?? p.imrad]),
  );
}
