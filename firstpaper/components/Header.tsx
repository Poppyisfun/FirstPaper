import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex w-full max-w-[760px] items-center justify-between px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-ink"
        >
          First<span className="text-green">Paper</span>
        </Link>
        <nav className="flex items-center gap-5 text-sm font-medium text-ink-soft">
          <Link href="/library" className="transition-colors hover:text-ink">
            Library
          </Link>
          <Link href="/about" className="transition-colors hover:text-ink">
            About
          </Link>
        </nav>
      </div>
    </header>
  );
}
