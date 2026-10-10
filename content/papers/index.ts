import crisprPaper from "./crispr-human-cells/paper.json";
import { parsePaper, type Paper } from "@/lib/schema";

/**
 * The paper registry.
 *
 * Adding a paper means adding a folder with one paper.json and one line
 * here. Every file is validated against the frozen schema at module load,
 * which means a malformed paper fails the build rather than a request — and
 * it means a pull request adding content can be merged on a green CI run
 * without reading all seventeen paragraphs by hand.
 *
 * This file used to normalise six JSON files field by field into the shape
 * the app wanted. That boundary silently dropped unknown keys, which is how
 * `caution` and the `abstract` IMRaD tag were lost for a while. Zod rejects
 * instead of discarding.
 */
export const papers: Paper[] = [
  parsePaper(crisprPaper, "content/papers/crispr-human-cells/paper.json"),
];
