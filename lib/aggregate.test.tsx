import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MIN_READERS, aggregate, type ClassRow } from "@/lib/aggregate";
import { getPaper } from "@/lib/content";
import ClassView from "@/app/paper/[slug]/class/ClassView";

const paper = getPaper("crispr-human-cells")!;
const paragraphIds = paper.source.sections.flatMap((s) => s.paragraphs.map((p) => p.id));

let t = 0;
const at = () => new Date(Date.UTC(2026, 0, 1, 0, 0, t++)).toISOString();

/**
 * One reader's whole run. `pick(questionIndex, options)` chooses which option
 * id they answer each judge question with; checks and predictions follow a
 * fixed pattern so the tests can predict the tallies.
 */
function reader(
  id: string,
  pick: (i: number, optionIds: string[]) => string,
  opts: { complete?: boolean; confidence?: number; missParagraph0?: boolean } = {},
): ClassRow[] {
  const rows: ClassRow[] = [];
  const row = (r: Partial<ClassRow> & { type: string }): ClassRow => ({
    session_id: id,
    paragraph_id: null,
    question_id: null,
    payload: {},
    created_at: at(),
    ...r,
  });
  rows.push(row({ type: "paper_started" }));
  paragraphIds.forEach((pid, i) => {
    const correct = !(i === 0 && opts.missParagraph0);
    rows.push(row({ type: "prediction_made", paragraph_id: pid, payload: { correct } }));
  });
  for (const q of paper.questions.comprehension) {
    rows.push(
      row({
        type: "check_answered",
        question_id: q.id,
        payload: { chosen_option_id: q.correctOptionId, correct: true },
      }),
    );
  }
  paper.questions.appraisal.forEach((q, i) => {
    const chosen = pick(i, q.options.map((o) => o.id));
    rows.push(
      row({
        type: "judge_answered",
        question_id: q.id,
        payload: {
          chosen_option_id: chosen,
          correct: chosen === q.correctOptionId,
          confidence: opts.confidence ?? 70,
        },
      }),
    );
  });
  if (opts.complete !== false) rows.push(row({ type: "paper_completed" }));
  return rows;
}

const correctPick = (i: number) => paper.questions.appraisal[i].correctOptionId;

describe("aggregate", () => {
  it("counts readers who started and who reached results", () => {
    const rows = [
      ...reader("r1", correctPick),
      ...reader("r2", correctPick, { complete: false }),
    ];
    const v = aggregate(rows, paper);
    expect(v.started).toBe(2);
    expect(v.reachedResults).toBe(1);
  });

  it("suppresses every computed line below five readers", () => {
    const rows = Array.from({ length: MIN_READERS - 1 }, (_, k) =>
      reader(`r${k}`, correctPick, { missParagraph0: true }),
    ).flat();
    const v = aggregate(rows, paper);
    expect(v.judge.every((q) => !q.split.shown)).toBe(true);
    expect(v.check.every((q) => !q.split.shown)).toBe(true);
    expect(v.dividedHardest).toBeNull();
    expect(v.paragraphMisses).toEqual([]);
    expect(v.confidence.shown).toBe(false);
    expect(v.judge[0].split.readers).toBe(MIN_READERS - 1);
  });

  it("shows splits at five readers, with the correct option marked", () => {
    const rows = Array.from({ length: 5 }, (_, k) => reader(`r${k}`, correctPick)).flat();
    const v = aggregate(rows, paper);
    const q = v.judge[0];
    expect(q.split.shown).toBe(true);
    if (!q.split.shown) return;
    const ours = q.split.value.options.find((o) => o.correct)!;
    expect(ours.count).toBe(5);
    expect(ours.share).toBe(100);
  });

  it("finds the question the room divided on hardest", () => {
    /* Everyone agrees on every question except a3, where five readers spread
       across the options. */
    const rows = Array.from({ length: 5 }, (_, k) =>
      reader(`r${k}`, (i, ids) => (i === 2 ? ids[k % ids.length] : correctPick(i))),
    ).flat();
    const v = aggregate(rows, paper);
    expect(v.dividedHardest?.questionId).toBe(paper.questions.appraisal[2].id);
    expect(v.dividedHardest?.split.shown && v.dividedHardest.split.value.plurality).toBe(40);
  });

  it("orders paragraphs by how often the first guess missed", () => {
    const rows = Array.from({ length: 6 }, (_, k) =>
      reader(`r${k}`, correctPick, { missParagraph0: k < 3 }),
    ).flat();
    const v = aggregate(rows, paper);
    expect(v.paragraphMisses[0]).toEqual({
      paragraphId: paragraphIds[0],
      readers: 6,
      missed: 3,
      missRate: 50,
    });
  });

  it("counts a reader's first answer, not a second pass", () => {
    const first = reader("r1", (_, ids) => ids.find((id) => id !== correctPick(0))!);
    const second = reader("r1", correctPick);
    const others = Array.from({ length: 4 }, (_, k) => reader(`o${k}`, correctPick)).flat();
    const v = aggregate([...first, ...second, ...others], paper);
    const q = v.judge[0];
    if (!q.split.shown) throw new Error("expected shown");
    expect(q.split.readers).toBe(5);
    expect(q.split.value.options.find((o) => o.correct)!.count).toBe(4);
  });

  it("pools confidence against accuracy once five readers have judged", () => {
    const rows = Array.from({ length: 5 }, (_, k) =>
      reader(`r${k}`, correctPick, { confidence: 60 }),
    ).flat();
    const v = aggregate(rows, paper);
    expect(v.confidence).toEqual({
      shown: true,
      readers: 5,
      value: { meanConfidence: 60, accuracy: 100, guessing: 25 },
    });
  });
});

describe("the class page with two readers", () => {
  /* What an instructor sees when only two people have opened the paper.
     DECISIONS.md quotes this, so it is pinned here. */
  const rows = [
    ...reader("r1", correctPick, { missParagraph0: true }),
    ...reader("r2", (_, ids) => ids[ids.length - 1], { complete: false }),
  ];
  const html = renderToStaticMarkup(
    <ClassView
      title={paper.meta.title}
      originalUrl={paper.meta.originalUrl}
      view={aggregate(rows, paper)}
      paragraphs={{}}
    />,
  );
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

  it("shows the counts", () => {
    expect(text).toContain("2 readers started this paper. 1 reached their results.");
  });

  it("hides every split, the paragraph list and the group calibration", () => {
    expect(text).toContain("Not enough readers yet to say where they divided.");
    expect(text.match(/2 of 5 readers\. Hidden until 5\./g)).toHaveLength(
      paper.questions.appraisal.length + paper.questions.comprehension.length + 1,
    );
    expect(text).toContain("No paragraph has 5 guesses yet.");
    expect(html).not.toContain("cv-split");
    expect(text).not.toMatch(/\d+% of 2 readers/);
    expect(text).not.toContain("our answer");
  });
});
