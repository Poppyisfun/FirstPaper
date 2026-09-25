import Nav from "@/components/Nav";
import { getAllPaperSlugs, getPaper } from "@/lib/content";
import { notFound } from "next/navigation";

/** Prerender the phase for every built paper. */
export function generateStaticParams() {
  return getAllPaperSlugs().map((slug) => ({ slug }));
}

export const dynamicParams = false;

/**
 * PLACEHOLDER. The working experience currently lives at /paper/[slug], which
 * drives all six phases from one client-side state machine. This route is the
 * scaffolding for splitting that flow across URLs; it is not built yet.
 */
export default async function CheckPage({ params }: PageProps<"/paper/[slug]/check">) {
  const { slug } = await params;
  const paper = getPaper(slug);
  if (!paper) notFound();

  return (
    <>
      <Nav active="library" />
      <main className="wrap">
        <div className="sect" style={{ paddingTop: 28 }}>
          <div className="skick">Check</div>
          <h1 className="stitle">Check</h1>
          <p className="ssub">{paper.meta.title}</p>
        </div>
      </main>
    </>
  );
}
