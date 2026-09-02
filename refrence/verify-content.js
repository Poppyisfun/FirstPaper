#!/usr/bin/env node
/**
 * FirstPaper content check — two tiers.
 *
 *   LOCKED   The authors' own words: paragraph text (`t`), subheadings (`h`),
 *            figure captions (`cap`), and the paper metadata. These are
 *            reproduced verbatim under CC-BY. Changing them breaks the licence
 *            and the promise that students are reading the real paper.
 *            → a change here FAILS.
 *
 *   EDITABLE FirstPaper's own teaching copy: the three-tier notes (`n`),
 *            quiz and judge questions, feedback, takeaways, figure explainers
 *            (`x`), and the plain-English recap. This is yours to tune.
 *            → a change here is REPORTED, not blocked.
 *
 * Usage
 *   node scripts/verify-content.js            check
 *   node scripts/verify-content.js --update   accept current state as the new baseline
 *   node scripts/verify-content.js --diff     list every editable string that changed
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SRC  = path.join(__dirname, '..', 'content', 'papers', 'dna-breakage-gamgfp.ts');
const LOCK = path.join(__dirname, '..', 'content', 'papers', 'dna-breakage-gamgfp.lock.json');
const h = (s) => crypto.createHash('sha256').update(String(s)).digest('hex').slice(0, 16);

let src = fs.readFileSync(SRC, 'utf8');
src = src
  .replace(/^import[^;]+;\s*/gm, '')
  .replace(/export const \w+: Paper =/, 'const paper =')
  .replace(/export default[^;]+;\s*$/m, '')
  .replace(/\/\*[\s\S]*?\*\//g, '');
const paper = eval(src + '; paper');

const locked = {};
const free = {};

locked['meta.title']   = h(paper.meta.title);
locked['meta.authors'] = h(paper.meta.authors);
locked['meta.cite']    = h(paper.meta.cite);
locked['meta.url']     = h(paper.meta.url);
locked['meta.licence'] = h(paper.meta.licence);

paper.sections.forEach((s, si) => {
  s.paras.forEach((p, pi) => {
    locked[`s${si}.p${pi}.t`] = h(p.t);
    if (p.h) locked[`s${si}.p${pi}.h`] = h(p.h);
    ['e', 'r', 'c'].forEach((k) => (free[`s${si}.p${pi}.n.${k}`] = h(p.n[k])));
  });
  (s.figs || []).forEach((f) => {
    locked[`s${si}.fig${f.n}.cap`] = h(f.cap);
    free[`s${si}.fig${f.n}.x`] = h(f.x);
  });
});
paper.quiz.forEach((x, i) => (free[`quiz${i}`] = h(JSON.stringify(x))));
paper.judge.forEach((x, i) => (free[`judge${i}`] = h(JSON.stringify(x))));
free.plain = h(paper.plain);

const paraCount = paper.sections.reduce((a, s) => a + s.paras.length, 0);
const figCount  = paper.sections.reduce((a, s) => a + (s.figs || []).length, 0);

if (process.argv.includes('--update')) {
  fs.writeFileSync(LOCK, JSON.stringify({ locked, free }, null, 2));
  console.log('Baseline updated.');
  console.log(`  ${Object.keys(locked).length} locked strings · ${Object.keys(free).length} editable strings`);
  process.exit(0);
}

if (!fs.existsSync(LOCK)) {
  fs.writeFileSync(LOCK, JSON.stringify({ locked, free }, null, 2));
  console.log('No baseline found — created one.');
  process.exit(0);
}

const prev = JSON.parse(fs.readFileSync(LOCK, 'utf8'));
const prevLocked = prev.locked || prev;
const prevFree   = prev.free   || {};

const diff = (a, b) => {
  const changed = [], added = [], removed = [];
  for (const k of Object.keys(a)) {
    if (!(k in b)) removed.push(k);
    else if (a[k] !== b[k]) changed.push(k);
  }
  for (const k of Object.keys(b)) if (!(k in a)) added.push(k);
  return { changed, added, removed };
};

const L = diff(prevLocked, locked);
const F = diff(prevFree, free);
const freeTouched = F.changed.length + F.added.length + F.removed.length;

console.log(`${paper.sections.length} sections · ${paraCount} paragraphs · ${figCount} figures · ${paper.quiz.length} quiz · ${paper.judge.length} judge\n`);

if (freeTouched) {
  console.log(`Teaching copy: ${F.changed.length} edited, ${F.added.length} added, ${F.removed.length} removed — that's fine, it's yours.`);
  if (process.argv.includes('--diff')) {
    F.changed.forEach((k) => console.log('    edited  ' + k));
    F.added.forEach((k)   => console.log('    added   ' + k));
    F.removed.forEach((k) => console.log('    removed ' + k));
  } else {
    console.log('    (run with --diff to list them)');
  }
  console.log('    Accept these: node scripts/verify-content.js --update\n');
} else {
  console.log('Teaching copy: unchanged.\n');
}

if (!L.changed.length && !L.added.length && !L.removed.length) {
  console.log("Paper text: intact. The authors' words are unmodified.");
  process.exit(0);
}

console.error("PAPER TEXT CHANGED — these are the authors' words, reproduced under CC-BY.\n");
if (L.changed.length) { console.error('  Modified:'); L.changed.forEach((k) => console.error('    ' + k)); }
if (L.removed.length) { console.error('  Removed:');  L.removed.forEach((k) => console.error('    ' + k)); }
if (L.added.length)   { console.error('  Added:');    L.added.forEach((k)   => console.error('    ' + k)); }
console.error('\nKey: s2.p3.t = section 3, paragraph 4, paper text.');
console.error('Check it against the original: ' + paper.meta.url);
console.error('\nIf you genuinely corrected a transcription error, run:');
console.error('  node scripts/verify-content.js --update');
process.exit(1);
