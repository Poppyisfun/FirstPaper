"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { Paper, Tier } from "@/lib/types";
import type { Observation } from "@/lib/observations";
import TierDial, { TIERS } from "./TierDial";
import ObservationsPanel from "./ObservationsPanel";

const EZ = [0.22, 1, 0.36, 1] as const;

/**
 * The sticky bar above the reading sheet: reading level, section map, the
 * observations counter and the running tally, plus the two things that only
 * appear when earned — the level nudge and the keyboard tip.
 */
export default function ReadingBar({
  paper,
  sec,
  tier,
  onTier,
  tally,
  resolvedIn,
  observations,
  obsOpen,
  onObsToggle,
  onJumpObservation,
  mapOpen,
  onMapToggle,
  onJumpSection,
  nudgeTier,
  onAcceptNudge,
  onDismissNudge,
  showKeyTip,
  onDismissKeyTip,
}: {
  paper: Paper;
  sec: number;
  tier: Tier;
  onTier: (t: Tier) => void;
  tally: { solo: number; helped: number; skipped: number };
  /** Resolved count for a section, for the map rows. */
  resolvedIn: (s: number) => number;
  observations: Observation[];
  obsOpen: boolean;
  onObsToggle: () => void;
  onJumpObservation: (o: Observation) => void;
  mapOpen: boolean;
  onMapToggle: () => void;
  onJumpSection: (s: number) => void;
  /** The level being offered, or null when no nudge is due. */
  nudgeTier: Tier | null;
  onAcceptNudge: () => void;
  onDismissNudge: () => void;
  showKeyTip: boolean;
  onDismissKeyTip: () => void;
}) {
  const reduce = useReducedMotion();
  const nudgeName = TIERS.find((t) => t.k === nudgeTier)?.nm ?? "Explorer";

  const pop = reduce
    ? {}
    : {
        initial: { opacity: 0, y: -6 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -6 },
        transition: { duration: 0.26, ease: EZ },
      };

  return (
    <div className="rp-barwrap">
      <div className="rp-bar">
        <TierDial tier={tier} onChange={onTier} size="compact" idPrefix="read" />

        <button
          type="button"
          className={mapOpen ? "bar-b on" : "bar-b"}
          onClick={onMapToggle}
          aria-expanded={mapOpen}
          aria-controls="section-map"
        >
          Section {sec + 1}/{paper.sections.length}
          <span aria-hidden="true"> ▾</span>
        </button>

        <button
          type="button"
          className={obsOpen ? "bar-b obs-chip on" : "bar-b obs-chip"}
          onClick={onObsToggle}
          aria-expanded={obsOpen}
          disabled={observations.length === 0}
        >
          &#9670; {observations.length} observation
          {observations.length === 1 ? "" : "s"}
        </button>

        <p className="rp-tally" aria-live="polite">
          {tally.solo} solo · {tally.helped} helped · {tally.skipped} skipped
        </p>
      </div>

      {/* Section map — a dropdown, so it never permanently eats bar width. */}
      <AnimatePresence initial={false}>
        {mapOpen && (
          <motion.div className="smap" id="section-map" {...pop}>
            <ul>
              {paper.sections.map((s, i) => {
                const done = resolvedIn(i);
                return (
                  <li key={s.n}>
                    <button
                      type="button"
                      className={i === sec ? "smap-r on" : "smap-r"}
                      aria-current={i === sec ? "true" : undefined}
                      onClick={() => onJumpSection(i)}
                    >
                      <span className="smap-i">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="smap-n">{s.n}</span>
                      <span className="smap-c">
                        {done}/{s.paras.length}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      <ObservationsPanel
        open={obsOpen}
        items={observations}
        onClose={onObsToggle}
        onJump={onJumpObservation}
      />

      {/* Offered only after three reveals in a row, and never auto-applied. */}
      <AnimatePresence initial={false}>
        {nudgeTier && (
          <motion.div className="nudge" role="status" {...pop}>
            <p>
              This section is dense. Want to switch to {nudgeName} level? The
              paper text stays exactly the same — only the explanations get
              simpler.
            </p>
            <div className="nudge-row">
              <button type="button" className="tb solo" onClick={onAcceptNudge}>
                Switch to {nudgeName}
              </button>
              <button type="button" className="tb" onClick={onDismissNudge}>
                No thanks
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {showKeyTip && (
          <motion.p className="keytip" {...pop}>
            Tip: press J and K to move between paragraphs
            <button
              type="button"
              className="keytip-x"
              onClick={onDismissKeyTip}
              aria-label="Dismiss keyboard tip"
            >
              ✕
            </button>
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
