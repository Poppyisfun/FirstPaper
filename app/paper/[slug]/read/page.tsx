import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { figuresFor, getAllPaperSlugs, getPaper } from "@/lib/content";
import Reader, { type ReaderStep } from "./Reader";

/** Prerender this phase for every paper that exists. */
export function generateStaticParams() {
  return getAllPaperSlugs().map((slug) => ({ slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: PageProps<"/paper/[slug]/read">): Promise<Metadata> {
  const { slug } = await params;
  const paper = getPaper(slug);
  if (!paper) return { title: "Paper not found — FirstPaper" };

  return {
    title: `Read: ${paper.title} — FirstPaper`,
    description: paper.practice_goal,
  };
}

/**
 * Server component. It flattens the paper into the ordered list of paragraphs
 * the reader walks through, each already carrying its section context and its
 * explanation, so the client component holds progress and nothing else.
 */
export default async function ReadPage({
  params,
}: PageProps<"/paper/[slug]/read">) {
  const { slug } = await params;
  const paper = getPaper(slug);
  if (!paper) notFound();

  /* One flat list now: the schema stores paragraphs in reading order with
     their section on each, so there is no nesting to walk. A figure belongs
     to the paragraphs whose text cites it by name, computed at ingest. A
     figure with no image is dropped — a broken thumbnail is worse than
     none. */
  const steps: ReaderStep[] = paper.paragraphs.map((paragraph) => ({
    id: paragraph.id,
    text: paragraph.source_text,
    sectionHeading: paragraph.section,
    imrad: paragraph.imrad,
    explanation: paragraph.explanation,
    caution: paragraph.caution,
    prediction: paragraph.prediction,
    figures: figuresFor(paper, paragraph.id),
  }));

  return (
    <Reader
      paper={{
        slug: paper.slug,
        title: paper.title,
        pmcid: paper.pmcid,
        originalUrl: paper.original_url,
        difficulty: paper.difficulty,
        authors: paper.authors,
        year: paper.year,
        journal: paper.journal,
        licence: paper.licence,
        licenceUrl: paper.licence_url,
      }}
      steps={steps}
    />
  );
}
