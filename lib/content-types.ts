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
  | "abstract"
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
  /** Path under public/, or null when no image could be retrieved. */
  href?: string | null;
  /** Paragraph ids whose text cites this figure by name. */
  referenced_by?: string[];
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
  /** The whole paper in plain English, paragraphs separated by blank lines. */
  plainSummary: string;
};

/**
 * Our commentary for one paragraph, one entry per reading level.
 *
 * `caution` is optional and belongs to the paragraph rather than the level: a
 * claim that outruns its evidence does so whoever is reading. It is absent on
 * most paragraphs by design. A warning on every paragraph is a warning on
 * none, so the renderer shows this block only where the content carries one.
 */
export type Explanation = {
  explorer: string;
  reader: string;
  critic: string;
  caution?: string;
};

/** explanations.json, keyed by paragraph id. */
export type Explanations = Record<string, Explanation>;

/** One option in the commitment shown before an explanation. */
export type PredictionOption = {
  id: string;
  text: string;
};

/**
 * What the reader commits to before our explanation appears.
 *
 * Generated from the authors' paragraph alone, never from our explanation:
 * options written from our own commentary would reward recognising our voice
 * rather than reading the paper.
 */
export type PredictionSet = {
  options: PredictionOption[];
  correctOptionId: string;
  /**
   * Overrides the default "what do you think this paragraph says?".
   *
   * The abstract gets a different question, because it is the only paragraph
   * that is already a summary of everything else and asking a reader to
   * predict a summary is a strange thing to do.
   */
  prompt?: string;
};

/** predictions.json, keyed by paragraph id. */
export type Predictions = Record<string, PredictionSet>;

export type QuestionOption = {
  id: string;
  text: string;
};

/**
 * One question in the check or judge round.
 *
 * `tag` is present on appraisal questions only. It names the critical-reading
 * criterion the question tests, and the results screen uses it to say which
 * kind of judgement a reader is missing rather than only how many.
 */
export type Question = {
  id: string;
  prompt: string;
  options: QuestionOption[];
  correctOptionId: string;
  /** One or two sentences shown after answering. */
  why: string;
  /** Paragraphs the answer rests on. */
  paragraphIds: string[];
  tag?: string;
};

/** questions.json: the two rounds. */
export type PaperQuestions = {
  comprehension: Question[];
  appraisal: Question[];
};

/** One paper as the app sees it: its three files, loaded together. */
export type LoadedPaper = {
  meta: PaperMeta;
  source: PaperSource;
  explanations: Explanations;
  predictions: Predictions;
  questions: PaperQuestions;
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
