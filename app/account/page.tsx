import Footer from "@/components/Footer";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
import Nav from "@/components/Nav";
import { Rise } from "@/components/motion-primitives";
import { BtnLink } from "@/components/Btn";

export const metadata: Metadata = pageMetadata(
  "Account — FirstPaper",
  "Accounts are coming. Reading works without one.",
);

export default function Account() {
  return (
    <>
      <a className="skip" href="#account-body">
        Skip to content
      </a>
      <Nav active="account" />

      <main className="wrap">
        <div className="sect acct-page" id="account-body">
          <Rise>
            <div className="skick">Your account</div>
            <h1 className="stitle" id="phase-heading">
              Accounts are coming
            </h1>
            <p className="ssub">
              There is nothing to sign up for yet, and you don&rsquo;t need
              to. A whole paper works start to finish without an account, and
              your results are on the last screen.
            </p>
            <div className="acct-cta">
              <BtnLink href="/library" variant="pri lg">
                Read a paper
              </BtnLink>
            </div>
          </Rise>
        </div>
      </main>
      <Footer />
    </>
  );
}
