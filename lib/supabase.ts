import { createBrowserClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase clients, split by which key they carry.
 *
 * This project uses the current Supabase key format: a publishable key and a
 * secret key. The older pair of key names does not exist here and must not be
 * introduced.
 *
 *   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY  safe in the browser, respects RLS
 *   SUPABASE_SECRET_KEY                   server only, BYPASSES RLS entirely
 *
 * Both live here because they are two halves of one concern, but they are
 * deliberately separate factories: nothing reads the secret key until the
 * server factory is actually called.
 *
 * There are no default values anywhere in this file. A variable that is
 * missing, blank, or still carrying its placeholder throws by name.
 */

/** Values shipped as examples. Treated as absent so they fail fast. */
const PLACEHOLDER = /yourproject\.supabase\.co|xxxxx/;

/**
 * Reads one variable, or throws naming it. Refusing placeholders matters as
 * much as refusing blanks: a placeholder otherwise sails through and surfaces
 * much later as a DNS or auth failure that looks like a code bug.
 */
function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value || !value.trim()) {
    throw new Error(
      `${name} is not set. Add it to .env.local in the project root, then restart the server.`,
    );
  }

  if (PLACEHOLDER.test(value)) {
    throw new Error(
      `${name} still holds its placeholder value. Replace it in .env.local with the real value from your Supabase dashboard, then restart the server.`,
    );
  }

  return value;
}

/** Masks a value for logging. Never returns more than the first few characters. */
export function maskSecret(value: string | undefined): string {
  if (!value) return "(not set)";
  if (value.length <= 12) return `${value.slice(0, 3)}${"*".repeat(6)}`;
  return `${value.slice(0, 8)}${"*".repeat(10)}${value.slice(-4)}`;
}

/**
 * What the server can see, for diagnostics. Masked, and it reports whether a
 * value is real rather than what it is.
 */
export function describeEnv() {
  const names = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_SECRET_KEY",
  ] as const;

  return Object.fromEntries(
    names.map((name) => {
      const raw = process.env[name];
      return [
        name,
        {
          present: Boolean(raw && raw.trim()),
          isPlaceholder: Boolean(raw && PLACEHOLDER.test(raw)),
          length: raw?.length ?? 0,
          masked: maskSecret(raw),
        },
      ];
    }),
  );
}

/**
 * Browser client. Carries the publishable key, so every query is still subject
 * to row-level security and the key appearing in the bundle is by design.
 *
 * Call this from client components. Cookie handling comes from @supabase/ssr,
 * so an authenticated session is picked up automatically once auth exists.
 */
export function createSupabaseBrowserClient(): SupabaseClient {
  return createBrowserClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
  );
}

/**
 * Server client. Carries the secret key, which bypasses row-level security and
 * can read and write every row in the project. Only ever call this from a
 * route handler, a server action, or a server component.
 *
 * Two things keep the key off the client. Next.js only inlines variables
 * prefixed NEXT_PUBLIC_, so an unprefixed secret compiles to undefined in
 * browser bundles rather than leaking. The guard below then turns that silent
 * undefined into a loud failure if this is ever reached from the browser.
 *
 * There is no session to persist: the key is the authorisation, so token
 * refresh and storage are switched off.
 */
export function createSupabaseServerClient(): SupabaseClient {
  if (typeof window !== "undefined") {
    throw new Error(
      "createSupabaseServerClient() was called in the browser. It carries the " +
        "secret key and must only run on the server.",
    );
  }

  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SECRET_KEY"),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}
