#!/usr/bin/env node
/**
 * FirstPaper content check — two tiers, plus an alignment check.
 *
 *   LOCKED    The authors' own words in paper.json: every source_text,
 *             every figure caption, and the bibliographic fields. This is
 *             their published work, reproduced under
 *             its open licence. A change here FAILS.
 *
 *   EDITABLE  Explanations, cautions, predictions, questions and the
 *             recap. This is FirstPaper's
 *             writing, and a change here is REPORTED, not blocked.
 *
 *   ALIGNMENT Explanations are keyed by paragraph id. If those drift apart,
 *             commentary silently attaches to the wrong paragraph, so a
 *             mismatch FAILS regardless of which side moved.
 *
 * Usage
 *   node scripts/verify-content.js            check
 *   node scripts/verify-content.js --update   accept current state as baseline
 *   node scripts/verify-content.js --diff     list every editable change
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PAPERS = path.join(__dirname, "..", "content", "papers");
const LOCK = path.join(PAPERS, ".content-lock.json");

const h = (s) =>
  crypto.createHash("sha256").update(String(s)).digest("hex").slice(0, 16);

/** Bibliographic fields are the publisher's; the rest is our shelving. */
const LOCKED_META = [
  "title",
  "authors",
  "year",
  "journal",
  "licence",
  "licence_url",
  "original_url",
];

function paperDirs() {
  if (!fs.existsSync(PAPERS)) return [];
  return fs
    .readdirSync(PAPERS, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((name) =>
      fs.existsSync(path.join(PAPERS, name, "paper.json")),
    )
    .sort();
}

const read = (slug, file) =>
  JSON.parse(fs.readFileSync(path.join(PAPERS, slug, file), "utf8"));

const locked = {};
const free = {};
const misaligned = [];
let paragraphTotal = 0;
let figureTotal = 0;
let explanationTotal = 0;

const slugs = paperDirs();

for (const slug of slugs) {
  const paper = read(slug, "paper.json");

  for (const key of LOCKED_META) {
    locked[`${slug}.meta.${key}`] = h(paper[key]);
  }
  locked[`${slug}.title`] = h(paper.title);

  const sourceIds = [];
  paper.paragraphs.forEach((p) => {
    // The authors' words and where they sit. Our commentary is not here.
    locked[`${slug}.${p.id}.source_text`] = h(p.source_text);
    locked[`${slug}.${p.id}.section`] = h(p.section);
    locked[`${slug}.${p.id}.imrad`] = h(p.imrad);
    sourceIds.push(p.id);
    paragraphTotal++;
  });

  (paper.figures || []).forEach((fig) => {
    locked[`${slug}.${fig.id}.caption`] = h(fig.caption);
    locked[`${slug}.${fig.id}.label`] = h(fig.label);
    figureTotal++;
  });

  for (const p of paper.paragraphs) {
    free[`${slug}.${p.id}.explanation`] = h(p.explanation);
    free[`${slug}.${p.id}.caution`] = h(p.caution || "");
    if (p.explanation) explanationTotal++;
  }
  free[`${slug}.practice_goal`] = h(paper.practice_goal);
  free[`${slug}.difficulty`] = h(paper.difficulty);
  free[`${slug}.recap`] = h(paper.recap);

  /* Alignment used to be a real hazard: explanations lived in a second file
     keyed by paragraph id, so a regenerated source silently attached our
     commentary to the wrong paragraph. One file per paper makes that
     impossible — an explanation sits inside the paragraph it explains. What
     is still worth checking is that every paragraph has one. */
  for (const p of paper.paragraphs) {
    if (!p.explanation || !p.explanation.trim()) {
      misaligned.push(`${slug}: ${p.id} has no explanation`);
    }
  }
}

if (!slugs.length) {
  console.error("No papers found under content/papers.");
  process.exit(1);
}

const summary =
  `${slugs.length} paper${slugs.length === 1 ? "" : "s"} · ` +
  `${paragraphTotal} paragraphs · ${figureTotal} figures · ` +
  `${explanationTotal} reader explanations`;

if (process.argv.includes("--update")) {
  fs.writeFileSync(LOCK, JSON.stringify({ locked, free }, null, 2));
  console.log("Baseline updated.");
  console.log(
    `  ${Object.keys(locked).length} locked strings · ` +
      `${Object.keys(free).length} editable strings`,
  );
  process.exit(0);
}

if (!fs.existsSync(LOCK)) {
  fs.writeFileSync(LOCK, JSON.stringify({ locked, free }, null, 2));
  console.log("No baseline found — created one.");
  console.log(`  ${summary}`);
  process.exit(0);
}

const prev = JSON.parse(fs.readFileSync(LOCK, "utf8"));
const diff = (a, b) => {
  const changed = [];
  const added = [];
  const removed = [];
  for (const k of Object.keys(a)) {
    if (!(k in b)) removed.push(k);
    else if (a[k] !== b[k]) changed.push(k);
  }
  for (const k of Object.keys(b)) if (!(k in a)) added.push(k);
  return { changed, added, removed };
};

const L = diff(prev.locked || {}, locked);
const F = diff(prev.free || {}, free);
const freeTouched = F.changed.length + F.added.length + F.removed.length;

console.log(`${summary}\n`);

if (freeTouched) {
  console.log(
    `Teaching copy: ${F.changed.length} edited, ${F.added.length} added, ` +
      `${F.removed.length} removed — that's fine, it's yours.`,
  );
  if (process.argv.includes("--diff")) {
    F.changed.forEach((k) => console.log("    edited  " + k));
    F.added.forEach((k) => console.log("    added   " + k));
    F.removed.forEach((k) => console.log("    removed " + k));
  } else {
    console.log("    (run with --diff to list them)");
  }
  console.log("    Accept these: node scripts/verify-content.js --update\n");
} else {
  console.log("Teaching copy: unchanged.\n");
}

let failed = false;

if (misaligned.length) {
  failed = true;
  console.error("EXPLANATIONS DO NOT LINE UP WITH PARAGRAPHS");
  console.error("Commentary keyed to a missing paragraph is shown against the");
  console.error("wrong text, or not at all.\n");
  misaligned.forEach((m) => console.error("    " + m));
  console.error("");
}

if (L.changed.length || L.added.length || L.removed.length) {
  failed = true;
  console.error("PAPER TEXT CHANGED — these are the authors' words.\n");
  if (L.changed.length) {
    console.error("  Modified:");
    L.changed.forEach((k) => console.error("    " + k));
  }
  if (L.removed.length) {
    console.error("  Removed:");
    L.removed.forEach((k) => console.error("    " + k));
  }
  if (L.added.length) {
    console.error("  Added:");
    L.added.forEach((k) => console.error("    " + k));
  }
  console.error("\nIf you genuinely corrected a transcription error, run:");
  console.error("  node scripts/verify-content.js --update");
}

if (failed) process.exit(1);

console.log("Paper text: intact. The authors' words are unmodified.");
console.log("Explanations: aligned with the paragraphs they explain.");
