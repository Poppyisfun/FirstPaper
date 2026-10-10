import { notFound } from "next/navigation";
import { getAllPaperSlugs, getPaper } from "@/lib/content";
import Judge from "./Judge";

/** Prerender this phase for every paper that exists. */
export function generateStaticParams() {
  return getAllPaperSlugs().map((slug) => ({ slug }));
}

export const dynamicParams = false;

/**
 * Server component. It loads the questions and hands them to the client
 * component, which owns progress and nothing else.
 */
export default async function JudgePage({
  params,
}: PageProps<"/paper/[slug]/judge">) {
  const { slug } = await params;
  const paper = getPaper(slug);
  if (!paper) notFound();

  return <Judge slug={slug} questions={paper.judge} />;
}
