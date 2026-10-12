import { ogCard, OG_SIZE, OG_TYPE } from "@/lib/og";

export const alt = "FirstPaper — read real research papers and judge whether to trust them";
export const size = OG_SIZE;
export const contentType = OG_TYPE;

export default function Image() {
  return ogCard({
    kicker: "Read real science",
    title: "Read any research paper. Understand it. Know if you can trust it.",
  });
}
