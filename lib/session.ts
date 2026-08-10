import "server-only"

import { cookies } from "next/headers"

import { MFA_COOKIE, SESSION_COOKIE } from "@/lib/cookieNames"

/**
 * Where the access token lives.
 *
 * An httpOnly cookie rather than localStorage: nothing in the browser bundle can
 * read it, so a single XSS — or one compromised dependency — cannot walk off
 * with a token that stays valid for 24 hours. The cost is that every call to the
 * backend has to happen server-side, which is why this module is server-only.
 *
 * The names themselves live in `lib/cookieNames`, which middleware can import and
 * this module cannot be.
 */
export { MFA_COOKIE, SESSION_COOKIE }

const isProduction = process.env.NODE_ENV === "production"

type CookieOptions = {
  httpOnly: true
  sameSite: "lax"
  secure: boolean
  path: string
  maxAge: number
}

function cookieOptions(maxAgeSeconds: number): CookieOptions {
  return {
    httpOnly: true,
    // `lax` still sends the cookie on top-level navigations, which is what makes
    // a redirect straight after login land already authenticated.
    sameSite: "lax",
    // Off in development because localhost is plain HTTP and a `secure` cookie
    // would simply never be stored.
    secure: isProduction,
    path: "/",
    maxAge: maxAgeSeconds,
  }
}

export async function createSession(token: string, expiresInSeconds: number) {
  const store = await cookies()
  store.set(SESSION_COOKIE, token, cookieOptions(expiresInSeconds))
  // The password step is finished, so the half-way token has no further use.
  store.delete(MFA_COOKIE)
}

export async function createMfaChallenge(mfaToken: string) {
  const store = await cookies()
  // Five minutes, matching the backend's own expiry on this token.
  store.set(MFA_COOKIE, mfaToken, cookieOptions(60 * 5))
}

export async function getSessionToken() {
  return (await cookies()).get(SESSION_COOKIE)?.value ?? null
}

export async function getMfaToken() {
  return (await cookies()).get(MFA_COOKIE)?.value ?? null
}

/**
 * Abandons a half-finished login without touching an existing session.
 *
 * <p>Called when someone leaves the code screen to sign in as somebody else. The
 * proof that they passed the password step has no purpose once they have walked
 * away from it, and leaving it lying around for its remaining five minutes means
 * the code screen stays reachable after they have visibly given up on it.
 */
export async function clearMfaChallenge() {
  (await cookies()).delete(MFA_COOKIE)
}

export async function destroySession() {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
  store.delete(MFA_COOKIE)
}
