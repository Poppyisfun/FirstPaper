/**
 * The shape of the JSON under content/papers/<slug>/.
 *
 * Three files per paper, governed differently:
 *
 *   source.json        the authors' published work. LOCKED.
 *   meta.json          bibliography (locked) plus our shelving fields
 *   explanations.json  FirstPaper's commentary, keyed by paragraph id
 *
 * Explanations are keyed by the ids in source.json. If those stop lining up,
 * commentary silently attaches to the wrong paragraph, which is why the
 * content check verifies them.
 */

/** Where a section sits in the IMRaD structure of a paper. */
export type ImradTag =
  | "introduction"
  | "methods"
  | "results"
  | "discussion"
  | "limitations"
  | "other";

/** The three reading levels. Changes the commentary, never the paper text. */
export type Level = "explorer" | "reader" | "critic";

/** One paragraph of the authors' text. `id` is "<pmcid>-s<sec>-p<para>". */
export type Paragraph = {
  id: string;
  text: string;
};

export type Section = {
  index: number;
  heading: string | null;
  imrad: ImradTag;
  paragraphs: Paragraph[];
};

export type Figure = {
  id: string | null;
  label: string | null;
  caption: string | null;
};

/** source.json. Every field here is the authors' work and is never edited. */
export type PaperSource = {
  slug: string;
  pmcid: string;
  title: string | null;
  sections: Section[];
  figures: Figure[];
};

/**
 * meta.json. The bibliographic fields are locked; level, minutes, xp and
 * practiceGoal are ours, because a paper file describes a paper, not how it is
 * shelved.
 */
export type PaperMeta = {
  slug: string;
  title: string;
  authors: string;
  year: number;
  journal: string;
  licence: string;
  licenceUrl: string | null;
  originalUrl: string;
  level: string;
  minutes: number;
  xp: number;
  /** One line, in the style of "You'll practise: telling X from Y". */
  practiceGoal: string;
};

/** Our commentary for one paragraph, one entry per reading level. */
export type Explanation = {
  explorer: string;
  reader: string;
  critic: string;
};

/** explanations.json, keyed by paragraph id. */
export type Explanations = Record<string, Explanation>;

/** One paper as the app sees it: its three files, loaded together. */
export type LoadedPaper = {
  meta: PaperMeta;
  source: PaperSource;
  explanations: Explanations;
};

/** A paragraph plus the context needed to render or link to it. */
export type ParagraphHit = {
  id: string;
  sectionIndex: number;
  paragraphIndex: number;
  sectionHeading: string | null;
  imrad: ImradTag;
  paragraph: Paragraph;
  explanation: Explanation | null;
};
