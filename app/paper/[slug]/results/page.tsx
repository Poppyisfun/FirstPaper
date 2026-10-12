import { notFound } from "next/navigation";
import {
  countParagraphs,
  getAllPapers,
  getAllPaperSlugs,
  getPaper,
} from "@/lib/content";
import Results, { type ParagraphRef, type QuestionRef } from "./Results";

/** Prerender this phase for every paper that exists. */
export function generateStaticParams() {
  return getAllPaperSlugs().map((slug) => ({ slug }));
}

export const dynamicParams = false;

/** How many words of a paragraph to quote when pointing back at it. */
const OPENING_WORDS = 9;

/** The paragraph's first few words, as a pointer back to it, never a rewording. */
function opening(html: string): string {
  const words = html
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ");
  return words.length > OPENING_WORDS
    ? `${words.slice(0, OPENING_WORDS).join(" ")}…`
    : words.join(" ");
}

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
  for (const section of paper.source.sections) {
    for (const paragraph of section.paragraphs) {
      const isAbstract = section.imrad === "abstract";
      if (!isAbstract) bodyNumber += 1;
      paragraphs[paragraph.id] = {
        section: section.heading ?? section.imrad,
        label: isAbstract ? "Abstract" : `Paragraph ${bodyNumber}`,
        opening: opening(paragraph.text),
      };
    }
  }

  const toRef = (q: (typeof paper.questions.comprehension)[number]): QuestionRef => ({
    prompt: q.prompt,
    tag: q.tag ?? null,
    correctOptionId: q.correctOptionId,
    options: Object.fromEntries(q.options.map((o) => [o.id, o.text])),
  });

  /* Every question in every paper, by option count. The guessing line and the
     per-tag verdicts are measured against the real number of options, and a
     reader's judgements span papers. */
  const optionCounts: Record<string, number> = {};
  for (const p of getAllPapers()) {
    for (const q of [...p.questions.comprehension, ...p.questions.appraisal]) {
      optionCounts[`${p.meta.slug}:${q.id}`] = q.options.length;
    }
  }

  return (
    <Results
      slug={slug}
      title={paper.meta.title}
      paragraphsTotal={countParagraphs(paper)}
      paragraphs={paragraphs}
      checkIds={paper.questions.comprehension.map((q) => q.id)}
      judgeIds={paper.questions.appraisal.map((q) => q.id)}
      questions={Object.fromEntries(
        [...paper.questions.comprehension, ...paper.questions.appraisal].map(
          (q) => [q.id, toRef(q)],
        ),
      )}
      optionCounts={optionCounts}
    />
  );
}
