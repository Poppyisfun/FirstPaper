import Link from "next/link";
import type { LibraryEntry } from "@/content/library";

/**
 * One catalogue record.
 *
 * It used to be a rounded card with a shadow and a radial sheen that
 * followed the cursor. Both are gone: identical shadowed cards are a banned
 * pattern here, and the sheen was a gradient chasing a pointer across a
 * reference. What a reader needs from an index is the reference itself, so
 * that is what it shows.
 */
export default function PaperCard({
  entry,
  index,
}: {
  entry: LibraryEntry;
  index: number;
}) {
  return (
    <article className="rec">
      <div className="rec-n">{String(index + 1).padStart(3, "0")}</div>

      <div className="rec-b">
        <h2 className="rec-t">
          <Link href={`/paper/${entry.slug}/read`}>{entry.title}</Link>
        </h2>

        <p className="rec-a">{entry.authors}</p>

        <p className="rec-ref">
          <span>
            {entry.journal} {entry.year}
          </span>
          <span>{entry.pmcid}</span>
          {entry.doi && <span>doi {entry.doi}</span>}
          <a href={entry.licenceUrl} target="_blank" rel="noopener noreferrer">
            {entry.licence}
          </a>
        </p>

        <p className="rec-g">{entry.practiceGoal}</p>

        <p className="rec-m">
          <span>{entry.paragraphs} paragraphs</span>
          <span>{entry.minutes} minutes</span>
          <span>{entry.xp} XP at most</span>
          <span>{entry.level}</span>
        </p>
      </div>
    </article>
  );
}
