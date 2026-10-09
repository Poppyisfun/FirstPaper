import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { ANON_COOKIE, ANON_COOKIE_OPTIONS, asLevel } from "@/lib/anon";
import { createSupabaseServerClient } from "@/lib/supabase";

/**
 * Event intake.
 *
 * The browser posts batches here and this route writes them to Postgres with
 * the secret key. That is the only path: the browser never queries Supabase,
 * so RLS can stay on with no policies and the access rules live here, in one
 * readable place.
 *
 * Supabase is the durable record, not the render path. The results screen
 * derives its numbers from the reader's own session log in the browser, so a
 * reader with no account, a slow connection, or no connection at all still
 * finishes their paper and sees their calibration. Nothing on screen waits on
 * this route, and nothing on screen breaks when it fails.
 *
 * Which is why every failure here is swallowed. A reader must never be shown
 * an analytics error, and a dropped batch costs us a row, not their work.
 */

// Events are per-request by definition, so never cache this.
export const dynamic = "force-dynamic";
// node:crypto and the Supabase client both want the Node runtime.
export const runtime = "nodejs";

/** What the client sends. Validated before anything touches the database. */
type IncomingEvent = {
  name: string;
  slug: string;
  at?: number;
  props?: Record<string, unknown>;
};

/** Columns on `events` that are promoted out of the payload blob. */
const PROMOTED = new Set(["paragraph_id", "question_id", "ms"]);

function isEvent(value: unknown): value is IncomingEvent {
  if (typeof value !== "object" || value === null) return false;
  const e = value as Record<string, unknown>;
  return typeof e.name === "string" && typeof e.slug === "string";
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function integer(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.round(value)
    : null;
}

/**
 * The session row for this reader and paper, creating it if absent.
 *
 * One row per reader per paper rather than per sitting. The table has no
 * column that could distinguish two sittings, and adding one would mean a
 * third table or a schema change; tying a reader's events to the paper they
 * belong to is what the numbers actually need.
 */
async function sessionIdFor(
  db: ReturnType<typeof createSupabaseServerClient>,
  anonId: string,
  slug: string,
  level: string,
): Promise<string | null> {
  const existing = await db
    .from("sessions")
    .select("id")
    .eq("anon_id", anonId)
    .eq("paper_slug", slug)
    .limit(1)
    .maybeSingle();

  if (existing.data?.id) return existing.data.id as string;

  const created = await db
    .from("sessions")
    .insert({
      anon_id: anonId,
      paper_slug: slug,
      level,
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (created.error) {
    /* Two batches can race here and both try to create the session. Rather
       than a unique constraint we do not control, re-read: whichever insert
       won, the row now exists. */
    const retry = await db
      .from("sessions")
      .select("id")
      .eq("anon_id", anonId)
      .eq("paper_slug", slug)
      .limit(1)
      .maybeSingle();
    return (retry.data?.id as string) ?? null;
  }

  return created.data.id as string;
}

/** Writes one batch. Returns how many rows landed. */
async function persist(
  events: IncomingEvent[],
  anonId: string,
): Promise<number> {
  const db = createSupabaseServerClient();

  /* Group by paper so each slug resolves its session once, however many
     events the batch carries. */
  const bySlug = new Map<string, IncomingEvent[]>();
  for (const event of events) {
    const list = bySlug.get(event.slug) ?? [];
    list.push(event);
    bySlug.set(event.slug, list);
  }

  let stored = 0;

  for (const [slug, group] of bySlug) {
    const level = asLevel(
      group.find((e) => e.props?.level !== undefined)?.props?.level,
    );
    const sessionId = await sessionIdFor(db, anonId, slug, level);
    if (!sessionId) continue;

    const rows = group.map((event) => {
      const props = event.props ?? {};
      const payload: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(props)) {
        if (!PROMOTED.has(key)) payload[key] = value;
      }

      return {
        session_id: sessionId,
        type: event.name,
        paragraph_id: text(props.paragraph_id),
        question_id: text(props.question_id),
        ms: integer(props.ms),
        payload,
        created_at: new Date(
          typeof event.at === "number" ? event.at : Date.now(),
        ).toISOString(),
      };
    });

    const { error } = await db.from("events").insert(rows);
    if (!error) stored += rows.length;

    /* A finished paper closes its session. Best effort: the events are the
       record, and completed_at is a convenience for querying. */
    if (group.some((e) => e.name === "paper_completed")) {
      await db
        .from("sessions")
        .update({ completed_at: new Date().toISOString() })
        .eq("id", sessionId);
    }
  }

  return stored;
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Body must be JSON." },
      { status: 400 },
    );
  }

  const incoming = Array.isArray(body) ? body : [body];
  if (!incoming.every(isEvent)) {
    return NextResponse.json(
      { ok: false, error: "Every event needs a name and a slug." },
      { status: 400 },
    );
  }

  /* The id is minted here, never in the browser. A client-supplied id could
     be set to anything, including another reader's. */
  const cookie = request.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${ANON_COOKIE}=`));
  const existingAnonId = cookie?.slice(ANON_COOKIE.length + 1) || null;
  const anonId = existingAnonId ?? randomUUID();

  let stored = 0;
  try {
    stored = await persist(incoming, anonId);
  } catch {
    /* Swallowed on purpose. Misconfigured keys, a database outage, a schema
       drift: none of it is the reader's problem, and none of it may reach
       their screen or stop them finishing the paper. */
  }

  const response = NextResponse.json({
    ok: true,
    received: incoming.length,
    stored,
  });

  if (!existingAnonId) {
    response.cookies.set(ANON_COOKIE, anonId, ANON_COOKIE_OPTIONS);
  }

  return response;
}
