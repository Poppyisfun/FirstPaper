import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getClassView } from "@/lib/aggregate";
import { getPaper, openingWords } from "@/lib/content";
import ClassView, { type ParagraphInfo } from "./ClassView";

/* Read at request time, through a five-minute cache in lib/aggregate.ts.
   Never prerendered: the build has no business querying the database, and a
   page baked at build time would show the readers of the day it was built. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Class view — FirstPaper",
  description: "How readers of this paper split, for an instructor who assigned it.",
  robots: { index: false },
};

/**
 * A per-paper aggregate for an instructor. Not part of the reading flow and
 * not linked from it: an instructor is given the address.
 */
export default async function ClassPage({
  params,
}: PageProps<"/paper/[slug]/class">) {
  const { slug } = await params;
  const paper = getPaper(slug);
  if (!paper) notFound();

  const paragraphs: Record<string, ParagraphInfo> = {};
  let bodyNumber = 0;
  for (const section of paper.source.sections) {
    for (const paragraph of section.paragraphs) {
      const isAbstract = section.imrad === "abstract";
      if (!isAbstract) bodyNumber += 1;
      paragraphs[paragraph.id] = {
        label: isAbstract ? "Abstract" : `Paragraph ${bodyNumber}`,
        section: section.heading ?? section.imrad,
        html: paragraph.text,
        opening: openingWords(paragraph.text),
      };
    }
  }

  return (
    <ClassView
      title={paper.meta.title}
      originalUrl={paper.meta.originalUrl}
      view={await getClassView(paper)}
      paragraphs={paragraphs}
    />
  );
}
