import { z } from "zod";

/**
 * THE CONTENT SCHEMA. Frozen.
 *
 * One JSON file per paper, one type, validated at build time. Every field the
 * roadmap needs is here now, with the unused ones nullable, because adding a
 * field later means revisiting every paper already authored while adding a
 * nullable field today costs one line.
 *
 * Two file types exist and only two: `Paper` and `ClaimCheck`. They share the
 * tag enum below.
 *
 * ─────────────────────────────────────────────────────────────────────────
 *  THE TAG ENUM IS SEVEN STRINGS. DO NOT ADD AN EIGHTH.
 *
 *  Per-tag calibration is the product. A tag introduced after papers are
 *  authored makes every earlier record partly incomparable — a reader's
 *  "confounding: 4 of 6" cannot be compared against papers written before
 *  the tag existed, and the record is the thing we are selling.
 *
 *  All seven exist from day one even where a given paper uses three.
 * ─────────────────────────────────────────────────────────────────────────
 */
export const TAGS = [
  /** The authors declined to settle something, and said so in their verbs. */
  "hedging",
  /** What the study actually established, against what it gestures at. */
  "scope",
  /** How far a result reaches beyond what was tested. */
  "generalisation",
  /** Reading a result against a baseline or a rival method. */
  "comparison",
  /** What a percentage is a fraction of. */
  "denominator",
  /** Something else could explain the result. */
  "confounding",
  /**
   * A demonstration that a thing can happen, against evidence of how well or
   * how often it does. Not a curriculum label: it is what the Jinek paper is
   * about, and without it our best paper contributes nothing to a per-tag
   * record.
   */
  "demonstration",
] as const;

export const TagSchema = z.enum(TAGS);
export type Tag = z.infer<typeof TagSchema>;

/** Licences we are willing to reproduce text under. Nothing else may ship. */
export const LICENCES = ["CC-BY", "CC-BY-4.0", "CC0"] as const;
export const LicenceSchema = z.enum(LICENCES);
export type Licence = z.infer<typeof LicenceSchema>;

/** A paper's own difficulty. Not a reader setting: that was removed. */
export const DifficultySchema = z.enum(["explorer", "reader", "critic"]);
export type Difficulty = z.infer<typeof DifficultySchema>;

/** Where a section sits in the IMRaD structure. */
export const ImradSchema = z.enum([
  "abstract",
  "introduction",
  "methods",
  "results",
  "discussion",
  "limitations",
  "other",
]);
export type Imrad = z.infer<typeof ImradSchema>;

const OptionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
});

/**
 * The commitment shown before an explanation.
 *
 * Exactly three options, and `correct` must name one of them. Generated from
 * the authors' paragraph alone, never from our commentary: options written
 * from our own explanation reward recognising our voice instead of reading
 * the paper.
 */
export const PredictionSchema = z
  .object({
    prompt: z.string().min(1),
    options: z.array(OptionSchema).length(3),
    correct: z.string().min(1),
  })
  .refine((p) => p.options.some((o) => o.id === p.correct), {
    message: "prediction.correct must match one of its option ids",
    path: ["correct"],
  });

export const ParagraphSchema = z.object({
  id: z.string().min(1),
  /** The section heading as the authors wrote it, or null if untitled. */
  section: z.string().nullable(),
  imrad: ImradSchema,
  /** The authors' words, verbatim. Never edited. */
  source_text: z.string().min(1),
  /** Ours. 60-75% of source_text's word count; the ratio is CI-enforced. */
  explanation: z.string().min(1),
  /** Where a claim outruns its evidence. Rare by design. */
  caution: z.string().nullable(),
  prediction: PredictionSchema,
});

/** A question in either round. Four options; judge questions carry a tag. */
const QuestionSchema = z
  .object({
    id: z.string().min(1),
    prompt: z.string().min(1),
    options: z.array(OptionSchema).length(4),
    correct: z.string().min(1),
    feedback: z.string().min(1),
    /**
     * Paragraphs the answer rests on.
     *
     * Nullable, and empty is legitimate — a question about the paper as a
     * whole rests on no single paragraph. The class view quotes these when
     * it surfaces the question a class divided hardest on, which is what
     * turns that page from a chart into a lesson plan.
     */
    paragraph_ids: z.array(z.string()).nullable().default([]),
  })
  .refine((q) => q.options.some((o) => o.id === q.correct), {
    message: "question.correct must match one of its option ids",
    path: ["correct"],
  });

export const CheckQuestionSchema = QuestionSchema;
export const JudgeQuestionSchema = z
  .object({
    id: z.string().min(1),
    prompt: z.string().min(1),
    options: z.array(OptionSchema).length(4),
    correct: z.string().min(1),
    feedback: z.string().min(1),
    /**
     * Paragraphs the answer rests on.
     *
     * Nullable, and empty is legitimate — a question about the paper as a
     * whole rests on no single paragraph. The class view quotes these when
     * it surfaces the question a class divided hardest on, which is what
     * turns that page from a chart into a lesson plan.
     */
    paragraph_ids: z.array(z.string()).nullable().default([]),
    tag: TagSchema,
  })
  .refine((q) => q.options.some((o) => o.id === q.correct), {
    message: "question.correct must match one of its option ids",
    path: ["correct"],
  });

export const FigureSchema = z.object({
  id: z.string().min(1),
  /* Also not on the original list: the authors' own label ("Figure 1."),
     which the thumbnail and the full-size view both name. Dropping it would
     discard authored data and leave the UI inventing its own numbering. */
  label: z.string().nullable(),
  /** Path under public/, or null when no image could be retrieved. */
  src: z.string().nullable(),
  caption: z.string().nullable(),
  /** Who the figure belongs to and under what terms. */
  attribution: z.string().nullable(),
  /** Paragraph ids whose text cites this figure by name. */
  referenced_by: z.array(z.string()),
});

/**
 * A model-written summary with deliberate errors planted in it.
 *
 * Nullable and unused today. It is here so that "Spot the AI's mistake" can
 * be authored into existing papers later without a migration.
 */
export const AiSummarySchema = z.object({
  text: z.string().min(1),
  errors: z
    .array(
      z.object({
        /** The exact substring of `text` that is wrong. */
        span: z.string().min(1),
        tag: TagSchema,
        why: z.string().min(1),
      }),
    )
    .length(3),
});

export const PaperSchema = z.object({
  /* ── Bibliography ─────────────────────────────────────────────────── */
  slug: z.string().min(1),
  doi: z.string().nullable(),
  pmcid: z.string().min(1),
  licence: LicenceSchema,
  licence_url: z.string().url(),
  citation_count: z.number().int().nonnegative().nullable(),
  title: z.string().min(1),
  authors: z.string().min(1),
  year: z.number().int(),
  /* Not on the original field list, added deliberately: the licence
     attribution line has to name where the work was published, and it
     renders on every paragraph. */
  journal: z.string().min(1),
  original_url: z.string().url(),

  /* ── Shelving ─────────────────────────────────────────────────────── */
  difficulty: DifficultySchema,
  /** One short phrase for the library card, or null. */
  headline_tag: z.string().nullable(),
  estimated_minutes: z.number().int().positive(),
  practice_goal: z.string().min(1),

  /* ── The paper itself ─────────────────────────────────────────────── */
  paragraphs: z.array(ParagraphSchema).min(1),
  check: z.array(CheckQuestionSchema).length(5),
  judge: z.array(JudgeQuestionSchema).length(5),
  recap: z.string().min(1),
  ai_summary: AiSummarySchema.nullable(),
  figures: z.array(FigureSchema),
});

export type Paper = z.infer<typeof PaperSchema>;
export type Paragraph = z.infer<typeof ParagraphSchema>;
export type CheckQuestion = z.infer<typeof CheckQuestionSchema>;
export type JudgeQuestion = z.infer<typeof JudgeQuestionSchema>;
export type Figure = z.infer<typeof FigureSchema>;
export type Prediction = z.infer<typeof PredictionSchema>;

/**
 * A Claim Check: one misreported headline against what the paper said.
 *
 * Smaller and separate from a Paper, sharing the tag enum so a reader's
 * per-tag record spans both. Not built yet; the shape is frozen now so the
 * first one authored does not force a migration.
 */
export const ClaimCheckSchema = z
  .object({
    id: z.string().min(1),
    /** ISO date. One goes live per day. */
    publish_at: z.string().min(1),
    /** The claim as a headline put it. */
    headline_sentence: z.string().min(1),
    source_url: z.string().url(),
    pmcid: z.string().min(1),
    /** What the paper's own abstract said. */
    abstract_sentence: z.string().min(1),
    options: z.array(OptionSchema).length(4),
    correct: z.string().min(1),
    tag: TagSchema,
    feedback: z.string().min(1),
  })
  .refine((c) => c.options.some((o) => o.id === c.correct), {
    message: "claim.correct must match one of its option ids",
    path: ["correct"],
  });

export type ClaimCheck = z.infer<typeof ClaimCheckSchema>;

/**
 * Parses a paper, throwing with the field path when it does not fit.
 *
 * Called at module load so a malformed file fails the build rather than a
 * request. The message names the file because by the time there are twenty
 * papers "expected 5, received 4" is not enough to act on.
 */
export function parsePaper(raw: unknown, source: string): Paper {
  const result = PaperSchema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new Error(`${source} does not fit the paper schema:\n${issues}`);
  }
  return result.data;
}

export function parseClaimCheck(raw: unknown, source: string): ClaimCheck {
  const result = ClaimCheckSchema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new Error(`${source} does not fit the claim schema:\n${issues}`);
  }
  return result.data;
}
