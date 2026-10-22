import { createSupabaseServerClient } from "@/lib/supabase";

/**
 * Does the database actually answer?
 *
 * This exists because of a real outage, not as a formality. Supabase pauses a
 * project after a quiet week. When it did, every surface still looked healthy:
 * POST /api/events returned 200 because the intake fails silently for the
 * reader by design, GET returned an empty list that is indistinguishable from
 * a new reader, and the class view said it could not load, which reads like a
 * blip. Nothing was written for days and nothing said so.
 *
 * So the check has one rule: it must ROUND-TRIP TO POSTGRES. A route that
 * answers 200 without touching the database keeps Vercel warm and lets
 * Supabase pause underneath it, which is the same failure wearing a health
 * check's clothes.
 */

/**
 * The narrow slice of the Supabase client this module uses.
 *
 * Declared rather than imported so a test can supply a stand-in without a
 * mocking framework, the same way lib/aggregate.ts does.
 */
export type PingClient = {
  from: (table: string) => {
    select: (columns: string) => {
      limit: (n: number) => PromiseLike<{
        error: { message: string } | null;
      }>;
    };
  };
};

export type HealthReport = {
  /** True only when Postgres answered without an error. */
  ok: boolean;
  database: "reachable" | "unreachable";
  /** When the check ran, ISO 8601. */
  checkedAt: string;
  /** Round-trip time in milliseconds. */
  ms: number;
  /**
   * Why it failed, for the server log only.
   *
   * The route never puts this in the response. /api/health is public, and
   * what an operator needs by eye is whether it is reachable and when; the
   * reason belongs in the log beside the intake's own failures.
   */
  error: string | null;
};

/** The table to touch. The smallest one, and it always exists. */
const PING_TABLE = "sessions";

/**
 * Reads one id. Deliberately the cheapest query that is still a query: it
 * crosses the network, authenticates, and makes Postgres do work, which is
 * what keeps the project marked active.
 *
 * Never throws. A health check that can fail is not one.
 */
export async function checkDatabase(db?: PingClient): Promise<HealthReport> {
  const startedAt = Date.now();
  const finish = (error: string | null): HealthReport => ({
    ok: error === null,
    database: error === null ? "reachable" : "unreachable",
    checkedAt: new Date().toISOString(),
    ms: Date.now() - startedAt,
    error,
  });

  try {
    const client =
      db ?? (createSupabaseServerClient() as unknown as PingClient);
    const { error } = await client.from(PING_TABLE).select("id").limit(1);
    /* Two shapes of failure reach here. A network error (a paused project
       resolves to nothing at all) and a PostgREST error (a dropped table, a
       rejected key) arrive as `error`; anything else throws. Both mean the
       same thing to an operator, so both land in the same report. */
    return finish(error ? error.message : null);
  } catch (err) {
    return finish(err instanceof Error ? err.message : String(err));
  }
}
