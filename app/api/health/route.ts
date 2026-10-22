import { NextResponse } from "next/server";
import { checkDatabase } from "@/lib/health";

/**
 * The keep-alive, and the only page that will tell you the truth about the
 * database.
 *
 * A Vercel cron calls this daily (see vercel.json). The call is not a
 * formality: lib/health.ts reads a row, so Supabase registers activity and
 * does not pause the project for inactivity. That outage is the one that
 * nearly ended this — a quiet week pauses the project, the class view goes
 * blank, and if that happens while an instructor has assigned the paper,
 * there is no second chance with them.
 *
 * By eye: 200 and "reachable", or 503 and "unreachable", with the time it was
 * checked. A non-200 is deliberate, so Vercel's own cron log marks the run as
 * failed and any uptime monitor pointed here does too.
 */

export const dynamic = "force-dynamic";
// The Supabase client wants the Node runtime, as in the events route.
export const runtime = "nodejs";

export async function GET() {
  const report = await checkDatabase();

  /* Logged either way, in the shape the events intake uses, because a ping
     that fails silently is the same bug one layer up. The successful line
     matters too: it is the only positive evidence that the keep-alive ran. */
  if (report.ok) {
    console.log(`health: database reachable in ${report.ms}ms`);
  } else {
    console.error(`health: database unreachable after ${report.ms}ms: ${report.error}`);
  }

  /* The reason is logged, not published. This route is public and what an
     operator needs from it by eye is whether it answered and when. */
  return NextResponse.json(
    {
      ok: report.ok,
      database: report.database,
      checkedAt: report.checkedAt,
      ms: report.ms,
    },
    {
      status: report.ok ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
