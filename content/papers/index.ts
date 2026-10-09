import crisprMeta from "./crispr-human-cells/meta.json";
import crisprSource from "./crispr-human-cells/source.json";
import crisprExplanations from "./crispr-human-cells/explanations.json";
import crisprPredictions from "./crispr-human-cells/predictions.json";
import crisprQuestions from "./crispr-human-cells/questions.json";
import type {
  Explanations,
  ImradTag,
  PaperQuestions,
  Predictions,
  Question,
  LoadedPaper,
  PaperMeta,
  PaperSource,
} from "@/lib/content-types";

/**
 * The paper registry.
 *
 * Adding a paper means adding a folder under content/papers and three lines
 * here. The JSON is imported rather than read at runtime, so it is bundled and
 * type-checked at build time, and a malformed file fails the build instead of
 * a request.
 */

const IMRAD: readonly ImradTag[] = [
  "abstract",
  "introduction",
  "methods",
  "results",
  "discussion",
  "limitations",
  "other",
];

/** Narrows the stored string, defaulting to "other" rather than throwing. */
function asImrad(value: string): ImradTag {
  return (IMRAD as readonly string[]).includes(value)
    ? (value as ImradTag)
    : "other";
}

/* The normalisers below exist so nothing is cast blindly. Each field is copied
   across explicitly, which means a JSON file that drifts from the shape the app
   expects is a compile error at this boundary rather than a runtime surprise
   somewhere downstream. */

function toSource(raw: typeof crisprSource): PaperSource {
  return {
    slug: raw.slug,
    pmcid: raw.pmcid,
    title: raw.title,
    sections: raw.sections.map((section) => ({
      index: section.index,
      heading: section.heading,
      imrad: asImrad(section.imrad),
      paragraphs: section.paragraphs.map((p) => ({ id: p.id, text: p.text })),
    })),
    figures: raw.figures.map((fig) => ({
      id: fig.id,
      label: fig.label,
      caption: fig.caption,
      href: "href" in fig ? (fig.href as string | null) : null,
      referenced_by:
        "referenced_by" in fig ? (fig.referenced_by as string[]) : [],
    })),
  };
}

function toMeta(raw: typeof crisprMeta): PaperMeta {
  return {
    slug: raw.slug,
    title: raw.title,
    authors: raw.authors,
    year: raw.year,
    journal: raw.journal,
    licence: raw.licence,
    licenceUrl: raw.licence_url,
    originalUrl: raw.original_url,
    level: raw.level,
    minutes: raw.minutes,
    xp: raw.xp,
    practiceGoal: raw.practiceGoal,
    plainSummary: raw.plainSummary,
  };
}

function toExplanations(raw: typeof crisprExplanations): Explanations {
  return Object.fromEntries(
    Object.entries(raw).map(([id, value]) => [
      id,
      {
        explorer: value.explorer,
        reader: value.reader,
        critic: value.critic,
        /* Optional and absent on most paragraphs. Copied through as undefined
           rather than "" so the reader can test for presence, not emptiness. */
        ...("caution" in value && value.caution
          ? { caution: value.caution as string }
          : {}),
      },
    ]),
  );
}

/**
 * predictions.json is keyed by paragraph id like explanations.json, and is
 * copied across field by field for the same reason: a file that drifts from
 * the shape the app expects should fail here rather than silently render
 * nothing three layers down.
 */
function toPredictions(raw: typeof crisprPredictions): Predictions {
  return Object.fromEntries(
    Object.entries(raw.predictions).map(([id, value]) => [
      id,
      {
        options: value.options.map((o) => ({ id: o.id, text: o.text })),
        correctOptionId: value.correct_option_id,
      },
    ]),
  );
}

/** The two question rounds, normalised the same way as everything else. */
function toQuestions(raw: typeof crisprQuestions): PaperQuestions {
  const round = (
    items: (typeof crisprQuestions)["comprehension"],
  ): Question[] =>
    items.map((q) => ({
      id: q.id,
      prompt: q.prompt,
      options: q.options.map((o) => ({ id: o.id, text: o.text })),
      correctOptionId: q.correct_option_id,
      why: q.why,
      paragraphIds: q.paragraph_ids,
      ...("tag" in q && q.tag ? { tag: q.tag as string } : {}),
    }));

  return {
    comprehension: round(raw.comprehension),
    appraisal: round(
      raw.appraisal as unknown as (typeof crisprQuestions)["comprehension"],
    ),
  };
}

/** Every paper the app ships, in library order. */
export const papers: LoadedPaper[] = [
  {
    meta: toMeta(crisprMeta),
    source: toSource(crisprSource),
    explanations: toExplanations(crisprExplanations),
    predictions: toPredictions(crisprPredictions),
    questions: toQuestions(crisprQuestions),
  },
];
