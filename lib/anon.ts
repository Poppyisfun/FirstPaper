/**
 * The anonymous reader id.
 *
 * FirstPaper records how reading goes, never who did the reading. This id
 * exists only to tie one person's events together across a paper so the
 * numbers mean something; it is a random uuid with nothing derived from the
 * reader in it, and it is never shown to them or sent to the browser's
 * JavaScript.
 *
 * The cookie is httpOnly so page scripts cannot read it, secure so it is
 * only ever sent over TLS, and sameSite "lax" so it survives a normal
 * navigation into the site without riding along on cross-site requests.
 */

export const ANON_COOKIE = "fp_anon";

/** A year. Long enough that a reader returning next term is still one reader. */
export const ANON_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * Cookie options.
 *
 * `secure: true` holds in local development too: browsers treat localhost as
 * a trustworthy origin and accept secure cookies over plain http there. The
 * failure this avoids is the other direction — a cookie set without `secure`
 * is rejected outright in production, and the symptom is events that log
 * locally and silently stop working once deployed.
 */
export const ANON_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  path: "/",
  maxAge: ANON_MAX_AGE,
} as const;

/** The three reading levels, for validating what arrives from the client. */
const LEVELS = new Set(["explorer", "reader", "critic"]);

/** Narrows an arbitrary value to a level, defaulting rather than throwing. */
export function asLevel(value: unknown): string {
  return typeof value === "string" && LEVELS.has(value) ? value : "reader";
}
