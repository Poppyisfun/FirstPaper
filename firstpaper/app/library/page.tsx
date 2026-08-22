import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Reveal from "@/components/Reveal";
import LibraryGrid from "@/components/LibraryGrid";

export const metadata: Metadata = {
  title: "Library — FirstPaper",
  description:
    "Free, open-access papers to work through, hand-picked to be worth your time.",
};

export default function Library() {
  return (
    <>
      <Nav active="library" />

      <div className="wrap">
        <div className="lib-head">
          <Reveal className="skick">The library</Reveal>
          <Reveal as="h1" className="stitle" style={{ maxWidth: "16ch" }}>
            Choose a paper to work through.
          </Reveal>
          <Reveal
            as="p"
            className="ssub"
            style={{ maxWidth: 560, marginBottom: 26 }}
          >
            Every paper is free and open-access, hand-picked to be worth your
            time. Start anywhere — most people begin with an Explorer paper.
          </Reveal>
        </div>

        <LibraryGrid />

        <div
          style={{
            margin: "34px 0 70px",
            padding: 22,
            border: "1px dashed var(--line)",
            borderRadius: 16,
            textAlign: "center",
            color: "var(--soft)",
            fontSize: 13.5,
          }}
        >
          More papers land every few weeks. Got one you want scaffolded?{" "}
          <b style={{ color: "var(--ink)" }}>Tell me.</b>
        </div>
      </div>
    </>
  );
}
