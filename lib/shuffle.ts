/**
 * Deterministic option shuffling, seeded per session.
 *
 * Options must not sit in a fixed order: a reader who notices the correct
 * answer keeps turning up in the same place stops reading the options at all.
 * Shuffling per render would be worse than a fixed order, because then the
 * options would move under them on every reload.
 *
 * This is the second line of defence, not the only one. The authored files
 * spread their correct answers across positions as well, because shuffling
 * only protects what the browser renders — server output, a no-JS fallback
 * or an export reads the file in order.
 *
 * So the order is a pure function of (session seed, item key). One reader sees
 * a stable order across reloads; two readers see different orders; and the
 * order carries no information about which option is correct.
 *
 * The seed lives in sessionStorage for now. When the anonymous id cookie
 * lands with event logging, that id becomes the seed instead, so the order is
 * stable across tabs as well.
 */

import { useSyncExternalStore } from "react";

const SEED_KEY = "firstpaper:seed";

/** One value per page load, so the fallback seed cannot change under a render. */
let cachedSeed: string | null = null;

/** A 32-bit hash of a string. Not cryptographic; it only has to spread. */
function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32. Small, fast, and good enough to order three items. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * This browser session's seed, created on first use.
 *
 * Storage can throw — private windows, blocked site data — so a failure falls
 * back to a per-load value. The reader still gets a sensible order; it just
 * will not survive a reload.
 */
export function sessionSeed(): string {
  if (cachedSeed) return cachedSeed;
  cachedSeed = readOrCreateSeed();
  return cachedSeed;
}

function readOrCreateSeed(): string {
  try {
    const existing = window.sessionStorage.getItem(SEED_KEY);
    if (existing) return existing;
    const fresh = Math.random().toString(36).slice(2, 12);
    window.sessionStorage.setItem(SEED_KEY, fresh);
    return fresh;
  } catch {
    return Math.random().toString(36).slice(2, 12);
  }
}

/**
 * A copy of `items` ordered by the seed. Fisher-Yates, so every permutation
 * is equally likely and the input is never mutated.
 */
export function shuffleWithSeed<T>(items: readonly T[], seed: string): T[] {
  const out = [...items];
  const next = rng(hash(seed));
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const noSubscribe = () => () => {};

/**
 * The session seed as a hook. Null during server render and hydration, the
 * seed afterwards: options are ordered in the browser only, so the server and
 * the first client render agree, and callers show a placeholder while null.
 */
export function useSessionSeed(): string | null {
  return useSyncExternalStore(noSubscribe, sessionSeed, () => null);
}
