"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * The fallback for any screen that throws while rendering. Paper content is
 * static and the event route swallows its own failures, so reaching this
 * means a genuine bug; the reader gets a way forward rather than a blank page.
 */
export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="st-page">
      <p className="st-k">Something broke</p>
      <h1 className="st-t">This page didn&rsquo;t load.</h1>
      <p className="st-p">
        That&rsquo;s on us, not you. Trying again usually fixes it. If it
        keeps happening, start again from the library.
      </p>
      <div className="st-acts">
        <button type="button" className="ph-go" onClick={() => retry()}>
          Try again
        </button>
        <Link className="st-alt" href="/library">
          Go to the library
        </Link>
      </div>
    </main>
  );
}
