import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllPaperSlugs, getPaper } from "@/lib/content";
import { paperMetadata } from "@/lib/metadata";
import Check from "./Check";

/** Prerender this phase for every paper that exists. */
export function generateStaticParams() {
  return getAllPaperSlugs().map((slug) => ({ slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: PageProps<"/paper/[slug]/check">): Promise<Metadata> {
  const { slug } = await params;
  return paperMetadata(slug, "check");
}

/**
 * Server component. It loads the questions and hands them to the client
 * component, which owns progress and nothing else.
 */
export default async function CheckPage({
  params,
}: PageProps<"/paper/[slug]/check">) {
  const { slug } = await params;
  const paper = getPaper(slug);
  if (!paper) notFound();

  return <Check slug={slug} questions={paper.questions.comprehension} />;
}
