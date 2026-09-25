import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * content/ingest is the Python that generates paper JSON. Nothing in the app
   * imports it, so it would not be bundled anyway, but excluding it explicitly
   * keeps the scripts and their generated output out of the server trace and
   * out of any deployment bundle. It is also excluded in tsconfig.json.
   */
  outputFileTracingExcludes: {
    "*": ["content/ingest/**"],
  },
};

export default nextConfig;
