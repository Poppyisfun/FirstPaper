#!/usr/bin/env node
/**
 * FirstPaper content check — two tiers, plus an alignment check.
 *
 *   LOCKED    Everything in source.json, and the bibliographic fields of
 *             meta.json. This is the authors' published work, reproduced under
 *             its open licence. A change here FAILS.
 *
 *   EDITABLE  explanations.json and our own meta fields. This is FirstPaper's
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
      fs.existsSync(path.join(PAPERS, name, "source.json")),
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
  const source = read(slug, "source.json");
  const meta = read(slug, "meta.json");
  const explanations = fs.existsSync(
    path.join(PAPERS, slug, "explanations.json"),
  )
    ? read(slug, "explanations.json")
    : {};

  for (const key of LOCKED_META) {
    locked[`${slug}.meta.${key}`] = h(meta[key]);
  }
  locked[`${slug}.source.title`] = h(source.title);

  const sourceIds = [];
  source.sections.forEach((section, si) => {
    locked[`${slug}.s${si}.heading`] = h(section.heading);
    locked[`${slug}.s${si}.imrad`] = h(section.imrad);
    section.paragraphs.forEach((p) => {
      locked[`${slug}.${p.id}.text`] = h(p.text);
      sourceIds.push(p.id);
      paragraphTotal++;
    });
  });

  (source.figures || []).forEach((fig, i) => {
    locked[`${slug}.fig${i}.caption`] = h(fig.caption);
    figureTotal++;
  });

  for (const [id, entry] of Object.entries(explanations)) {
    for (const level of ["explorer", "reader", "critic"]) {
      free[`${slug}.${id}.${level}`] = h(entry[level] || "");
    }
    if (entry.reader) explanationTotal++;
  }
  free[`${slug}.meta.practiceGoal`] = h(meta.practiceGoal);
  free[`${slug}.meta.level`] = h(meta.level);

  // Alignment: every paragraph should have an entry, and vice versa.
  const explIds = Object.keys(explanations);
  if (explIds.length) {
    for (const id of sourceIds) {
      if (!(id in explanations)) misaligned.push(`${slug}: no entry for ${id}`);
    }
    for (const id of explIds) {
      if (!sourceIds.includes(id)) {
        misaligned.push(`${slug}: entry ${id} has no paragraph`);
      }
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
