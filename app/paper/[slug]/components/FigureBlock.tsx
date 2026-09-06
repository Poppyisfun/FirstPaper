"use client";

import Image from "next/image";
import { useRef } from "react";
import type { Figure } from "@/lib/types";

/**
 * A figure: the authors' image and caption verbatim, then our own explainer.
 * Blue throughout, which is the figure colour in the semantic system.
 *
 * The plate is far too detailed to read inline, so the whole thing is a button
 * that opens the lightbox.
 */
export default function FigureBlock({
  fig,
  paperTitle,
  onOpen,
}: {
  fig: Figure;
  paperTitle: string;
  onOpen: (fig: Figure, restoreTo: HTMLElement | null) => void;
}) {
  const btn = useRef<HTMLButtonElement>(null);

  return (
    <figure className="pp-fig">
      <button
        type="button"
        className="fig-open"
        ref={btn}
        onClick={() => onOpen(fig, btn.current)}
        aria-label={`Enlarge figure ${fig.n}`}
      >
        <Image
          src={fig.src}
          alt={`Figure ${fig.n} from ${paperTitle}`}
          width={1400}
          height={1000}
          sizes="(max-width: 900px) 100vw, 760px"
          style={{ width: "100%", height: "auto" }}
        />
        <span className="fig-chip" aria-hidden="true">
          ⤢ Enlarge
        </span>
      </button>

      {/* The authors' caption, verbatim. */}
      <figcaption dangerouslySetInnerHTML={{ __html: fig.cap }} />
      {/* FirstPaper's explainer — ours, clearly separated from the caption. */}
      <div className="fig-x" dangerouslySetInnerHTML={{ __html: fig.x }} />
    </figure>
  );
}
