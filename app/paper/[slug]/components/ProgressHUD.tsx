"use client";

import { useEffect, useRef, useState } from "react";

type Fly = { id: number; text: string };

/** Shows a floating +N / −N once, then clears it. */
function useDelta(value: number) {
  const prev = useRef(value);
  const [fly, setFly] = useState<Fly | null>(null);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const diff = value - prev.current;
    prev.current = value;
    if (diff === 0) return;

    const id = Date.now() + Math.random();
    setFly({ id, text: diff > 0 ? `+${diff}` : `${diff}` });
    setPulse(true);

    const a = setTimeout(() => setFly(null), 1000);
    const b = setTimeout(() => setPulse(false), 520);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, [value]);

  return { fly, pulse };
}

/**
 * The nav-bar HUD: where you are, what you've banked. Lives in the Nav's hud
 * slot and is only mounted on the paper route.
 */
export default function ProgressHUD({
  label,
  pct,
  xp,
  bonus,
}: {
  label: string;
  pct: number;
  xp: number;
  bonus: number;
}) {
  const xpD = useDelta(xp);
  const bonusD = useDelta(bonus);

  return (
    <>
      <div className="hbar">
        <div className="hlbl">{label}</div>
        <div
          className="bar"
          role="progressbar"
          aria-valuenow={Math.round(pct)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progress through this paper"
        >
          <i style={{ width: `${pct}%` }} />
        </div>
      </div>

      <span className={bonusD.pulse ? "chip bon pulse" : "chip bon"}>
        &#9670; <span>{bonus}</span> bonus
        {bonusD.fly && (
          <span className="fly" key={bonusD.fly.id}>
            {bonusD.fly.text}
          </span>
        )}
      </span>

      <span className={xpD.pulse ? "chip xp pulse" : "chip xp"}>
        &#9670; <span>{xp}</span> XP
        {xpD.fly && (
          <span className="fly" key={xpD.fly.id}>
            {xpD.fly.text}
          </span>
        )}
      </span>
    </>
  );
}
