import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllPaperSlugs, getPaper } from "@/lib/content";
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
    title: `Read: ${paper.meta.title} — FirstPaper`,
    description: paper.meta.practiceGoal,
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

  /* A figure belongs to the paragraphs whose text cites it by name, which is
     computed at ingest rather than here. A figure with no image is dropped:
     there is nothing to show, and a broken thumbnail is worse than none. */
  const steps: ReaderStep[] = paper.source.sections.flatMap((section) =>
    section.paragraphs.map((paragraph) => ({
      id: paragraph.id,
      text: paragraph.text,
      sectionHeading: section.heading,
      imrad: section.imrad,
      explanation: paper.explanations[paragraph.id] ?? {
        explorer: "",
        reader: "",
        critic: "",
      },
      prediction: paper.predictions[paragraph.id] ?? null,
      figures: paper.source.figures.filter(
        (figure) =>
          figure.href && (figure.referenced_by ?? []).includes(paragraph.id),
      ),
    })),
  );

  return (
    <Reader
      paper={{
        slug: paper.meta.slug,
        title: paper.meta.title,
        pmcid: paper.source.pmcid,
        originalUrl: paper.meta.originalUrl,
        difficulty: paper.meta.level,
        authors: paper.meta.authors,
        year: paper.meta.year,
        journal: paper.meta.journal,
        licence: paper.meta.licence,
        licenceUrl: paper.meta.licenceUrl,
      }}
      steps={steps}
    />
  );
}
