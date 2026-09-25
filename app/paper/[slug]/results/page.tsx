import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import { getAllPaperSlugs, getPaper } from "@/lib/content";

/** Prerender this phase for every paper that exists. */
export function generateStaticParams() {
  return getAllPaperSlugs().map((slug) => ({ slug }));
}

export const dynamicParams = false;

/** PLACEHOLDER. Phase 3 builds this. */
export default async function ResultsPage({
  params,
}: PageProps<"/paper/[slug]/results">) {
  const { slug } = await params;
  const paper = getPaper(slug);
  if (!paper) notFound();

  return (
    <>
      <Nav active="library" />
      <main className="wrap">
        <div className="sect" style={{ paddingTop: 28 }}>
          <div className="skick">Results</div>
          <h1 className="stitle">{paper.meta.title}</h1>
        </div>
      </main>
    </>
  );
}
