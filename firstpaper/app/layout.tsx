import type { Metadata } from "next";
import {
  Space_Grotesk,
  Newsreader,
  Instrument_Serif,
  JetBrains_Mono,
} from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";

// UI — all interface chrome: nav, buttons, labels.
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

// Reading — paper excerpts and "Read" explanations only.
const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

// Display — hero headlines and section titles.
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

// Labels/data — eyebrows, tags, HUD chips, mono data readouts.
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
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
      className={`${spaceGrotesk.variable} ${newsreader.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-bg font-sans text-ink">
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
