import { ogCard, OG_SIZE, OG_TYPE } from "@/lib/og";

export const alt = "The FirstPaper library of open-access papers";
export const size = OG_SIZE;
export const contentType = OG_TYPE;

export default function Image() {
  return ogCard({
    kicker: "The library",
    title: "Choose a paper to work through.",
    sub: "Every paper here is free and open-access.",
  });
}
