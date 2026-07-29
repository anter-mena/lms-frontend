import type { NextConfig } from "next";

// Read once so a missing value fails visibly at startup rather than silently
// producing a `undefined/...` destination.
const BACKEND_URL = process.env.BACKEND_URL;

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
  rewrites() {
    if (!BACKEND_URL) {
      console.warn(
        "[next.config] BACKEND_URL is not set — /api/* will 404. Copy .env.example to .env.local."
      );
      return [];
    }

    // Same-origin proxy: the browser only ever calls `/api/...` on this app's
    // own domain, and Next forwards it to the VPS server-side. Keeps the
    // backend address out of the browser, avoids CORS entirely, and means the
    // request reaches the backend from this server's IP — which is the one on
    // its allowlist.
    //
    // Returning a plain array behaves as `afterFiles`, so any Route Handler you
    // later add under `app/api/...` takes precedence over the proxy.
    //
    // `/api` has to be repeated in the destination. Only the named parameter is
    // substituted — a literal prefix in `source` is not carried over, so
    // `${BACKEND_URL}/:path*` would send /api/auth/login to /auth/login and 404.
    return [{ source: "/api/:path*", destination: `${BACKEND_URL}/api/:path*` }];
  },
};

export default nextConfig;
