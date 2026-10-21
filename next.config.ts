import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  async redirects() {
    return [
      {
        // `/` goes straight to sign-in: the community is private (PRD §1), so
        // there is no public landing page.
        //
        // Doing this here rather than with a `redirect()` in a page matters: a
        // statically prerendered page can't return a 307, so Next falls back to
        // a `<meta http-equiv="refresh" content="1;...">` — a full second of
        // blank screen. A config redirect is handled before rendering, costs no
        // JS, and is a real HTTP redirect.
        source: "/",
        destination: "/login",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
