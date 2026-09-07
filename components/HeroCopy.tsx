"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import { BtnLink, BtnAnchor } from "@/components/Btn";
import { EZ } from "@/components/motion-primitives";

/**
 * Hero copy, revealed on load in a single staggered cascade rather than on
 * scroll — it's already in view. Each line lifts out of a soft blur.
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

export default function HeroCopy() {
  const reduce = useReducedMotion();
  const v = reduce ? undefined : line;

  return (
    <motion.div
      className="hero-in"
      variants={reduce ? undefined : container}
      initial={reduce ? false : "hidden"}
      animate={reduce ? false : "shown"}
    >
      <motion.div className="eyebrow" variants={v}>
        <i aria-hidden="true" />
        For anyone who has opened a research paper and closed it again
      </motion.div>

      <motion.h1 className="big" variants={v}>
        Read any research paper. Understand it. Know if you can{" "}
        <em>trust</em> it.
      </motion.h1>

      <motion.p className="lede" variants={v}>
        Research papers are where real knowledge lives. Almost nobody is taught
        how to read them. FirstPaper walks you through a real paper, explains
        every part in plain words, and shows you how to judge whether the
        science holds up.
      </motion.p>

      <motion.div className="cta-row" variants={v}>
        <BtnLink href="/library" variant="lg glow-b" icon="→">
          Read your first paper
        </BtnLink>
        <BtnAnchor href="#how" variant="lg ghost">
          See how it works
        </BtnAnchor>
      </motion.div>
    </motion.div>
  );
}
