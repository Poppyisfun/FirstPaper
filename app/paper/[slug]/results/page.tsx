import { notFound } from "next/navigation";
import {
  countParagraphs,
  getAllPapers,
  getAllPaperSlugs,
  getPaper,
  openingWords,
} from "@/lib/content";
import Results, { type ParagraphRef, type QuestionRef } from "./Results";

/** Prerender this phase for every paper that exists. */
export function generateStaticParams() {
  return getAllPaperSlugs().map((slug) => ({ slug }));
}

export const dynamicParams = false;

/**
 * Server component. It supplies only what is fixed about the paper; every
 * number on the screen is derived in the browser from the reader's events,
 * because nothing scores a reader without an account on the server.
 *
 * There is no next-paper block: one paper exists, and a placeholder suggestion
 * would be worse than none.
 */
export default async function ResultsPage({
  params,
}: PageProps<"/paper/[slug]/results">) {
  const { slug } = await params;
  const paper = getPaper(slug);
  if (!paper) notFound();

  /* Which section each paragraph sits in, and how the reading screen numbered
     it, so a missed prediction reads as "Results, paragraph 9" rather than as
     an opaque id. The abstract sits outside the count there, so here too. */
  const paragraphs: Record<string, ParagraphRef> = {};
  let bodyNumber = 0;
  for (const paragraph of paper.paragraphs) {
    const isAbstract = paragraph.imrad === "abstract";
    if (!isAbstract) bodyNumber += 1;
    paragraphs[paragraph.id] = {
      section: paragraph.section ?? paragraph.imrad,
      label: isAbstract ? "Abstract" : `Paragraph ${bodyNumber}`,
      opening: openingWords(paragraph.source_text),
    };
  }

  /* Check questions carry no tag and judge questions always do, so the ref
     takes either and narrows. */
  const toRef = (
    q: (typeof paper.check)[number] | (typeof paper.judge)[number],
  ): QuestionRef => ({
    prompt: q.prompt,
    tag: "tag" in q ? q.tag : null,
    correct: q.correct,
    options: Object.fromEntries(q.options.map((o) => [o.id, o.text])),
  });

  /* Every question in every paper, by option count. The guessing line and the
     per-tag verdicts are measured against the real number of options, and a
     reader's judgements span papers. */
  const optionCounts: Record<string, number> = {};
  for (const p of getAllPapers()) {
    for (const q of [...p.check, ...p.judge]) {
      optionCounts[`${p.slug}:${q.id}`] = q.options.length;
    }
  }

  return (
    <Results
      slug={slug}
      title={paper.title}
      paragraphsTotal={countParagraphs(paper)}
      paragraphs={paragraphs}
      checkIds={paper.check.map((q) => q.id)}
      judgeIds={paper.judge.map((q) => q.id)}
      questions={Object.fromEntries(
        [...paper.check, ...paper.judge].map(
          (q) => [q.id, toRef(q)],
        ),
      )}
      optionCounts={optionCounts}
    />
  );
}
