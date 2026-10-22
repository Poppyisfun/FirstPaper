import { describe, expect, it } from "vitest";
import { checkDatabase, type PingClient } from "./health";

/**
 * The keep-alive is guarding against a specific thing that already happened:
 * a paused project that every other surface reported as healthy. So the tests
 * care about two properties above all. It must really query, and it must
 * never throw, because a health check that can fail tells you nothing on the
 * day you need it.
 */

/** A client that answers however the test says, recording what was asked. */
function fakeDb(answer: { error: { message: string } | null } | Error) {
  const calls: string[] = [];
  const db: PingClient = {
    from: (table) => ({
      select: (columns) => ({
        limit: (n) => {
          calls.push(`${table}.${columns} limit ${n}`);
          if (answer instanceof Error) throw answer;
          return Promise.resolve(answer);
        },
      }),
    }),
  };
  return { db, calls };
}

describe("checkDatabase", () => {
  it("reports reachable when the query comes back clean", async () => {
    const { db } = fakeDb({ error: null });
    const report = await checkDatabase(db);

    expect(report.ok).toBe(true);
    expect(report.database).toBe("reachable");
    expect(report.error).toBeNull();
  });

  it("actually queries a table rather than answering from nothing", async () => {
    /* The whole point of the keep-alive. A check that does not round-trip
       keeps Vercel warm and lets Supabase pause underneath it. */
    const { db, calls } = fakeDb({ error: null });
    await checkDatabase(db);

    expect(calls).toHaveLength(1);
    expect(calls[0]).toBe("sessions.id limit 1");
  });

  it("reports unreachable when Postgres returns an error", async () => {
    const { db } = fakeDb({ error: { message: "relation does not exist" } });
    const report = await checkDatabase(db);

    expect(report.ok).toBe(false);
    expect(report.database).toBe("unreachable");
    expect(report.error).toBe("relation does not exist");
  });

  it("reports unreachable, and does not throw, on a network failure", async () => {
    /* This is the shape the real outage took: a paused project's host stops
       resolving and the fetch rejects rather than returning an error. */
    const { db } = fakeDb(new TypeError("fetch failed"));
    const report = await checkDatabase(db);

    expect(report.ok).toBe(false);
    expect(report.database).toBe("unreachable");
    expect(report.error).toBe("fetch failed");
  });

  it("times every check and stamps when it ran", async () => {
    const before = Date.now();
    const { db } = fakeDb({ error: null });
    const report = await checkDatabase(db);

    expect(report.ms).toBeGreaterThanOrEqual(0);
    expect(Date.parse(report.checkedAt)).toBeGreaterThanOrEqual(before);
  });

  it("reports a failure with the same fields as a success", async () => {
    /* Anything reading this endpoint should not have to branch on shape. */
    const ok = await checkDatabase(fakeDb({ error: null }).db);
    const bad = await checkDatabase(fakeDb(new Error("down")).db);

    expect(Object.keys(bad).sort()).toEqual(Object.keys(ok).sort());
  });
});
