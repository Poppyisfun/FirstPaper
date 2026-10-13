import Footer from "@/components/Footer";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
import Nav from "@/components/Nav";
import { Rise } from "@/components/motion-primitives";
import { BtnLink } from "@/components/Btn";

export const metadata: Metadata = pageMetadata(
  "Account — FirstPaper",
  "Accounts are coming. Soon you will be able to keep your XP, see every paper you have read, and get suggestions based on what you are interested in.",
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
              There is nothing to sign up for yet, and nothing you are
              missing: a whole paper works start to finish without an account,
              and you get your full results at the end. What an account will
              add later is memory across papers — your XP carried forward, a
              record of what you have read, and suggestions based on it.
            </p>
            <div className="acct-cta">
              <BtnLink href="/library" variant="pri lg" icon="→">
                Read a paper for now
              </BtnLink>
            </div>
          </Rise>
        </div>
      </main>
      <Footer />
    </>
  );
}
