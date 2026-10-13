import { getAllPaperSlugs, getPaper } from "@/lib/content";
import { ogCard, OG_SIZE, OG_TYPE } from "@/lib/og";

export const alt = "A paper on FirstPaper";
export const size = OG_SIZE;
export const contentType = OG_TYPE;

/** One card per paper, built with the pages. */
export function generateStaticParams() {
  return getAllPaperSlugs().map((slug) => ({ slug }));
}

export const dynamicParams = false;

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const paper = getPaper(slug);
  if (!paper) {
    return ogCard({ kicker: "FirstPaper", title: "Read real science." });
  }

  return ogCard({
    kicker: `${paper.journal} · ${paper.year}`,
    title: paper.title,
    sub: paper.practice_goal,
  });
}
