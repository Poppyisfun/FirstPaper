/**
 * Analytics events. STUB: nothing is sent anywhere yet.
 *
 * The shape is here so call sites can be written now and wired up later,
 * without every one of them changing when a transport appears. Whatever lands
 * behind this must stay anonymous: FirstPaper records how reading goes, never
 * who did the reading.
 */

export type EventName =
  | "paper_started"
  | "paragraph_resolved"
  | "section_completed"
  | "check_answered"
  | "judge_answered"
  | "paper_completed";

export type PaperEvent = {
  name: EventName;
  /** Which paper the event belongs to. */
  slug: string;
  /** Anonymous per-session id. Never a user id. */
  anonId?: string;
  /** Event-specific payload. Keep it small and non-identifying. */
  props?: Record<string, string | number | boolean | null>;
};

/**
 * Records one event. Currently a no-op that resolves immediately, so callers
 * can already await it and nothing changes when a real transport arrives.
 */
export async function track(event: PaperEvent): Promise<void> {
  void event;
}

/** Records several events in order. Same no-op contract as track(). */
export async function trackAll(events: PaperEvent[]): Promise<void> {
  void events;
}
