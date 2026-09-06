import type { Metadata } from "next";
import Nav from "@/components/Nav";
import LibraryGrid from "@/components/LibraryGrid";
import { Rise } from "@/components/motion-primitives";

export const metadata: Metadata = {
  title: "Library — FirstPaper",
  description:
    "Free, open-access papers to work through, picked because they're worth your time.",
};

export default function Library() {
  return (
    <>
      <a className="skip" href="#papers">
        Skip to papers
      </a>
      <Nav active="library" />

      <main className="wrap">
        <div className="lib-head">
          <Rise className="skick">The library</Rise>
          <Rise as="h1" className="stitle" delay={0.06} style={{ maxWidth: "16ch" }}>
            Choose a paper to work through.
          </Rise>
          <Rise as="p" className="ssub" delay={0.12} style={{ maxWidth: 560 }}>
            Every paper here is free and open-access, and picked because
            it&rsquo;s worth your time. Start anywhere. Most people begin with
            an Explorer paper.
          </Rise>
        </div>

        <div id="papers">
          <LibraryGrid />
        </div>

        <Rise
          as="p"
          className="mx-auto my-[76px] max-w-[620px] rounded-[20px] border border-dashed border-line bg-surface px-6 py-7 text-center text-[13.5px] leading-relaxed text-ink-soft"
        >
          New papers land every few weeks. If there&rsquo;s one you want built
          out, <b className="font-semibold text-ink">tell me</b> and I&rsquo;ll
          look at it.
        </Rise>
      </main>
    </>
  );
}
