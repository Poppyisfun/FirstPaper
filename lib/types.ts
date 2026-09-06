/**
 * Shape of a FirstPaper paper file.
 *
 * Two tiers of content live in here and they are governed differently — see
 * "Paper content rules" in CLAUDE.md. In short: `t`, `h`, `cap` and `meta` are
 * the authors' published words under CC-BY and are never edited. Everything
 * else (`n`, `x`, quiz, judge, `plain`) is FirstPaper's teaching copy and is
 * edited only on request.
 *
 * Papers are data, not code: adding one means adding a file and listing it in
 * content/papers/index.ts, with no component changes. Keep this type open
 * enough that a new paper never forces an edit here.
 */

/** Reading tier. Changes only the note shown, never the paper text. */
export type Tier = "e" | "r" | "c";

/**
 * The same paragraph explained at three levels.
 * e = explorer (curious middle schooler), r = reader (AP level),
 * c = critic (early undergraduate, methodological subtext made explicit).
 */
export type TierNotes = Record<Tier, string>;

/** Publication details. LOCKED — reproduced verbatim under CC-BY. */
export type PaperMeta = {
  title: string;
  authors: string;
  /** Human-readable citation, e.g. "eLife 2013;2:e01222". */
  cite: string;
  /** Canonical link to the original, normally a DOI. */
  url: string;
  licence: string;
};

export type Para = {
  /** LOCKED. The authors' text. May contain <i>, <sub>, <sup> and <mark>. */
  t: string;
  /** LOCKED. Subheading introducing this paragraph, when the paper has one. */
  h?: string;
  /** EDITABLE. The plain-language note, one per reading tier. */
  n: TierNotes;
};

export type Figure = {
  /** Figure number as printed in the paper. */
  n: number;
  /** Path under /public, e.g. "/figures/fig1.jpg". */
  src: string;
  /** LOCKED. The authors' caption. Contains HTML. */
  cap: string;
  /** EDITABLE. FirstPaper's "how to read it" explainer. Contains HTML. */
  x: string;
};

export type Section = {
  /** Section name, e.g. "Abstract" or "Results — the rate". */
  n: string;
  paras: Para[];
  figs: Figure[];
};

/** One answer option. `c` is 1 for the correct option, 0 otherwise. */
export type Option = {
  t: string;
  c: 0 | 1;
  /** EDITABLE. Feedback shown once this option is chosen. */
  f: string;
};

/** EDITABLE. Comprehension question — did the reading land? */
export type QuizQuestion = {
  q: string;
  o: Option[];
};

/**
 * The judging skill a question drills. Listed values are the current taxonomy;
 * the type stays open so a new paper can introduce a mode without a code change.
 */
export type JudgeMode =
  | "calibrate-verb"
  | "spot-control"
  | "find-limitation"
  | "sample-size"
  | "weigh-source"
  | (string & {});

/** EDITABLE. Evaluation question — does the paper hold up? */
export type JudgeQuestion = {
  mode: JudgeMode;
  /** Badge key awarded for this question; matches a `Badge.k`. */
  bk: string;
  q: string;
  /** "Think about" prompt shown before the options. */
  th: string;
  o: Option[];
  /** The transferable takeaway, shown after answering. */
  tk: string;
};

export type Badge = {
  /** Key referenced by `JudgeQuestion.bk`. */
  k: string;
  /** Emoji icon. */
  ic: string;
  nm: string;
  ds: string;
};

export type Paper = {
  /** URL segment: /paper/[slug]. Must be unique across content/papers. */
  slug: string;
  meta: PaperMeta;
  sections: Section[];
  quiz: QuizQuestion[];
  judge: JudgeQuestion[];
  /** EDITABLE. The whole paper in plain English. Contains HTML. */
  plain: string;
  badges: Badge[];
};
