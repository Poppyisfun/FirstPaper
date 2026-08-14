export default function Footer() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto w-full max-w-[760px] px-4 py-5 text-center text-sm text-ink-soft sm:px-6 sm:text-left">
        Teaching teens to read and judge real science, sourced from{" "}
        <a
          href="https://www.ncbi.nlm.nih.gov/pmc/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-ink"
        >
          PubMed Central
        </a>{" "}
        and{" "}
        <a
          href="https://www.biorxiv.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-ink"
        >
          bioRxiv
        </a>
        . <a href="#" className="underline underline-offset-2 hover:text-ink">Send feedback</a>
      </div>
    </footer>
  );
}
