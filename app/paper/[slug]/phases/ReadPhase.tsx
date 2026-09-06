"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { Figure, Paper, Tier } from "@/lib/types";
import type { Observation } from "@/lib/observations";
import Paragraph, { type ParaState } from "../components/Paragraph";
import FigureBlock from "../components/FigureBlock";
import FigureLightbox from "../components/FigureLightbox";
import ReadingBar from "../components/ReadingBar";

/** Shortcuts, listed in the overlay and handled below. */
const KEYS: [string, string][] = [
  ["J  /  ↓", "Next paragraph"],
  ["K  /  ↑", "Previous paragraph"],
  ["Enter / Space", "Open the prompt on the focused dot"],
  ["←  /  →", "Previous / next section"],
  ["?", "Show or hide this list"],
];

/** True when focus is somewhere the reader is typing. */
function inTextField(el: Element | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    el.isContentEditable
  );
}

/**
 * Whether the device has a real pointer. Read through useSyncExternalStore so
 * it is correct on the first client paint and false during SSR.
 */
function useHoverCapable(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia("(hover: hover)");
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia("(hover: hover)").matches,
    () => false,
  );
}

/** One section at a time. The reading surface stays deliberately quiet. */
export default function ReadPhase({
  paper,
  sec,
  tier,
  onTier,
  stateFor,
  promptKey,
  onOpenPrompt,
  onSolo,
  onPeek,
  tally,
  resolvedIn,
  observations,
  nudgeTier,
  onAcceptNudge,
  onDismissNudge,
  anyResolved,
  onBack,
  onNext,
  onJumpSection,
}: {
  paper: Paper;
  sec: number;
  tier: Tier;
  onTier: (t: Tier) => void;
  stateFor: (s: number, p: number) => ParaState;
  promptKey: string | null;
  onOpenPrompt: (key: string) => void;
  onSolo: (key: string) => void;
  onPeek: (key: string) => void;
  tally: { solo: number; helped: number; skipped: number };
  resolvedIn: (s: number) => number;
  observations: Observation[];
  nudgeTier: Tier | null;
  onAcceptNudge: () => void;
  onDismissNudge: () => void;
  /** Once anything is resolved the attention pulse retires for good. */
  anyResolved: boolean;
  onBack: () => void;
  onNext: () => void;
  onJumpSection: (s: number) => void;
}) {
  const section = paper.sections[sec];
  const last = sec === paper.sections.length - 1;
  const reduce = useReducedMotion();

  const [lightbox, setLightbox] = useState<Figure | null>(null);
  const restoreTo = useRef<HTMLElement | null>(null);
  const [obsOpen, setObsOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [keysOpen, setKeysOpen] = useState(false);
  const [coachDone, setCoachDone] = useState(false);
  const [tipDone, setTipDone] = useState(false);
  const [cursor, setCursor] = useState(0);

  const dots = useRef<Map<number, HTMLButtonElement>>(new Map());
  const setDot = useCallback(
    (i: number) => (el: HTMLButtonElement | null) => {
      if (el) dots.current.set(i, el);
      else dots.current.delete(i);
    },
    [],
  );

  /* The coach-mark and the keyboard tip are first-run only, and the tip is
     pointless without a keyboard. */
  const showCoach = sec === 0 && !coachDone && !anyResolved;
  const canHover = useHoverCapable();
  const showTip = canHover && !tipDone && !anyResolved;

  /** The first still-unresolved paragraph, which is the one that pulses. */
  const pulseIdx = section.paras.findIndex(
    (_, pi) => stateFor(sec, pi) === "open",
  );

  const focusDot = useCallback((i: number) => {
    const el = dots.current.get(i);
    if (!el) return;
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    el.focus({ preventScroll: true });
  }, []);

  /* Reading-phase shortcuts. Never while the reader is typing, and never
     while the lightbox owns the keyboard. */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (lightbox || inTextField(document.activeElement)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const move = (d: number) => {
        e.preventDefault();
        const next = Math.min(
          Math.max(cursor + d, 0),
          section.paras.length - 1,
        );
        setCursor(next);
        focusDot(next);
      };

      switch (e.key) {
        case "j":
        case "J":
        case "ArrowDown":
          move(1);
          break;
        case "k":
        case "K":
        case "ArrowUp":
          move(-1);
          break;
        case "ArrowLeft":
          if (sec > 0) {
            e.preventDefault();
            onBack();
          }
          break;
        case "ArrowRight":
          e.preventDefault();
          onNext();
          break;
        case "?":
          e.preventDefault();
          setKeysOpen((v) => !v);
          break;
        case "Escape":
          setKeysOpen(false);
          setMapOpen(false);
          break;
      }
    }

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [cursor, section.paras.length, sec, lightbox, focusDot, onBack, onNext]);

  const [shownSec, setShownSec] = useState(sec);
  if (shownSec !== sec) {
    setShownSec(sec);
    setCursor(0);
    setMapOpen(false);
  }

  function openFigure(fig: Figure, from: HTMLElement | null) {
    restoreTo.current = from;
    setLightbox(fig);
  }

  function closeFigure() {
    setLightbox(null);
    restoreTo.current?.focus();
  }

  /** Jumping to an observation moves sections if it lives in another one. */
  function jumpToObservation(o: Observation) {
    setObsOpen(false);
    if (o.sec !== sec) {
      onJumpSection(o.sec);
      return;
    }
    setCursor(o.para);
    focusDot(o.para);
  }

  return (
    <div className="read">
      <ReadingBar
        paper={paper}
        sec={sec}
        tier={tier}
        onTier={onTier}
        tally={tally}
        resolvedIn={resolvedIn}
        observations={observations}
        obsOpen={obsOpen}
        onObsToggle={() => setObsOpen((v) => !v)}
        onJumpObservation={jumpToObservation}
        mapOpen={mapOpen}
        onMapToggle={() => setMapOpen((v) => !v)}
        onJumpSection={(s) => {
          setMapOpen(false);
          onJumpSection(s);
        }}
        nudgeTier={nudgeTier}
        onAcceptNudge={onAcceptNudge}
        onDismissNudge={onDismissNudge}
        showKeyTip={showTip}
        onDismissKeyTip={() => setTipDone(true)}
      />

      <div className="sheet">
        <div className="rp-col">
          <header className="rp-head">
            <div className="pp-sn-i">
              Section {sec + 1} of {paper.sections.length}
            </div>
            <h1 className="rp-t" id="phase-heading" tabIndex={-1}>
              {section.n}
            </h1>
          </header>

          {section.paras.map((para, pi) => {
            const key = `${sec}-${pi}`;
            return (
              <Paragraph
                key={key}
                ref={setDot(pi)}
                para={para}
                tier={tier}
                state={stateFor(sec, pi)}
                promptOpen={promptKey === key}
                pulse={pi === pulseIdx && !anyResolved}
                coach={
                  showCoach && pi === 0 ? (
                    <span className="coach" role="note">
                      Stuck on this paragraph? Tap the dot — but try saying it
                      in your own words first.
                      <button
                        type="button"
                        className="coach-x"
                        onClick={() => setCoachDone(true)}
                        aria-label="Dismiss tip"
                      >
                        ✕
                      </button>
                    </span>
                  ) : null
                }
                onOpenPrompt={() => {
                  setCoachDone(true);
                  onOpenPrompt(key);
                }}
                onSolo={() => onSolo(key)}
                onPeek={() => onPeek(key)}
              />
            );
          })}

          {section.figs.map((fig) => (
            <FigureBlock
              key={fig.n}
              fig={fig}
              paperTitle={paper.meta.title}
              onOpen={openFigure}
            />
          ))}

          <p className="rp-src">
            Verbatim from the paper ·{" "}
            <a href={paper.meta.url} target="_blank" rel="noopener noreferrer">
              read this section in the original
              <span aria-hidden="true"> ↗</span>
            </a>
          </p>
        </div>
      </div>

      <div className="navrow">
        <button
          type="button"
          className="btn"
          onClick={onBack}
          disabled={sec === 0}
        >
          Back
        </button>
        <button type="button" className="btn pri" onClick={onNext}>
          {last ? "Finish reading" : "Next section"}
          <span className="ic" aria-hidden="true">
            →
          </span>
        </button>
      </div>

      <FigureLightbox
        fig={lightbox}
        paperTitle={paper.meta.title}
        onClose={closeFigure}
      />

      <AnimatePresence>
        {keysOpen && (
          <motion.div
            className="keys"
            role="dialog"
            aria-label="Keyboard shortcuts"
            initial={reduce ? false : { opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.18 }}
          >
            <div className="keys-h">
              Keyboard shortcuts
              <button
                type="button"
                className="coach-x"
                onClick={() => setKeysOpen(false)}
                aria-label="Close shortcuts"
              >
                ✕
              </button>
            </div>
            <dl>
              {KEYS.map(([k, d]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{d}</dd>
                </div>
              ))}
            </dl>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
