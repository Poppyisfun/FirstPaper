import Link from "next/link";
import type { ReactNode } from "react";

type NavProps = {
  /** Dark treatment — used on landing and paper pages, light everywhere else. */
  dark?: boolean;
  /** Which nav link reads as current. */
  active?: "library" | "about" | "start";
  /** Paper-page HUD (progress bar, XP/bonus chips) rendered in place of the links. */
  hud?: ReactNode;
};

export default function Nav({ dark = false, active, hud }: NavProps) {
  return (
    <nav className={dark ? "nav dark" : "nav"}>
      <div className="nav-in">
        <Link className="brand" href="/">
          First<span className="p">Paper</span>
        </Link>
        {hud ? (
          <div className="hud on">{hud}</div>
        ) : (
          <div className="nav-links">
            <Link
              className={active === "library" ? "nlink on" : "nlink"}
              href="/library"
            >
              Library
            </Link>
            <Link
              className={active === "about" ? "nlink on" : "nlink"}
              href="/about"
            >
              About
            </Link>
            <Link
              className={active === "start" ? "nlink on" : "nlink"}
              href="/library"
            >
              Start reading
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
