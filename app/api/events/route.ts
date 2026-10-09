/**
 * Event intake. STUB: accepts a payload, validates its shape, stores nothing.
 *
 * It exists so the client can post events before there is anywhere to put
 * them. When a destination is added, only the marked block below changes.
 */

// Events are per-request by definition, so never cache this.
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { ok: false, error: "Body must be JSON." },
      { status: 400 },
    );
  }

  const events = Array.isArray(body) ? body : [body];
  const valid = events.every(
    (e) =>
      typeof e === "object" &&
      e !== null &&
      typeof (e as { name?: unknown }).name === "string" &&
      typeof (e as { slug?: unknown }).slug === "string",
  );

  if (!valid) {
    return Response.json(
      { ok: false, error: "Every event needs a name and a slug." },
      { status: 400 },
    );
  }

  // Nothing is persisted yet. This is where the write goes.
  return Response.json({ ok: true, received: events.length, stored: 0 });
}
