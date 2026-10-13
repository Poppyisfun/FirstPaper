import type { Metadata } from "next";
import { getPaper } from "@/lib/content";

/**
 * Where the site lives, for absolute Open Graph URLs. Set
 * NEXT_PUBLIC_SITE_URL in production; Vercel's own production host is the
 * fallback, and localhost only ever applies in development.
 */
export const SITE_URL = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000"),
);

/**
 * Title, description and their Open Graph / Twitter twins in one place.
 *
 * A page that sets `openGraph` replaces its parent's object wholesale rather
 * than merging into it, so every page that has its own title has to restate
 * the share fields too, or links to it unfurl with the home page's title.
 * The same goes for a file-based opengraph-image in a parent segment, which
 * is why the image is passed explicitly rather than left to inheritance.
 */
export function pageMetadata(
  title: string,
  description: string,
  /** Path of the opengraph-image route this page shares. */
  image = "/opengraph-image",
): Metadata {
  const images = [{ url: image, width: 1200, height: 630, alt: title }];
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: "FirstPaper",
      type: "website",
      locale: "en",
      images,
    },
    twitter: { card: "summary_large_image", title, description, images },
  };
}

const PHASE_TITLES = {
  read: "Read",
  check: "Check",
  judge: "Judge",
  recap: "Recap",
} as const;

/** Metadata for one phase of one paper. */
export function paperMetadata(
  slug: string,
  phase: keyof typeof PHASE_TITLES,
): Metadata {
  const paper = getPaper(slug);
  if (!paper) return { title: "Paper not found — FirstPaper" };
  return pageMetadata(
    `${PHASE_TITLES[phase]}: ${paper.title} — FirstPaper`,
    paper.practice_goal,
    `/paper/${slug}/opengraph-image`,
  );
}
