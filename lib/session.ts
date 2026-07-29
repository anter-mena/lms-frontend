import "server-only"

import { cookies } from "next/headers"

/**
 * Where the access token lives.
 *
 * An httpOnly cookie rather than localStorage: nothing in the browser bundle can
 * read it, so a single XSS — or one compromised dependency — cannot walk off
 * with a token that stays valid for 24 hours. The cost is that every call to the
 * backend has to happen server-side, which is why this module is server-only.
 */
export const SESSION_COOKIE = "lms_session"

/**
 * Issued when the password step succeeds but a second factor is still owed.
 * Opens nothing except the 2FA endpoint, and the backend expires it in 5 minutes.
 */
export const MFA_COOKIE = "lms_mfa"

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

export async function destroySession() {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
  store.delete(MFA_COOKIE)
}
