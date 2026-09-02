import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPaper, papers } from "@/content/papers";
import PaperExperience from "./PaperExperience";

/** Prerender every built paper; unknown slugs 404. */
export function generateStaticParams() {
  return papers.map((paper) => ({ slug: paper.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: PageProps<"/paper/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const paper = getPaper(slug);
  if (!paper) return { title: "Paper not found — FirstPaper" };

  return {
    title: `${paper.meta.title} — FirstPaper`,
    description: `Read and judge ${paper.meta.cite}, section by section.`,
  };
}

/**
 * Data loading stays on the server; the whole interactive layer is a client
 * component below this line.
 */
export default async function PaperPage({ params }: PageProps<"/paper/[slug]">) {
  const { slug } = await params;
  const paper = getPaper(slug);
  if (!paper) notFound();

  return <PaperExperience paper={paper} />;
}
