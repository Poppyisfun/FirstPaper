import Footer from "@/components/Footer";

/**
 * The marketing surfaces, which keep the footer.
 *
 * It used to sit in the root layout and therefore on the reading screens too,
 * where the licence line duplicated the one inside the explanation panel and
 * the credit line was the only thing on the page selling anything.
 */
export default function MarketingLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <>
      <div>{children}</div>
      <Footer />
    </>
  );
}
