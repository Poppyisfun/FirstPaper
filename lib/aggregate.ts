/**
 * The class view: one paper, everyone who has read it, together.
 *
 * An instructor who assigns a paper wants to know where the room divided, not
 * who got what. There is no student identity anywhere in the system and this
 * module does not add one: a reader is a session id, which is a random uuid
 * per browser per paper, and nothing below ever emits a per-session row.
 *
 * One cached query over the events table, then pure arithmetic. Every line
 * the page shows is computed from at least MIN_READERS readers or is replaced
 * by a sentence saying why it isn't there. That is the same rule as the
 * results screen's gates: a split across three people is three people, not a
 * pattern, and a number that can't support itself doesn't get published.
 */

import { unstable_cache } from "next/cache";
import type { LoadedPaper, Question } from "@/lib/content-types";
import { chanceBaseline } from "@/lib/stats";
import { createSupabaseServerClient } from "@/lib/supabase";

/** Fewer readers than this behind a line, and the line is suppressed. */
export const MIN_READERS = 5;

/** The event types this page reads. Everything else stays in the database. */
export const CLASS_EVENT_TYPES = [
  "paper_started",
  "paper_completed",
  "prediction_made",
  "check_answered",
  "judge_answered",
] as const;

/** One row of `events`, as much of it as the class view needs. */
export type ClassRow = {
  session_id: string;
  type: string;
  paragraph_id: string | null;
  question_id: string | null;
  payload: Record<string, unknown> | null;
  created_at: string;
};

/** A line that may or may not have enough readers behind it. */
export type Gated<T> =
  | { shown: true; readers: number; value: T }
  | { shown: false; readers: number };

export type OptionSplit = {
  optionId: string;
  text: string;
  correct: boolean;
  count: number;
  /** 0-100, of the readers who answered this question. */
  share: number;
};

export type QuestionSplit = {
  questionId: string;
  prompt: string;
  tag: string | null;
  paragraphIds: string[];
  /** 0-100, from this question's real option count. */
  guessing: number;
  split: Gated<{
    options: OptionSplit[];
    /** 0-100, the share choosing the most popular option. */
    plurality: number;
  }>;
};

export type ParagraphMiss = {
  paragraphId: string;
  readers: number;
  missed: number;
  /** 0-100. */
  missRate: number;
};

export type ClassView = {
  started: number;
  reachedResults: number;
  judge: QuestionSplit[];
  check: QuestionSplit[];
  /** The judge question with the most even split, among those shown. Null if none is. */
  dividedHardest: QuestionSplit | null;
  /** Paragraphs with at least MIN_READERS first guesses, most-missed first. */
  paragraphMisses: ParagraphMiss[];
  /** How many paragraphs were left out for having too few guesses. */
  paragraphsSuppressed: number;
  confidence: Gated<{ meanConfidence: number; accuracy: number; guessing: number }>;
};

function payloadOf(row: ClassRow): Record<string, unknown> {
  return row.payload ?? {};
}

/**
 * First row per session per key, in time order. A reader who goes through a
 * paper twice answers the second time knowing the answers; the first is the
 * one that says how the paper read.
 */
function firstPer(
  rows: ClassRow[],
  type: string,
  keyOf: (row: ClassRow) => string | null,
): Map<string, Map<string, ClassRow>> {
  const byKey = new Map<string, Map<string, ClassRow>>();
  for (const row of rows) {
    if (row.type !== type) continue;
    const key = keyOf(row);
    if (!key) continue;
    const bySession = byKey.get(key) ?? new Map<string, ClassRow>();
    if (!bySession.has(row.session_id)) bySession.set(row.session_id, row);
    byKey.set(key, bySession);
  }
  return byKey;
}

function splitFor(
  question: Question,
  answers: Map<string, ClassRow> | undefined,
): QuestionSplit {
  const readers = answers?.size ?? 0;
  const base = {
    questionId: question.id,
    prompt: question.prompt,
    tag: question.tag ?? null,
    paragraphIds: question.paragraphIds,
    guessing: question.options.length > 0 ? 100 * chanceBaseline(question.options.length) : 0,
  };
  if (!answers || readers < MIN_READERS) {
    return { ...base, split: { shown: false, readers } };
  }

  const counts = new Map<string, number>();
  for (const row of answers.values()) {
    const chosen = String(payloadOf(row).chosen_option_id ?? "");
    counts.set(chosen, (counts.get(chosen) ?? 0) + 1);
  }
  /* Options in the paper's order rather than by popularity, so the correct
     answer is not given away by position and the bars read the same way on
     every question. */
  const options: OptionSplit[] = question.options.map((o) => {
    const count = counts.get(o.id) ?? 0;
    return {
      optionId: o.id,
      text: o.text,
      correct: o.id === question.correctOptionId,
      count,
      share: (100 * count) / readers,
    };
  });
  const plurality = Math.max(...options.map((o) => o.share));
  return { ...base, split: { shown: true, readers, value: { options, plurality } } };
}

/** Shannon entropy of a split, for breaking ties between equally-divided questions. */
function entropy(options: OptionSplit[]): number {
  return -options
    .filter((o) => o.share > 0)
    .reduce((sum, o) => sum + (o.share / 100) * Math.log(o.share / 100), 0);
}

/**
 * Everything the class view shows, from the rows of one paper.
 *
 * Pure: the same rows give the same page, and the tests drive it directly.
 */
export function aggregate(rows: ClassRow[], paper: LoadedPaper): ClassView {
  const sorted = [...rows].sort((a, b) => a.created_at.localeCompare(b.created_at));

  const started = new Set(sorted.map((r) => r.session_id)).size;
  const reachedResults = new Set(
    sorted.filter((r) => r.type === "paper_completed").map((r) => r.session_id),
  ).size;

  const judgeAnswers = firstPer(sorted, "judge_answered", (r) => r.question_id);
  const checkAnswers = firstPer(sorted, "check_answered", (r) => r.question_id);

  const judge = paper.questions.appraisal.map((q) => splitFor(q, judgeAnswers.get(q.id)));
  const check = paper.questions.comprehension.map((q) => splitFor(q, checkAnswers.get(q.id)));

  /* Where the room divided: the lowest plurality, i.e. no answer won by much.
     Ties go to the more even spread across all options. */
  const dividedHardest =
    judge
      .filter((q) => q.split.shown)
      .sort((a, b) => {
        if (!a.split.shown || !b.split.shown) return 0;
        return (
          a.split.value.plurality - b.split.value.plurality ||
          entropy(b.split.value.options) - entropy(a.split.value.options)
        );
      })[0] ?? null;

  /* Paragraphs where first guesses most often missed. */
  const order = new Map<string, number>();
  paper.source.sections
    .flatMap((s) => s.paragraphs)
    .forEach((p, i) => order.set(p.id, i));

  const predictions = firstPer(sorted, "prediction_made", (r) => r.paragraph_id);
  let paragraphsSuppressed = 0;
  const paragraphMisses: ParagraphMiss[] = [];
  for (const [paragraphId, bySession] of predictions) {
    if (!order.has(paragraphId)) continue;
    if (bySession.size < MIN_READERS) {
      paragraphsSuppressed += 1;
      continue;
    }
    const missed = [...bySession.values()].filter(
      (r) => payloadOf(r).correct !== true,
    ).length;
    paragraphMisses.push({
      paragraphId,
      readers: bySession.size,
      missed,
      missRate: (100 * missed) / bySession.size,
    });
  }
  paragraphMisses.sort(
    (a, b) =>
      b.missRate - a.missRate ||
      (order.get(a.paragraphId) ?? 0) - (order.get(b.paragraphId) ?? 0),
  );

  /* The group's stated confidence against its accuracy, over every first
     judge answer that carried a confidence. Gated on readers, not answers:
     five answers from one person is one person. */
  const optionsOf = new Map(paper.questions.appraisal.map((q) => [q.id, q.options.length]));
  const confident = [...judgeAnswers.values()]
    .flatMap((bySession) => [...bySession.values()])
    .filter(
      (r) =>
        typeof payloadOf(r).confidence === "number" &&
        (optionsOf.get(r.question_id ?? "") ?? 0) > 0,
    );
  const confidenceReaders = new Set(confident.map((r) => r.session_id)).size;
  const confidence: ClassView["confidence"] =
    confidenceReaders < MIN_READERS
      ? { shown: false, readers: confidenceReaders }
      : {
          shown: true,
          readers: confidenceReaders,
          value: {
            meanConfidence:
              confident.reduce((s, r) => s + Number(payloadOf(r).confidence), 0) /
              confident.length,
            accuracy:
              (100 * confident.filter((r) => payloadOf(r).correct === true).length) /
              confident.length,
            guessing:
              confident.reduce(
                (s, r) => s + 100 * chanceBaseline(optionsOf.get(r.question_id ?? "") ?? 1),
                0,
              ) / confident.length,
          },
        };

  return {
    started,
    reachedResults,
    judge,
    check,
    dividedHardest,
    paragraphMisses,
    paragraphsSuppressed,
    confidence,
  };
}

/** Supabase returns at most this many rows per request; the query pages. */
const PAGE = 1000;

/**
 * The one query: every class-relevant event for one paper, joined to its
 * session only to filter by paper. Server only, secret key, like every other
 * read in this app.
 *
 * Cached for five minutes. An instructor refreshing during a lesson should
 * not hit the database each time, and a five-minute-old split is as true as
 * a live one for a discussion.
 *
 * Throws on failure; the caller decides what the page says about it.
 */
const fetchClassRows = unstable_cache(
  async (slug: string): Promise<ClassRow[]> => {
    const db = createSupabaseServerClient();
    const rows: ClassRow[] = [];
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await db
        .from("events")
        .select(
          "session_id, type, paragraph_id, question_id, payload, created_at, sessions!inner(paper_slug)",
        )
        .eq("sessions.paper_slug", slug)
        .in("type", [...CLASS_EVENT_TYPES])
        .order("created_at", { ascending: true })
        .range(from, from + PAGE - 1);
      if (error) throw new Error(`class view query failed: ${error.message}`);
      for (const row of data ?? []) {
        rows.push({
          session_id: row.session_id as string,
          type: row.type as string,
          paragraph_id: (row.paragraph_id as string | null) ?? null,
          question_id: (row.question_id as string | null) ?? null,
          payload: (row.payload as Record<string, unknown> | null) ?? null,
          created_at: row.created_at as string,
        });
      }
      if (!data || data.length < PAGE) break;
    }
    return rows;
  },
  ["class-rows"],
  { revalidate: 300, tags: ["class-rows"] },
);

/**
 * The class view for one paper, or null when the data can't be read
 * (missing keys, an outage). Null is not zero readers, and the page says so.
 */
export async function getClassView(paper: LoadedPaper): Promise<ClassView | null> {
  try {
    return aggregate(await fetchClassRows(paper.meta.slug), paper);
  } catch {
    return null;
  }
}
