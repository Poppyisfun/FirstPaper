import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllPaperSlugs, getPaper } from "@/lib/content";
import { paperMetadata } from "@/lib/metadata";

/** Prerender this phase for every paper that exists. */
export function generateStaticParams() {
  return getAllPaperSlugs().map((slug) => ({ slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: PageProps<"/paper/[slug]/recap">): Promise<Metadata> {
  const { slug } = await params;
  return paperMetadata(slug, "recap");
}

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

  /* The abstract, shown a second time. Being able to read it now, after
     seventeen paragraphs of working through the paper, is the most direct
     evidence the reader has that any of this landed. It costs nothing to
     put here and nothing else on the screen demonstrates the point as
     plainly. */
  const abstract = paper.paragraphs.find((p) => p.imrad === "abstract");

  const paragraphs = paper.recap
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="ph ph-recap">
      <header className="ph-head">
        <span className="ph-kick">Recap</span>
      </header>

      <main className="rc">
        {abstract && (
          <section className="rc-then" aria-label="The abstract, again">
            <span className="rc-then-k">This is where you started</span>
            <p
              className="rc-then-t"
              dangerouslySetInnerHTML={{ __html: abstract.source_text }}
            />
            <p className="rc-then-n">
              You were told not to expect to follow this. Read it again now.
            </p>
          </section>
        )}

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
            href={`https://europepmc.org/article/PMC/${paper.pmcid}`}
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
