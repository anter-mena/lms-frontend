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

/**
 * Reachable by anyone, signed in or not.
 *
 * <p>Listed as the exception, with everything unlisted treated as private. The
 * inverse — naming the protected routes — was the first version, and it meant a
 * page added later silently lost its redirect and got its layout flash back,
 * with nothing failing to say so. This way a new route is private because nobody
 * did anything, and making it public is a deliberate line here.
 */
const PUBLIC = ["/help-center", "/privacy-policy", "/terms-of-use"]

/** Signed-out only. Somebody already in has no use for these. */
const GUEST_ONLY = ["/login", "/forgot-password"]

/** Mid-login, and the enrolment gate. Each has its own rule below. */
const OTP = "/otp"
const ENROL = "/two-factor"

/**
 * Management. Administrators only, and not grantable to anybody else.
 *
 * <p>Decided here rather than in the page for the reason at the top of this file:
 * the layout streams before the page runs, so a page calling `forbidden()` gets
 * the right screen but the response has already gone out as a 200. Middleware is
 * the last moment a status can still be chosen.
 *
 * <p>Safe to judge from the token because the backend now ends every session when
 * a role changes — so the `role` claim cannot be stale in the way it used to be.
 * A promoted member signs in again and arrives as an administrator; a demoted one
 * cannot linger.
 *
 * <p>⚠️ Still not the security boundary. The token is decoded, not verified, so
 * a forged claim gets past this — and then gets 403 from the backend on every
 * request the screen makes. This decides which screen to build, nothing more.
 */
const ADMIN_ONLY = ["/users", "/system-health", "/backups"]

type Claims = { typ?: string; exp?: number; role?: string }

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
  const isAdmin = claims?.role === "ADMIN"

  /**
   * A session the backend has thrown out, which still looks alive from here.
   *
   * <p>This case did not exist until sessions could be ended server-side. A token
   * used to be good until it expired, so "unexpired and the right type" was the
   * same thing as "usable". Now changing somebody's role, resetting their
   * password or switching their account off all move a cut-off on the account,
   * and every token issued before it stops working at once — while still looking
   * perfectly valid to a decoder that only reads `exp` and `typ`.
   *
   * <p>Without this the two halves disagreed and fought: a page asked the backend,
   * was refused, and sent the person to sign in; middleware saw a live-looking
   * token and sent them straight back. That is the infinite reload — and it never
   * showed as a redirect loop in the browser's network tab, because the page's
   * redirect travels inside the streamed payload rather than as a 307.
   *
   * <p>The reason in the URL is the only signal available here. Middleware cannot
   * ask the backend without a round trip on every navigation, which is the cost
   * this file exists to avoid.
   */
  const revoked =
    GUEST_ONLY.includes(pathname) &&
    request.nextUrl.searchParams.get("reason") === "session-expired"

  const go = (to: string) =>
    NextResponse.redirect(new URL(to, request.url))

  const isPublic = PUBLIC.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  )
  const hasOwnRule =
    isPublic ||
    GUEST_ONLY.includes(pathname) ||
    pathname === OTP ||
    pathname === ENROL

  // ── Signed-in pages: everything without a rule of its own ────────────────
  if (!hasOwnRule) {
    if (owesEnrolment) return go(ENROL)
    if (!signedIn) return go("/login")
  }

  // ── Management ───────────────────────────────────────────────────────────
  // Rewritten, not redirected: the address stays on /users, which is what the
  // person asked for and what they should see in the bar while being told they
  // cannot have it. A redirect would rewrite history and lose the request.
  if (
    signedIn &&
    !isAdmin &&
    ADMIN_ONLY.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  ) {
    return NextResponse.rewrite(new URL("/no-access", request.url), {
      status: 403,
    })
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
  // `revoked` first: somebody sent here by a page that was refused must be
  // allowed to land, however healthy their cookie looks from the outside.
  if (GUEST_ONLY.includes(pathname) && !revoked) {
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

  // And the dead session itself. Letting them land was enough to stop the loop;
  // clearing the cookie is what stops it starting again the moment they navigate
  // anywhere else, and it is the only place in the app that can — a page render
  // may not write cookies, which is why the backend refusing a token could never
  // clean up after itself.
  if (revoked && request.method === "GET" && !isPrefetch) {
    response.cookies.delete(SESSION_COOKIE)
  }

  return response
}

/**
 * Every page request, and nothing else.
 *
 * <p>Excluded: `/api` (the proxy through to the backend, which authenticates
 * itself), Next's own internals, and anything with a file extension — images,
 * fonts, the favicon. What is left is navigations, which is exactly what has a
 * right answer about where somebody belongs.
 *
 * <p>Broad on purpose, unlike the earlier explicit list. The work per request is
 * a cookie read and a base64 decode — no I/O, no backend call — and the cost of
 * missing a route is a page that flashes content nobody should see.
 */
export const config = {
  matcher: ["/((?!api|_next|favicon.ico|.*\\.[\\w]+$).*)"],
}
