import { NextResponse, type NextRequest } from "next/server"

import { MFA_COOKIE, SESSION_COOKIE } from "@/lib/cookieNames"

/**
 * Decides where someone belongs before a single byte of HTML is written.
 *
 * <p><b>Why this is not just the page guards again.</b> Next renders layouts
 * eagerly and suspends only on the page, so `(app)/layout.tsx` paints its sidebar
 * and navbar while the page is still asking the server whether this person may
 * be there. A `loading.tsx` cannot cover it at any depth — the layout is above
 * the boundary. The visible result is a flash of the app before being thrown out
 * of it, and a flash of the sign-in form before being let in. Middleware runs
 * before rendering starts, so redirecting here means the wrong screen is never
 * built at all.
 *
 * <p><b>⚠️ This is not the security boundary and must never become one.</b> The
 * token below is decoded, not verified — no signature check, no secret. Anyone
 * can hand-write a cookie that satisfies every rule here. What stops them is the
 * backend, which verifies the signature on every request, and the page guards,
 * which ask it. This only decides which screen to build, and building the right
 * screen for a forged token still shows that token's holder nothing: every call
 * it makes comes back 401.
 *
 * <p>Verifying properly would mean either shipping the signing secret to the
 * edge, or an API round trip on every navigation. The first is worse than the
 * problem; the second reintroduces the wait this exists to remove.
 */

/** Signed-in only. Prefix match, so `/settings/security` is covered by `/settings`. */
const PROTECTED = ["/dashboard", "/settings"]

/** Signed-out only. Somebody already in has no use for these. */
const GUEST_ONLY = ["/login", "/forgot-password"]

/** Mid-login, and the enrolment gate. Each has its own rule below. */
const OTP = "/otp"
const ENROL = "/two-factor"

type Claims = { typ?: string; exp?: number }

/**
 * The middle segment of a JWT, base64url-decoded. No verification, deliberately
 * — see the warning above. Anything malformed is treated as no token at all,
 * which fails towards sending people to sign in.
 */
function decodeClaims(token: string): Claims | null {
  try {
    const payload = token.split(".")[1]
    if (!payload) return null
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
    return JSON.parse(json) as Claims
  } catch {
    return null
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const token = request.cookies.get(SESSION_COOKIE)?.value
  const claims = token ? decodeClaims(token) : null

  // An expired token is no token. The backend would reject it anyway; catching
  // it here saves a round trip that could only ever end in a redirect.
  const live = Boolean(claims?.exp && claims.exp * 1000 > Date.now())
  const signedIn = live && claims?.typ === "access"
  const owesEnrolment = live && claims?.typ === "enrolment_pending"

  const go = (to: string) =>
    NextResponse.redirect(new URL(to, request.url))

  // ── Signed-in pages ──────────────────────────────────────────────────────
  if (PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    if (owesEnrolment) return go(ENROL)
    if (!signedIn) return go("/login")
  }

  // ── The enrolment gate ───────────────────────────────────────────────────
  if (pathname === ENROL) {
    if (signedIn) return go("/dashboard")
    if (!owesEnrolment) return go("/login")
  }

  // ── The second-factor step ───────────────────────────────────────────────
  // Judged on the MFA cookie, not the session one: the whole point of this step
  // is that no session exists yet.
  if (pathname === OTP) {
    if (signedIn) return go("/dashboard")
    if (owesEnrolment) return go(ENROL)
    if (!request.cookies.has(MFA_COOKIE)) return go("/login?reason=expired")
  }

  // ── Signed-out pages ─────────────────────────────────────────────────────
  if (GUEST_ONLY.includes(pathname)) {
    if (signedIn) return go("/dashboard")
    if (owesEnrolment) return go(ENROL)
  }

  const response = NextResponse.next()

  // Arriving at a sign-in screen abandons any half-finished login, so the
  // challenge is torn up rather than left to rot for its remaining five minutes.
  //
  // ⚠️ Do not put a `<Link href="/login">` on the OTP screen. Next speculatively
  // fetches a link's target when it scrolls into view, and — measured on Next
  // 16.2 — strips its own `RSC` and `Next-Router-Prefetch` headers before
  // middleware runs, so a prefetch cannot be told apart from a real navigation.
  // A visible link would delete a live challenge with nobody having clicked
  // anything. That is why the exit there is a form button: buttons are never
  // prefetched. The checks below cover the browser-level hints, which are not
  // stripped — partial cover, kept because it is free.
  const isPrefetch =
    request.headers.has("Next-Router-Prefetch") ||
    request.headers.has("Next-Router-Segment-Prefetch") ||
    (request.headers.get("Sec-Purpose") ?? "").includes("prefetch") ||
    (request.headers.get("Purpose") ?? "").includes("prefetch")

  if (
    GUEST_ONLY.includes(pathname) &&
    request.method === "GET" &&
    !isPrefetch &&
    request.cookies.has(MFA_COOKIE)
  ) {
    response.cookies.delete(MFA_COOKIE)
  }

  return response
}

/**
 * Only the routes with a rule. Middleware runs before everything it matches, so
 * a catch-all would tax every asset request to serve six pages.
 */
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/settings/:path*",
    "/login",
    "/forgot-password",
    "/otp",
    "/two-factor",
  ],
}
