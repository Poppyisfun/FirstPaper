/**
 * Anonymous learning events.
 *
 * Two destinations, deliberately. Every event is appended to a session-local
 * log in sessionStorage, which is what the results screen derives from, and
 * every event is also posted to /api/events for whatever durable store sits
 * behind that route.
 *
 * The local log exists because scoring must work for a reader with no account
 * and no network. It is not a cache of the server's data: it is the record of
 * this session, and the results screen reads it directly. When the route
 * starts persisting, nothing here changes.
 *
 * Whatever lands behind the route must stay anonymous. FirstPaper records how
 * reading goes, never who did the reading.
 */

export type EventName =
  | "paper_started"
  | "paragraph_resolved"
  | "section_completed"
  /* Replaces explanation_requested as the difficulty signal. Whether a reader
     could predict a paragraph before reading our explanation says more about
     how hard that paragraph is than whether they asked for help, which only
     ever measured how willing they were to spend. */
  | "prediction_made"
  | "confidence_stated"
  | "check_answered"
  | "judge_answered"
  | "paper_completed";

export type EventProps = Record<string, string | number | boolean | null>;

export type PaperEvent = {
  name: EventName;
  /** Which paper the event belongs to. */
  slug: string;
  /** Milliseconds since the epoch, set when the event is recorded. */
  at?: number;
  /** Event-specific payload. Keep it small and non-identifying. */
  props?: EventProps;
};

const LOG_KEY = "firstpaper:events";
/** Posts are batched; nothing on screen waits for the network. */
const FLUSH_MS = 4000;

let pending: PaperEvent[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;

/** Every event this session has recorded, oldest first. */
export function readLog(slug?: string): PaperEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(LOG_KEY);
    if (!raw) return [];
    const all = JSON.parse(raw) as PaperEvent[];
    return slug ? all.filter((e) => e.slug === slug) : all;
  } catch {
    /* Private windows and blocked site data both land here. A reader with no
       storage still gets a working flow; they just get no results. */
    return [];
  }
}

/** Clears this session's log. Used when a reader restarts a paper. */
export function clearLog(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(LOG_KEY);
  } catch {
    /* Nothing to clear if storage is unavailable. */
  }
}

function append(event: PaperEvent): void {
  if (typeof window === "undefined") return;
  try {
    const all = readLog();
    all.push(event);
    window.sessionStorage.setItem(LOG_KEY, JSON.stringify(all));
  } catch {
    /* Storage full or unavailable. The flow continues without the record. */
  }
}

async function flush(): Promise<void> {
  if (pending.length === 0) return;
  const batch = pending;
  pending = [];
  try {
    await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(batch),
      keepalive: true,
    });
  } catch {
    /* Silent by design. A reader must never see an analytics failure, and a
       dropped batch costs nothing: the session log is what scoring reads. */
  }
}

function schedule(): void {
  if (timer) return;
  timer = setTimeout(() => {
    timer = null;
    void flush();
  }, FLUSH_MS);
}

/**
 * Records one event. Resolves immediately: the write is local and the post is
 * batched, so no call site ever waits on the network.
 */
export async function track(event: PaperEvent): Promise<void> {
  const stamped: PaperEvent = { ...event, at: event.at ?? Date.now() };
  append(stamped);
  pending.push(stamped);
  schedule();
}

/** Records several events in order. Same contract as track(). */
export async function trackAll(events: PaperEvent[]): Promise<void> {
  for (const event of events) await track(event);
}

/** Sends anything still queued. Called when a phase ends. */
export async function flushNow(): Promise<void> {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  await flush();
}
