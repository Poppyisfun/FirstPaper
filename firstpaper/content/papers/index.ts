import type { Paper } from "@/lib/types";
import dnaBreakageGamGFP from "./dna-breakage-gamgfp";

/**
 * Every built paper. Adding one: drop the data file in this folder, import it,
 * add it here, then run `node scripts/verify-content.js --update` to
 * fingerprint it. No component changes needed.
 */
export const papers: Paper[] = [dnaBreakageGamGFP];

/** Slugs of every built paper, in library order. */
export const paperSlugs: string[] = papers.map((p) => p.slug);

/** The paper for a slug, or undefined when nothing is built for it yet. */
export function getPaper(slug: string): Paper | undefined {
  return papers.find((p) => p.slug === slug);
}

/** Whether a paper file exists for this slug. Drives the library's live flag. */
export function hasPaper(slug: string): boolean {
  return papers.some((p) => p.slug === slug);
}
