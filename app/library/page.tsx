import Footer from "@/components/Footer";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
import Nav from "@/components/Nav";
import LibraryGrid from "@/components/LibraryGrid";
import { Rise } from "@/components/motion-primitives";

export const metadata: Metadata = pageMetadata(
  "Library — FirstPaper",
  "Free, open-access papers to work through, picked because they're worth your time.",
  "/library/opengraph-image",
);

export default function Library() {
  return (
    <>
      <a className="skip" href="#papers">
        Skip to papers
      </a>
      <Nav active="library" />

      <main className="wrap">
        <div className="lib-head">
          <Rise className="skick">
            <span className="skick-n">001</span>The catalogue
          </Rise>
          <Rise as="h1" className="stitle" delay={0.06} style={{ maxWidth: "17ch" }}>
            One paper, done properly.
          </Rise>
          <Rise as="p" className="ssub" delay={0.12} style={{ maxWidth: 560 }}>
            I prepare each one by hand, paragraph by paragraph, which is why
            they arrive slowly. This is the one that exists so far. It is open
            access, and the authors&rsquo; licence is on the record below.
          </Rise>
        </div>

        <div id="papers">
          <LibraryGrid />
        </div>

        {/* The reason for a short shelf, said once, at the end, without a
            box around it. It is already in the page's opening lines. */}
      </main>
      <Footer />
    </>
  );
}
