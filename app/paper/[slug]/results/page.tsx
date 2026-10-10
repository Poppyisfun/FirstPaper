import { notFound } from "next/navigation";
import {
  countParagraphs,
  getAllPaperSlugs,
  getPaper,
  sectionIndex,
} from "@/lib/content";
import Results from "./Results";

/** Prerender this phase for every paper that exists. */
export function generateStaticParams() {
  return getAllPaperSlugs().map((slug) => ({ slug }));
}

export const dynamicParams = false;

/**
 * Server component. It supplies only what is fixed about the paper; every
 * number on the screen is derived in the browser from this session's events,
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

  /* Which section each paragraph sits in, so a missed prediction can be
     reported as "Materials and methods" rather than as an opaque id. The
     client has no access to source.json. */
  const sectionOf = sectionIndex(paper);

  return (
    <Results
      slug={slug}
      title={paper.title}
      paragraphsTotal={countParagraphs(paper)}
      sectionOf={sectionOf}
      questionPrompts={Object.fromEntries(
        [...paper.check, ...paper.judge].map(
          (q) => [q.id, q.prompt],
        ),
      )}
    />
  );
}
