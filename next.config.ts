import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Required for the `forbidden()` / `unauthorized()` interrupts and their
    // matching `forbidden.tsx` / `unauthorized.tsx` conventions. Still flagged
    // experimental as of 16.2 — drop these three files if you'd rather not
    // depend on it.
    authInterrupts: true,
  },
  redirects() {
    return [
      // Every screen lives in its own folder, so sign-in is `/login`. There is
      // no public landing page, so `/` just forwards there.
      { source: "/", destination: "/login", permanent: false },
    ];
  },
};

export default nextConfig;
