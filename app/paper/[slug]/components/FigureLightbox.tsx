"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { Figure } from "@/lib/types";

const MIN = 1;
const MAX = 6;
const clamp = (v: number, lo: number, hi: number) =>
  v < lo ? lo : v > hi ? hi : v;

/**
 * Full-screen figure viewer.
 *
 * These are multi-panel scientific plates: at the inline width the panel
 * letters and axis labels are illegible, which makes the "how to read it"
 * explainer impossible to follow. Here the image is zoomable and pannable with
 * the caption and explainer alongside, so the guidance can be read against the
 * detail it describes.
 */
export default function FigureLightbox({
  fig,
  paperTitle,
  onClose,
}: {
  fig: Figure | null;
  paperTitle: string;
  onClose: () => void;
}) {
  const reduce = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);

  // Active pointers, so one finger pans and two pinch.
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStart = useRef<{ dist: number; scale: number } | null>(null);
  const panStart = useRef<{ x: number; y: number; tx: number; ty: number } | null>(
    null,
  );

  const reset = useCallback(() => {
    setScale(1);
    setTx(0);
    setTy(0);
  }, []);

  /* A different figure starts fresh. Adjusting state during render is the
     documented alternative to a reset effect and avoids a second paint. */
  const [shownSrc, setShownSrc] = useState<string | null>(fig?.src ?? null);
  if ((fig?.src ?? null) !== shownSrc) {
    setShownSrc(fig?.src ?? null);
    setScale(1);
    setTx(0);
    setTy(0);
  }

  /* Esc closes; Tab is trapped inside the dialog. */
  useEffect(() => {
    if (!fig) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;

      const root = panelRef.current;
      if (!root) return;
      const items = root.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (!items.length) return;

      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [fig, onClose]);

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    setScale((s) => clamp(s * (e.deltaY < 0 ? 1.12 : 1 / 1.12), MIN, MAX));
  }

  function onPointerDown(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinchStart.current = {
        dist: Math.hypot(a.x - b.x, a.y - b.y),
        scale,
      };
      panStart.current = null;
    } else if (pointers.current.size === 1) {
      panStart.current = { x: e.clientX, y: e.clientY, tx, ty };
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2 && pinchStart.current) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      setScale(
        clamp(
          (pinchStart.current.scale * dist) / pinchStart.current.dist,
          MIN,
          MAX,
        ),
      );
      return;
    }

    if (panStart.current && scale > 1) {
      setTx(panStart.current.tx + (e.clientX - panStart.current.x));
      setTy(panStart.current.ty + (e.clientY - panStart.current.y));
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchStart.current = null;
    if (pointers.current.size === 0) panStart.current = null;
  }

  return (
    <AnimatePresence>
      {fig && (
        <motion.div
          className="lb"
          role="dialog"
          aria-modal="true"
          aria-label={`Figure ${fig.n}, enlarged`}
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduce ? undefined : { opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <div className="lb-panel" ref={panelRef}>
            <div className="lb-bar">
              <span className="lb-n">Figure {fig.n}</span>
              <div className="lb-zoom">
                <button
                  type="button"
                  className="lb-b"
                  onClick={() => setScale((s) => clamp(s / 1.3, MIN, MAX))}
                  aria-label="Zoom out"
                >
                  −
                </button>
                <span className="lb-pct" aria-live="polite">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  type="button"
                  className="lb-b"
                  onClick={() => setScale((s) => clamp(s * 1.3, MIN, MAX))}
                  aria-label="Zoom in"
                >
                  +
                </button>
                <button type="button" className="lb-b" onClick={reset}>
                  Reset
                </button>
              </div>
              <button
                type="button"
                className="lb-x"
                onClick={onClose}
                ref={closeRef}
                aria-label="Close enlarged figure"
              >
                ✕
              </button>
            </div>

            <div
              className="lb-stage"
              onWheel={onWheel}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              style={{ cursor: scale > 1 ? "grab" : "zoom-in" }}
            >
              <Image
                src={fig.src}
                alt={`Figure ${fig.n} from ${paperTitle}`}
                width={1400}
                height={1000}
                draggable={false}
                style={{
                  transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
                  transformOrigin: "center center",
                  transition: reduce ? "none" : "transform .12s linear",
                }}
              />
            </div>

            <div className="lb-read">
              {/* The authors' caption, verbatim. */}
              <div
                className="lb-cap"
                dangerouslySetInnerHTML={{ __html: fig.cap }}
              />
              {/* FirstPaper's explainer — ours, kept visually separate. */}
              <div
                className="lb-x"
                dangerouslySetInnerHTML={{ __html: fig.x }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
