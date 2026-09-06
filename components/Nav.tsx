import Link from "next/link";
import type { ReactNode } from "react";

type NavProps = {
  /** Dark treatment — used on landing and paper pages, light everywhere else. */
  dark?: boolean;
  /** Which nav link reads as current. */
  active?: "library" | "about";
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
          <>
            <div className="nav-links">
              <Link
                className={`nlink hide-xs${active === "library" ? " on" : ""}`}
                href="/library"
                aria-current={active === "library" ? "page" : undefined}
              >
                <span>Library</span>
              </Link>
              <Link
                className={`nlink${active === "about" ? " on" : ""}`}
                href="/about"
                aria-current={active === "about" ? "page" : undefined}
              >
                <span>About</span>
              </Link>
            </div>
            <Link className="ncta" href="/library">
              <span className="lbl">Start reading</span>
              <span className="ic" aria-hidden="true">
                →
              </span>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
