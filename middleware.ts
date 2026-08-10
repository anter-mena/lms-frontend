import { NextResponse, type NextRequest } from "next/server"

import { MFA_COOKIE } from "@/lib/cookieNames"

/**
 * Tears up an abandoned login the moment someone lands back on the sign-in page.
 *
 * <p><b>Why this exists at all.</b> The "sign in with another email" button on the
 * code screen clears the challenge itself, because a Server Action may write
 * cookies. But arriving at `/login` any other way — the browser Back button,
 * typing the address, an old tab — renders a page, and Next.js forbids cookie
 * writes during a render. Middleware is the only place that can act on every one
 * of those routes, so it is the only thing that can make "leaving means leaving"
 * true rather than merely usually true.
 *
 * <p><b>Why only GET.</b> The sign-in form posts its Server Action to this same
 * path, and that action's whole job is to <em>set</em> the MFA cookie when a
 * password is accepted on a 2FA account. Deleting it on the same response would
 * be two halves of the app fighting over one header, with the winner depending on
 * ordering nobody should have to reason about. Navigations are GET; actions are
 * POST; the split is clean.
 *
 * <p><b>⚠️ Do not put a `<Link href="/login">` on the OTP screen.</b> Next.js
 * speculatively fetches a link's target when it scrolls into view or is hovered,
 * and — measured on Next 16.2 — it strips its own `RSC` and `Next-Router-Prefetch`
 * headers before middleware runs. Only `accept`, `cookie`, `host`, `user-agent`
 * and `x-forwarded-*` arrive, so there is no way here to tell a prefetch from a
 * real navigation. A visible link to `/login` would therefore delete a live
 * challenge without the user clicking anything, and nothing on screen would
 * explain why their code stopped working.
 *
 * <p>That is why the exit on the OTP screen is a form button rather than a link:
 * a button is never prefetched, and its action clears the challenge itself. The
 * checks below cover the browser-level prefetch hints, which are not stripped —
 * partial cover, kept because it costs nothing, not because it is sufficient.
 *
 * <p>Nothing else is touched. The session cookie is left alone, so someone
 * already signed in who wanders onto `/login` keeps their session and is
 * redirected onward by the page's own guard.
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Presence, not value. Next only sends these headers on a prefetch at all, and
  // the values have changed between versions — matching an exact one is a check
  // that silently stops working on an upgrade, in the direction that destroys
  // live logins. Sec-Purpose/Purpose are the browser-level equivalents.
  const isPrefetch =
    request.headers.has("Next-Router-Prefetch") ||
    request.headers.has("Next-Router-Segment-Prefetch") ||
    (request.headers.get("Sec-Purpose") ?? "").includes("prefetch") ||
    (request.headers.get("Purpose") ?? "").includes("prefetch")

  if (request.method === "GET" && !isPrefetch && request.cookies.has(MFA_COOKIE)) {
    response.cookies.delete(MFA_COOKIE)
  }

  return response
}

/**
 * The auth screens where arriving means the code step has been abandoned —
 * everything in that flow except `/otp` itself, which is the one place the
 * challenge is still being used.
 *
 * <p>`/forgot-password` counts: someone recovering a password is not part-way
 * through signing in any more.
 *
 * <p>Deliberately not a broad pattern. Middleware runs before everything it
 * matches, so widening this turns a two-page rule into a cost paid on every
 * request in the application.
 */
export const config = {
  matcher: ["/login", "/forgot-password"],
}
