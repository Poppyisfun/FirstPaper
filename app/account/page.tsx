import type { Metadata } from "next";
import Nav from "@/components/Nav";
import { Rise } from "@/components/motion-primitives";
import { BtnLink } from "@/components/Btn";

export const metadata: Metadata = {
  title: "Account — FirstPaper",
  description:
    "Accounts are coming. Soon you will be able to keep your XP, see every paper you have read, and get suggestions based on what you are interested in.",
};

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
              Right now your progress lives in this session. Soon you will be
              able to create an account, keep your XP, see every paper you have
              read, and get suggestions based on what you are interested in.
            </p>
            <div className="acct-cta">
              <BtnLink href="/library" variant="pri lg" icon="→">
                Read a paper for now
              </BtnLink>
            </div>
          </Rise>
        </div>
      </main>
    </>
  );
}
