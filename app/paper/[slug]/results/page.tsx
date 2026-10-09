import { notFound } from "next/navigation";
import { countParagraphs, getAllPaperSlugs, getPaper } from "@/lib/content";
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

  return (
    <Results
      slug={slug}
      title={paper.meta.title}
      paragraphsTotal={countParagraphs(paper)}
    />
  );
}
