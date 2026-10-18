import { unstable_cache } from "next/cache";
import {
  getPaper,
  type CheckQuestion,
  type JudgeQuestion,
  type Paper,
} from "@/lib/content";

/* Either round's question. Judge questions carry a tag; check ones do
   not, and the aggregate treats that as the only difference. */
type AnyQuestion = CheckQuestion | JudgeQuestion;
import { createSupabaseServerClient } from "@/lib/supabase";

/**
 * The per-paper aggregate behind /paper/[slug]/class.
 *
 * For an instructor who assigned a paper: if only their class is reading it,
 * the aggregate is their class. There is no roster, no class code and no
 * student identity, and nothing here adds one. The unit is the anonymous
 * session — one row per reader per paper — and no output carries a session id.
 *
 * Like scoring, everything is derived from `events` at read time and nothing
 * is written back. The dedupe rules match lib/scoring.ts so the class page and
 * a reader's own results agree: the FIRST prediction per paragraph counts (a
 * second is made knowing the answer), the LAST answer per question counts (a
 * reader may change their mind before moving on).
 *
 * Suppression is the point of this file, not a detail of it. Any figure drawn
 * from fewer than MIN_READERS readers is replaced by a Gated value that
 * carries no numbers at all — not the count, not the split. The page cannot
 * leak a small-n figure because the figure never reaches it.
 */

/** Below this many readers, a line is not published. */
export const MIN_READERS = 5;

/** A figure that either supports itself or is withheld entirely. */
export type Gated<T> =
  | { shown: true; readers: number; value: T }
  | { shown: false };

export type OptionSplit = {
  id: string;
  text: string;
  count: number;
  /** 0-100, share of the readers who answered this question. */
  share: number;
  correct: boolean;
};

export type QuestionAggregate = {
  id: string;
  prompt: string;
  tag: string | null;
  paragraphIds: string[];
  split: Gated<OptionSplit[]>;
};

export type ParagraphMisses = {
  paragraphId: string;
  section: string;
  /** 0-100, share of first predictions on this paragraph that were wrong. */
  wrongShare: number;
  wrong: number;
};

export type GroupCalibration = {
  /** Mean over readers of each reader's mean stated confidence, 0-100. */
  meanConfidence: number;
  /** Mean over readers of each reader's appraisal accuracy, 0-100. */
  meanAccuracy: number;
  /** meanConfidence - meanAccuracy. Negative means underconfident. */
  gap: number;
};

export type ClassAggregate = {
  slug: string;
  /** Readers who started, and of them how many reached results. */
  reach: Gated<{ started: number; reachedResults: number }>;
  judge: QuestionAggregate[];
  check: QuestionAggregate[];
  /**
   * The judge question readers divided on hardest, among those that clear
   * the threshold. Null when none does.
   */
  mostDivided: { questionId: string; topShare: number } | null;
  /** Paragraphs that clear the threshold, most-often-mispredicted first. */
  missedParagraphs: ParagraphMisses[];
  /** How many paragraphs were withheld for having too few predictions. */
  paragraphsWithheld: number;
  calibration: Gated<GroupCalibration>;
  /** ISO time the underlying query ran, so the page can say how fresh it is. */
  computedAt: string;
};

/** One row of `events`, as selected. Only the columns aggregation reads. */
export type EventRow = {
  session_id: string;
  type: string;
  paragraph_id: string | null;
  question_id: string | null;
  payload: Record<string, unknown> | null;
  created_at: string;
};

const TYPES = [
  "paper_started",
  "prediction_made",
  "check_answered",
  "judge_answered",
  "paper_completed",
] as const;

function gate<T>(readers: number, value: () => T): Gated<T> {
  return readers >= MIN_READERS
    ? { shown: true, readers, value: value() }
    : { shown: false };
}

const pct = (part: number, whole: number) => (100 * part) / whole;

/**
 * Last answer per (reader, question), keeping only option ids the question
 * still has. An id the content no longer carries cannot be drawn as a bar,
 * and counting it in the denominator would make the bars not sum.
 */
function lastAnswers(
  rows: EventRow[],
  type: string,
  questions: AnyQuestion[],
): Map<string, Map<string, EventRow>> {
  const valid = new Map(
    questions.map((q) => [q.id, new Set(q.options.map((o) => o.id))]),
  );
  const byQuestion = new Map<string, Map<string, EventRow>>();
  for (const row of rows) {
    if (row.type !== type || !row.question_id) continue;
    const options = valid.get(row.question_id);
    const chosen = row.payload?.chosen_option_id;
    if (!options || typeof chosen !== "string" || !options.has(chosen)) continue;
    const bySession = byQuestion.get(row.question_id) ?? new Map();
    bySession.set(row.session_id, row); // rows are oldest first: last wins
    byQuestion.set(row.question_id, bySession);
  }
  return byQuestion;
}

function questionAggregates(
  questions: AnyQuestion[],
  answers: Map<string, Map<string, EventRow>>,
): QuestionAggregate[] {
  return questions.map((q) => {
    const bySession = answers.get(q.id) ?? new Map<string, EventRow>();
    const readers = bySession.size;
    return {
      id: q.id,
      prompt: q.prompt,
      tag: "tag" in q ? q.tag : null,
      paragraphIds: q.paragraph_ids ?? [],
      split: gate(readers, () => {
        const counts = new Map<string, number>();
        for (const row of bySession.values()) {
          const id = row.payload!.chosen_option_id as string;
          counts.set(id, (counts.get(id) ?? 0) + 1);
        }
        return q.options.map((o) => ({
          id: o.id,
          text: o.text,
          count: counts.get(o.id) ?? 0,
          share: pct(counts.get(o.id) ?? 0, readers),
          correct: o.id === q.correct,
        }));
      }),
    };
  });
}

/**
 * Pure: rows in, aggregate out. `rows` must be oldest first and already
 * limited to this paper. Kept separate from the query so it can be exercised
 * without a database.
 */
export function aggregate(
  paper: Paper,
  rows: EventRow[],
  computedAt = new Date().toISOString(),
): ClassAggregate {
  const sessions = new Set(rows.map((r) => r.session_id));
  const completed = new Set(
    rows.filter((r) => r.type === "paper_completed").map((r) => r.session_id),
  );

  /* -- Questions -- */
  const comprehension = paper.check;
  const appraisal = paper.judge;
  const judgeAnswers = lastAnswers(rows, "judge_answered", appraisal);
  const judge = questionAggregates(appraisal, judgeAnswers);
  const check = questionAggregates(
    comprehension,
    lastAnswers(rows, "check_answered", comprehension),
  );

  /* Hardest division: the lowest share on the most-chosen option. A question
     where the room split three ways is a better discussion than one most of
     the room got wrong together, so this is about disagreement, not error.
     Ties go to the question with more readers behind it. */
  let mostDivided: ClassAggregate["mostDivided"] = null;
  let mostDividedReaders = 0;
  for (const q of judge) {
    if (!q.split.shown) continue;
    const topShare = Math.max(...q.split.value.map((o) => o.share));
    if (
      !mostDivided ||
      topShare < mostDivided.topShare ||
      (topShare === mostDivided.topShare && q.split.readers > mostDividedReaders)
    ) {
      mostDivided = { questionId: q.id, topShare };
      mostDividedReaders = q.split.readers;
    }
  }

  /* -- Predictions: first per (reader, paragraph). -- */
  const firstPrediction = new Map<string, Map<string, boolean>>();
  for (const row of rows) {
    if (row.type !== "prediction_made" || !row.paragraph_id) continue;
    const bySession = firstPrediction.get(row.paragraph_id) ?? new Map();
    if (!bySession.has(row.session_id)) {
      bySession.set(row.session_id, row.payload?.correct === true);
    }
    firstPrediction.set(row.paragraph_id, bySession);
  }

  const sectionOf = new Map<string, string>();
  for (const p of paper.paragraphs) {
    sectionOf.set(p.id, p.section ?? p.imrad);
  }

  const missedParagraphs: ParagraphMisses[] = [];
  let paragraphsWithheld = 0;
  for (const [paragraphId, bySession] of firstPrediction) {
    if (!sectionOf.has(paragraphId)) continue; // not in this paper's text
    if (bySession.size < MIN_READERS) {
      paragraphsWithheld += 1;
      continue;
    }
    const wrong = [...bySession.values()].filter((ok) => !ok).length;
    missedParagraphs.push({
      paragraphId,
      section: sectionOf.get(paragraphId)!,
      wrong,
      wrongShare: pct(wrong, bySession.size),
    });
  }
  /* Paragraphs nobody has predicted yet are withheld too: they have fewer
     than five readers behind them, the same as one with four. */
  for (const id of sectionOf.keys()) {
    /* Every paragraph carries a prediction under the schema, so a
       paragraph nobody predicted is simply one nobody reached. */
    if (!firstPrediction.has(id)) paragraphsWithheld += 1;
  }
  missedParagraphs.sort((a, b) => b.wrongShare - a.wrongShare || b.wrong - a.wrong);

  /* -- Calibration: per reader first, then averaged, so a reader who
        answered five questions weighs the same as one who answered three. -- */
  const perReader = new Map<string, { conf: number; right: number; n: number }>();
  for (const bySession of judgeAnswers.values()) {
    for (const [session, row] of bySession) {
      const conf = row.payload?.confidence;
      if (typeof conf !== "number" || !Number.isFinite(conf)) continue;
      const r = perReader.get(session) ?? { conf: 0, right: 0, n: 0 };
      r.conf += conf;
      r.right += row.payload?.correct === true ? 1 : 0;
      r.n += 1;
      perReader.set(session, r);
    }
  }
  const calibration = gate(perReader.size, () => {
    const readers = [...perReader.values()];
    const meanConfidence =
      readers.reduce((s, r) => s + r.conf / r.n, 0) / readers.length;
    const meanAccuracy =
      readers.reduce((s, r) => s + pct(r.right, r.n), 0) / readers.length;
    return { meanConfidence, meanAccuracy, gap: meanConfidence - meanAccuracy };
  });

  return {
    slug: paper.slug,
    /* Reached-results is a share of everyone who started, so it rides on the
       started count's threshold rather than its own. */
    reach: gate(sessions.size, () => ({
      started: sessions.size,
      reachedResults: completed.size,
    })),
    judge,
    check,
    mostDivided,
    missedParagraphs,
    paragraphsWithheld,
    calibration,
    computedAt,
  };
}

/** PostgREST caps a response; page through rather than silently truncate. */
const PAGE = 1000;
/** Session ids per request on the fallback path, to keep the URL short. */
const ID_CHUNK = 100;

const EVENT_COLUMNS = "session_id,type,paragraph_id,question_id,payload,created_at";

/* Paging needs a total order. Nothing here assumes `events` has an id column,
   so the order is every column aggregation reads; rows tied on all of them
   aggregate identically, so which page one lands on cannot change a number. */
const ORDER = [
  "created_at",
  "session_id",
  "type",
  "question_id",
  "paragraph_id",
] as const;

/** PostgREST's code for "no relationship between these tables". */
const NO_RELATIONSHIP = "PGRST200";

/**
 * The narrow slice of the Supabase client this module uses.
 *
 * Declared rather than imported so a test can supply a stand-in without
 * reaching for a mocking framework, and so the surface it depends on is
 * visible in one place.
 */
export type QueryClient = {
  from: (table: string) => {
    select: (columns: string) => QueryBuilder;
  };
};

type QueryBuilder = {
  eq: (column: string, value: string) => QueryBuilder;
  in: (column: string, values: readonly string[]) => QueryBuilder;
  order: (column: string) => QueryBuilder;
  range: (from: number, to: number) => Promise<Page>;
};

type Page = {
  data: Record<string, unknown>[] | null;
  error: { code?: string; message: string } | null;
};

class NoRelationship extends Error {}

/** Runs a paged query to exhaustion. `page` builds one page's request. */
async function pageAll(
  page: (from: number, to: number) => PromiseLike<Page>,
): Promise<Record<string, unknown>[]> {
  const all: Record<string, unknown>[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await page(from, from + PAGE - 1);
    if (error?.code === NO_RELATIONSHIP) throw new NoRelationship(error.message);
    if (error) throw new Error(`class aggregate query failed: ${error.message}`);
    all.push(...(data ?? []));
    if (!data || data.length < PAGE) return all;
  }
}

function toRow(r: Record<string, unknown>): EventRow {
  return {
    session_id: String(r.session_id),
    type: String(r.type),
    paragraph_id: typeof r.paragraph_id === "string" ? r.paragraph_id : null,
    question_id: typeof r.question_id === "string" ? r.question_id : null,
    payload: (r.payload as Record<string, unknown> | null) ?? null,
    created_at: String(r.created_at),
  };
}

/**
 * Every event this aggregate reads, for one paper, oldest first.
 *
 * Events carry no slug of their own, so the paper is reached through the
 * session. The primary path is one query over `events` with an inner embed of
 * `sessions`, paged so a busy paper is not cut off at the API's row cap.
 *
 * The embed needs a foreign key from events.session_id to sessions.id. If the
 * project has none, PostgREST refuses the embed, and the fallback reads the
 * paper's session ids first and then their events in chunks. Same rows, more
 * round trips; the cache in front of this keeps that rare.
 */
/**
 * Every class-relevant event for one paper, oldest first.
 *
 * The client is a parameter so the two query paths can be tested without a
 * database. Production never passes one.
 */
export async function fetchRows(
  slug: string,
  db: QueryClient = createSupabaseServerClient() as unknown as QueryClient,
): Promise<EventRow[]> {
  const ordered = <T extends { order: (c: string) => T }>(q: T) =>
    ORDER.reduce((acc, column) => acc.order(column), q);

  let raw: Record<string, unknown>[];
  try {
    raw = await pageAll((from, to) =>
      ordered(
        db
          .from("events")
          .select(`${EVENT_COLUMNS},sessions!inner(paper_slug)`)
          .eq("sessions.paper_slug", slug)
          .in("type", [...TYPES]),
      ).range(from, to),
    );
  } catch (err) {
    if (!(err instanceof NoRelationship)) throw err;
    const sessions = await pageAll((from, to) =>
      db
        .from("sessions")
        .select("id")
        .eq("paper_slug", slug)
        .order("id")
        .range(from, to),
    );
    const ids = sessions.map((s) => String(s.id));
    raw = [];
    for (let i = 0; i < ids.length; i += ID_CHUNK) {
      const chunk = ids.slice(i, i + ID_CHUNK);
      raw.push(
        ...(await pageAll((from, to) =>
          ordered(
            db
              .from("events")
              .select(EVENT_COLUMNS)
              .in("session_id", chunk)
              .in("type", [...TYPES]),
          ).range(from, to),
        )),
      );
    }
  }

  /* Oldest first is what the dedupe rules rely on, whichever path ran and
     however chunks interleave. Array sort is stable. */
  return raw
    .map(toRow)
    .sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));
}

/** How long a computed aggregate is served before the query runs again. */
export const AGGREGATE_REVALIDATE_SECONDS = 300;

/**
 * The cached aggregate for one paper. The slug is part of the cache key, and
 * a thrown query is never cached, so an outage does not stick for five
 * minutes.
 */
export const getClassAggregate = unstable_cache(
  async (slug: string): Promise<ClassAggregate | null> => {
    const paper = getPaper(slug);
    if (!paper) return null;
    return aggregate(paper, await fetchRows(slug));
  },
  ["class-aggregate"],
  { revalidate: AGGREGATE_REVALIDATE_SECONDS, tags: ["class-aggregate"] },
);
