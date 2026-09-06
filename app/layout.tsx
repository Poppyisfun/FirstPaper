import type { Metadata } from "next";
import { Fraunces, Bricolage_Grotesque, Literata, Geist_Mono } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";

/**
 * Display — Fraunces, an old-style variable serif. SOFT rounds the terminals
 * and WONK swaps in the quirkier alternate glyphs, which is what stops the
 * headlines reading like a stock serif.
 */
const fraunces = Fraunces({
  variable: "--ff-display",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["SOFT", "WONK", "opsz"],
});

/** UI — Bricolage Grotesque. Characterful grotesque for chrome and labels. */
const bricolage = Bricolage_Grotesque({
  variable: "--ff-ui",
  subsets: ["latin"],
  axes: ["opsz", "wdth"],
});

/** Reading — Literata, drawn for long-form screen reading. Paper text only. */
const literata = Literata({
  variable: "--ff-reading",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
});

/** Data — Geist Mono for eyebrows, tags, XP chips, and numeric readouts. */
const geistMono = Geist_Mono({
  variable: "--ff-data",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FirstPaper",
  description:
    "FirstPaper teaches teenagers to read and critically judge real scientific papers, section by section.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${bricolage.variable} ${literata.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-bg font-sans text-ink">
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
