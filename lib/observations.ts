import type { Paper } from "@/lib/types";

/**
 * A phrase the paper's authors' text carries inside <mark class="t">, surfaced
 * once the reader has resolved the paragraph around it.
 *
 * These are read out of `para.t` and never written back. Stripping the inner
 * tags is display-only: the paragraph itself always renders verbatim.
 */
export type Observation = {
  /** "sectionIdx-paraIdx", the same key the solo/peek sets use. */
  key: string;
  sec: number;
  para: number;
  sectionName: string;
  phrase: string;
};

const MARK = /<mark[^>]*>([\s\S]*?)<\/mark>/g;
const TAGS = /<[^>]+>/g;

/** Decodes the few entities the paper text actually uses. */
function plain(html: string): string {
  return html
    .replace(TAGS, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Every marked phrase in the paper, in reading order. Computed once per paper
 * and then filtered by what the reader has resolved.
 */
export function allObservations(paper: Paper): Observation[] {
  const out: Observation[] = [];

  paper.sections.forEach((section, sec) => {
    section.paras.forEach((para, p) => {
      for (const m of para.t.matchAll(MARK)) {
        out.push({
          key: `${sec}-${p}`,
          sec,
          para: p,
          sectionName: section.n,
          phrase: plain(m[1]),
        });
      }
    });
  });

  return out;
}

/** The ones the reader has earned by resolving the paragraph they sit in. */
export function collectedObservations(
  all: Observation[],
  resolved: (key: string) => boolean,
): Observation[] {
  return all.filter((o) => resolved(o.key));
}
