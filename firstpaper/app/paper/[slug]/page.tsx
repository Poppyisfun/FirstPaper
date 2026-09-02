import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import { getPaper, papers } from "@/content/papers";

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

export default async function PaperPage({ params }: PageProps<"/paper/[slug]">) {
  const { slug } = await params;
  const paper = getPaper(slug);
  if (!paper) notFound();

  return (
    <>
      <a className="skip" href="#paper-body">
        Skip to the paper
      </a>
      <Nav active="library" />

      <main className="wrap">
        <article className="pp">
          <header className="pp-head">
            <div className="ab-kick">The paper</div>
            <h1 className="pp-t">{paper.meta.title}</h1>
            <p className="pp-authors">{paper.meta.authors}</p>

            <dl className="pp-meta">
              <div>
                <dt>Published</dt>
                <dd>{paper.meta.cite}</dd>
              </div>
              <div>
                <dt>Original</dt>
                <dd>
                  <a href={paper.meta.url} target="_blank" rel="noopener noreferrer">
                    {paper.meta.url.replace(/^https?:\/\//, "")}
                    <span aria-hidden="true"> ↗</span>
                  </a>
                </dd>
              </div>
            </dl>

            <p className="pp-licence">{paper.meta.licence}</p>
          </header>

          <div id="paper-body">
            {paper.sections.map((section, si) => (
              <section className="pp-sec" key={section.n} aria-labelledby={`sec-${si}`}>
                <h2 className="pp-sn" id={`sec-${si}`}>
                  <span className="pp-sn-i">{String(si + 1).padStart(2, "0")}</span>
                  {section.n}
                </h2>

                {section.paras.map((para, pi) => (
                  <div className="pp-para" key={pi}>
                    {para.h && <h3 className="pp-h">{para.h}</h3>}
                    {/* Paper text carries <i>, <sub>, <sup> and <mark> from the source. */}
                    <p dangerouslySetInnerHTML={{ __html: para.t }} />
                  </div>
                ))}

                {section.figs.map((fig) => (
                  <figure className="pp-fig" key={fig.n}>
                    <Image
                      src={fig.src}
                      alt={`Figure ${fig.n} from ${paper.meta.title}`}
                      width={1400}
                      height={1000}
                      sizes="(max-width: 900px) 100vw, 760px"
                      style={{ width: "100%", height: "auto" }}
                    />
                    <figcaption dangerouslySetInnerHTML={{ __html: fig.cap }} />
                  </figure>
                ))}
              </section>
            ))}
          </div>
        </article>
      </main>
    </>
  );
}
