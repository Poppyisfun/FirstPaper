import { describe, expect, it } from "vitest";
import {
  MIN_READERS,
  aggregate,
  fetchRows,
  type EventRow,
  type QueryClient,
} from "./aggregate";
import { getPaper } from "./content";
import type { Paper } from "./schema";

/**
 * The class view is the feature that decides whether an instructor uses this
 * twice, and its suppression rule is the product's own honesty rule turned on
 * itself: no line computed from fewer than five readers.
 *
 * These tests are built on the real CRISPR paper rather than a fixture, so a
 * question id that stops existing fails here rather than silently producing
 * an empty page.
 */
const paper = getPaper("crispr-human-cells") as Paper;
const judgeId = paper.judge[0].id;
const judgeOptions = paper.judge[0].options.map((o) => o.id);
const paragraphId = paper.paragraphs[1].id;

let clock = 0;
/** Events are deduped by "last wins", so every row needs a distinct time. */
const at = () => new Date(Date.UTC(2026, 0, 1) + ++clock * 1000).toISOString();

function judged(session: string, questionId: string, chosen: string): EventRow {
  return {
    session_id: session,
    type: "judge_answered",
    paragraph_id: null,
    question_id: questionId,
    payload: { chosen_option_id: chosen, confidence: 70, correct: false },
    created_at: at(),
  };
}

function predicted(session: string, correct: boolean): EventRow {
  return {
    session_id: session,
    type: "prediction_made",
    paragraph_id: paragraphId,
    question_id: null,
    payload: { correct },
    created_at: at(),
  };
}

/** n readers, each answering the same judge question. */
function readers(n: number, questionId = judgeId): EventRow[] {
  return Array.from({ length: n }, (_, i) =>
    judged(`s${i}`, questionId, judgeOptions[i % judgeOptions.length]),
  );
}

describe("small-n suppression", () => {
  it("hides a split from one reader below the threshold", () => {
    const result = aggregate(paper, readers(MIN_READERS - 1));
    const q = result.judge.find((x) => x.id === judgeId)!;
    expect(q.split.shown).toBe(false);
  });

  it("shows it at exactly the threshold", () => {
    const result = aggregate(paper, readers(MIN_READERS));
    const q = result.judge.find((x) => x.id === judgeId)!;
    expect(q.split.shown).toBe(true);
    if (q.split.shown) expect(q.split.readers).toBe(MIN_READERS);
  });

  it("shows it above the threshold", () => {
    const result = aggregate(paper, readers(MIN_READERS + 1));
    const q = result.judge.find((x) => x.id === judgeId)!;
    expect(q.split.shown).toBe(true);
    if (q.split.shown) expect(q.split.readers).toBe(MIN_READERS + 1);
  });

  it("never leaks a count through a hidden value", () => {
    /* A hidden line must carry no numbers at all. Reporting "4 readers" is
       itself a disclosure when a class is small. */
    const result = aggregate(paper, readers(4));
    const q = result.judge.find((x) => x.id === judgeId)!;
    expect(q.split).toEqual({ shown: false });
  });

  it("suppresses the group calibration on the same boundary", () => {
    expect(aggregate(paper, readers(4)).calibration.shown).toBe(false);
    expect(aggregate(paper, readers(5)).calibration.shown).toBe(true);
  });

  it("counts a paragraph's predictions against the same threshold", () => {
    const four = aggregate(
      paper,
      Array.from({ length: 4 }, (_, i) => predicted(`s${i}`, false)),
    );
    expect(four.missedParagraphs).toHaveLength(0);
    expect(four.paragraphsWithheld).toBeGreaterThan(0);

    const five = aggregate(
      paper,
      Array.from({ length: 5 }, (_, i) => predicted(`s${i}`, false)),
    );
    expect(five.missedParagraphs.map((p) => p.paragraphId)).toContain(
      paragraphId,
    );
  });
});

describe("the hardest-divided question", () => {
  it("is the one whose top option holds the smallest share", () => {
    const [a, b] = [paper.judge[0], paper.judge[1]];
    const rows = [
      // Question a: 5 readers split 4/1 — a clear majority.
      ...Array.from({ length: 4 }, (_, i) =>
        judged(`s${i}`, a.id, a.options[0].id),
      ),
      judged("s4", a.id, a.options[1].id),
      // Question b: 5 readers split 2/2/1 — genuinely divided.
      judged("s0", b.id, b.options[0].id),
      judged("s1", b.id, b.options[0].id),
      judged("s2", b.id, b.options[1].id),
      judged("s3", b.id, b.options[1].id),
      judged("s4", b.id, b.options[2].id),
    ];
    expect(aggregate(paper, rows).mostDivided?.questionId).toBe(b.id);
  });

  it("breaks a tie towards the question more readers answered", () => {
    const [a, b] = [paper.judge[0], paper.judge[1]];
    /* Both split evenly down the middle, so topShare ties exactly. The one
       six readers reached is the better lesson than the one five did. */
    const rows = [
      ...Array.from({ length: 6 }, (_, i) =>
        judged(`s${i}`, a.id, a.options[i % 2].id),
      ),
      ...Array.from({ length: 8 }, (_, i) =>
        judged(`t${i}`, b.id, b.options[i % 2].id),
      ),
    ];
    const result = aggregate(paper, rows);
    const splitA = result.judge.find((q) => q.id === a.id)!.split;
    const splitB = result.judge.find((q) => q.id === b.id)!.split;
    const top = (s: typeof splitA) =>
      s.shown ? Math.max(...s.value.map((o) => o.share)) : -1;
    expect(top(splitA)).toBe(top(splitB)); // the tie is real
    expect(result.mostDivided?.questionId).toBe(b.id); // 8 readers beats 6
  });

  it("is null when no question clears the threshold", () => {
    expect(aggregate(paper, readers(MIN_READERS - 1)).mostDivided).toBeNull();
  });

  it("quotes the paragraphs the question rests on", () => {
    /* The point of the field: an instructor needs the paragraph, not just
       the question id, or the page is a chart rather than a lesson plan. */
    const result = aggregate(paper, readers(MIN_READERS));
    const q = result.judge.find((x) => x.id === judgeId)!;
    expect(q.paragraphIds).toEqual(paper.judge[0].paragraph_ids ?? []);
    expect(q.paragraphIds.length).toBeGreaterThan(0);
  });
});

describe("no events", () => {
  it("returns a shape the page can render, with everything hidden", () => {
    const result = aggregate(paper, []);
    expect(result.reach.shown).toBe(false);
    expect(result.calibration.shown).toBe(false);
    expect(result.mostDivided).toBeNull();
    expect(result.missedParagraphs).toEqual([]);
    expect(result.judge).toHaveLength(paper.judge.length);
    expect(result.check).toHaveLength(paper.check.length);
    expect(result.judge.every((q) => !q.split.shown)).toBe(true);
  });
});

/* ── The two query paths ──────────────────────────────────────────────── */

type Row = Record<string, unknown>;

/**
 * A stand-in for the Supabase client.
 *
 * `failEmbed` makes the joined select fail the way PostgREST does when
 * events has no foreign key to sessions, which is the whole reason the
 * fallback exists.
 */
function fakeDb(
  events: Row[],
  sessionIds: string[],
  { failEmbed = false }: { failEmbed?: boolean } = {},
): { db: QueryClient; paths: string[] } {
  const paths: string[] = [];

  const db = {
    from(table: string) {
      return {
        select(columns: string) {
          const embedded = columns.includes("sessions!inner");
          let rows: Row[] =
            table === "sessions"
              ? sessionIds.map((id) => ({ id }))
              : [...events];
          const builder = {
            eq: () => builder,
            in: (column: string, values: readonly string[]) => {
              if (column === "session_id") {
                rows = rows.filter((r) => values.includes(String(r.session_id)));
              }
              return builder;
            },
            order: () => builder,
            range: async (from: number, to: number) => {
              if (table === "events" && embedded && failEmbed) {
                paths.push("embed-refused");
                return {
                  data: null,
                  error: { code: "PGRST200", message: "no relationship" },
                };
              }
              paths.push(`${table}:${embedded ? "embed" : "plain"}`);
              return { data: rows.slice(from, to + 1), error: null };
            },
          };
          return builder;
        },
      };
    },
  } as unknown as QueryClient;

  return { db, paths };
}

describe("the PGRST200 fallback", () => {
  const sessionIds = ["s0", "s1", "s2"];
  const events: Row[] = sessionIds.flatMap((id, i) => [
    {
      session_id: id,
      type: "judge_answered",
      paragraph_id: null,
      question_id: judgeId,
      payload: { chosen_option_id: judgeOptions[i % judgeOptions.length] },
      created_at: new Date(Date.UTC(2026, 0, 1) + i * 1000).toISOString(),
    },
  ]);

  it("reads through the join when the embed works", async () => {
    const { db, paths } = fakeDb(events, sessionIds);
    const rows = await fetchRows("crispr-human-cells", db);
    expect(rows).toHaveLength(events.length);
    expect(paths.some((p) => p === "events:embed")).toBe(true);
    expect(paths.some((p) => p.startsWith("sessions"))).toBe(false);
  });

  it("falls back to session ids when the embed is refused", async () => {
    const { db, paths } = fakeDb(events, sessionIds, { failEmbed: true });
    const rows = await fetchRows("crispr-human-cells", db);
    expect(paths).toContain("embed-refused");
    expect(paths.some((p) => p.startsWith("sessions"))).toBe(true);
    expect(rows).toHaveLength(events.length);
  });

  it("produces byte-identical output on both paths", async () => {
    const viaJoin = await fetchRows(
      "crispr-human-cells",
      fakeDb(events, sessionIds).db,
    );
    const viaFallback = await fetchRows(
      "crispr-human-cells",
      fakeDb(events, sessionIds, { failEmbed: true }).db,
    );
    expect(viaFallback).toEqual(viaJoin);
    // And the aggregate built from each is identical too.
    const fixed = "2026-01-01T00:00:00.000Z";
    expect(aggregate(paper, viaFallback, fixed)).toEqual(
      aggregate(paper, viaJoin, fixed),
    );
  });

  it("still sorts oldest-first when the fallback interleaves chunks", async () => {
    const shuffled = [...events].reverse();
    const { db } = fakeDb(shuffled, sessionIds, { failEmbed: true });
    const rows = await fetchRows("crispr-human-cells", db);
    const times = rows.map((r) => Date.parse(r.created_at));
    expect(times).toEqual([...times].sort((a, b) => a - b));
  });
});
