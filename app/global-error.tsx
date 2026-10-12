"use client";

import "./globals.css";

/**
 * Replaces the root layout when the layout itself throws, so it carries its
 * own document. Plain links rather than next/link: the router may be the
 * thing that failed.
 */
export default function GlobalError({ retry }: { retry: () => void }) {
  return (
    <html lang="en">
      <body className="bg-bg text-ink">
        <title>Something broke — FirstPaper</title>
        <main className="st-page">
          <p className="st-k">Something broke</p>
          <h1 className="st-t">FirstPaper didn&rsquo;t load.</h1>
          <p className="st-p">
            That&rsquo;s on us, not you. Trying again usually fixes it.
          </p>
          <div className="st-acts">
            <button type="button" className="ph-go" onClick={() => retry()}>
              Try again
            </button>
            {/* A full page load, deliberately: the client router is part of
                what may have failed. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a className="st-alt" href="/">
              Go to the home page
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
