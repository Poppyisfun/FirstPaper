/**
 * Route-level loading state. Every route is prerendered, so this only shows
 * during a client navigation on a slow connection, while the next screen's
 * payload is on its way. Quiet on purpose: a thin bar, no spinner, and the
 * label is for screen readers as much as for anyone looking.
 */
export default function RouteLoading({ label }: { label: string }) {
  return (
    <div className="st-page" role="status" aria-live="polite">
      <p className="st-k">{label}</p>
      <span className="st-bar" aria-hidden="true" />
    </div>
  );
}
