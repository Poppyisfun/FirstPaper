import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllPaperSlugs, getPaper } from "@/lib/content";

/** Prerender this phase for every paper that exists. */
export function generateStaticParams() {
  return getAllPaperSlugs().map((slug) => ({ slug }));
}

export const dynamicParams = false;

/**
 * The whole paper in plain English.
 *
 * Deliberately plain, and deliberately a server component: there is nothing to
 * interact with. The reader has just finished judging and is about to be told
 * how well they judged, so this screen is a breath, not a feature.
 *
 * Serif at the reading measure, because this is the paper being retold rather
 * than FirstPaper commenting on it. That it is our wording is said plainly at
 * the foot rather than signalled by switching typeface mid-flow.
 */
export default async function RecapPage({
  params,
}: PageProps<"/paper/[slug]/recap">) {
  const { slug } = await params;
  const paper = getPaper(slug);
  if (!paper) notFound();

  const paragraphs = paper.meta.plainSummary
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="ph ph-recap">
      <header className="ph-head">
        <span className="ph-kick">Recap</span>
      </header>

      <main className="rc">
        <h1 className="rc-t">The whole paper, in plain English</h1>

        {paragraphs.map((text, i) => (
          <p key={i} className="rc-p">
            {text}
          </p>
        ))}

        <div className="ph-acts">
          <Link className="ph-go" href={`/paper/${slug}/results`}>
            See how you did →
          </Link>
        </div>

        <p className="ph-honest">
          <b>FirstPaper can be wrong, and that&rsquo;s the point.</b> This
          summary is ours, not the authors&rsquo;.{" "}
          <a
            href={`https://europepmc.org/article/PMC/${paper.source.pmcid}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Read the original
          </a>{" "}
          and check us.
        </p>
      </main>
    </div>
  );
}
