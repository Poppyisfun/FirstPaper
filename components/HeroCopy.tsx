"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import { BtnLink, BtnAnchor } from "@/components/Btn";
import { EZ, staticVariants } from "@/components/motion-primitives";

/**
 * Hero copy, revealed on load in a single staggered cascade rather than on
 * scroll, because it is already in view. Each line lifts out of a soft blur.
 *
 * The catalogue line above the headline is the paper's own reference: who
 * wrote it, where, when, its PMCID, its DOI and its licence. It replaced a
 * pill reading "For anyone who has opened a research paper and closed it
 * again", which was a label with nothing in it. The test for keeping an
 * uppercase marker is whether deleting it loses information. Deleting this
 * one loses the citation.
 *
 * Every number here is passed in from the paper file. None is typed.
 */
const container: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.11, delayChildren: 0.12 } },
};

const line: Variants = {
  hidden: { opacity: 0, y: 24, filter: "blur(8px)" },
  shown: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.9, ease: EZ },
  },
};

export type HeroPaper = {
  title: string;
  firstAuthor: string;
  journal: string;
  year: number;
  pmcid: string;
  doi: string | null;
  licence: string;
  licenceUrl: string;
  paragraphs: number;
  minutes: number;
};

export default function HeroCopy({ paper }: { paper: HeroPaper }) {
  const reduce = useReducedMotion();
  /* Still driven through the variants when motion is reduced, just to the
     resting state at once: the server renders the hidden state either way,
     and switching animation off here used to leave the hero at opacity 0. */
  const v = reduce ? staticVariants : line;

  return (
    <motion.div
      className="hero-in"
      variants={reduce ? undefined : container}
      initial="hidden"
      animate="shown"
    >
      <motion.div className="hero-idx" variants={v}>
        <span className="hero-idx-n">001</span>
        <span>
          {paper.firstAuthor} et al. · {paper.journal} {paper.year}
        </span>
        <span>{paper.pmcid}</span>
        {paper.doi && <span>doi {paper.doi}</span>}
        <a href={paper.licenceUrl} target="_blank" rel="noopener noreferrer">
          {paper.licence}
        </a>
      </motion.div>

      <motion.h1 className="big" variants={v}>
        {/* The explicit spaces matter: JSX drops the whitespace either side
            of an element on its own line, so when the break is hidden at
            narrow widths the words would otherwise fuse. */}
        Almost nobody reads{" "}
        <br />
        the paper the headline{" "}
        <br />
        came from.
      </motion.h1>

      <motion.p className="lede" variants={v}>
        I picked one and built a way through it: {paper.title}.{" "}
        {paper.paragraphs} paragraphs, about {paper.minutes} minutes. You read
        the authors&rsquo; own words and guess what each one says before my
        explanation appears. Then you say how sure you are, before you see the
        options. One paper so far, and no accounts.
      </motion.p>

      <motion.div className="cta-row" variants={v}>
        <BtnLink href="/library" variant="lg glow-b">
          Read the paper
        </BtnLink>
        <BtnAnchor href="#how" variant="lg ghost">
          See how it works
        </BtnAnchor>
      </motion.div>
    </motion.div>
  );
}
