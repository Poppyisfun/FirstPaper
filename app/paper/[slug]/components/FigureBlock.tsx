import Image from "next/image";
import type { Figure } from "@/lib/types";

/**
 * A figure: the authors' image and caption verbatim, then our own explainer.
 * Blue throughout, which is the figure colour in the semantic system.
 */
export default function FigureBlock({
  fig,
  paperTitle,
}: {
  fig: Figure;
  paperTitle: string;
}) {
  return (
    <figure className="pp-fig">
      <Image
        src={fig.src}
        alt={`Figure ${fig.n} from ${paperTitle}`}
        width={1400}
        height={1000}
        sizes="(max-width: 900px) 100vw, 760px"
        style={{ width: "100%", height: "auto" }}
      />
      {/* The authors' caption, verbatim. */}
      <figcaption dangerouslySetInnerHTML={{ __html: fig.cap }} />
      {/* FirstPaper's explainer — ours, clearly separated from the caption. */}
      <div className="fig-x" dangerouslySetInnerHTML={{ __html: fig.x }} />
    </figure>
  );
}
