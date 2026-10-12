import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Not found — FirstPaper",
};

/** Unknown routes, and any paper slug with no folder behind it. */
export default function NotFound() {
  return (
    <main className="st-page">
      <p className="st-k">Not found</p>
      <h1 className="st-t">There&rsquo;s nothing at this address.</h1>
      <p className="st-p">
        The link may be old, or mistyped. Every paper FirstPaper has is in the
        library.
      </p>
      <div className="st-acts">
        <Link className="ph-go" href="/library">
          Go to the library →
        </Link>
        <Link className="st-alt" href="/">
          Home
        </Link>
      </div>
    </main>
  );
}
