import "server-only"

import { cache } from "react"
import { redirect } from "next/navigation"

import { apiFetch, type ApiResult } from "@/lib/api"
import { getSessionToken } from "@/lib/session"

/**
 * Route protection, in the two directions this app needs.
 *
 * There are three kinds of page here, and the route groups already name them:
 *
 * - `(app)`    private    — call {@link requireUser}
 * - `(auth)`   guest-only — call {@link redirectIfAuthenticated}
 * - `(public)` either     — call nothing
 *
 * Both of these are called as the *first statement* of a page rather than
 * wrapping it in a guard component. A wrapper only runs once the page function
 * has already executed to produce it, so any `await` at the top of the page
 * would fetch before the guard ever ran. A statement cannot be got around:
 * `redirect()` throws, so nothing below it executes.
 */

/** Mirrors the backend's UserResponse. */
export type SessionUser = {
  id: number
  firstName: string
  lastName: string
  email: string
  phone: string | null
  role: string
  status: string
  mfaEnabled: boolean
  permissions: string[]
}

/**
 * `null` means there is no session cookie at all — not signed in, and not worth
 * a round trip to confirm it. Anything else is the backend's own answer.
 *
 * Wrapped in React's `cache` so a page that guards and then uses the user costs
 * one request, not two, however many times it is called in a single render.
 */
const loadUser = cache(async (): Promise<ApiResult<SessionUser> | null> => {
  if (!(await getSessionToken())) return null
  return apiFetch<SessionUser>("/api/users/me", { authenticated: true })
})

/**
 * For pages under `(app)`. Returns the signed-in user, so the page gets the
 * data it needs from the same call that protected it.
 *
 * @throws on an unreachable or broken backend — deliberately. That is an
 *         outage, not a sign-out, and `app/error.tsx` already renders it with a
 *         retry button. Redirecting to `/login` instead would tell people to
 *         sign in again over a problem no password can fix.
 */
export async function requireUser(): Promise<SessionUser> {
  const result = await loadUser()

  // No cookie at all — they were never signed in, so there is nothing to explain.
  // Saying "your session expired" to someone who just opened the app is noise.
  if (!result) redirect("/login")

  if (result.ok) {
    // Two-factor is mandatory for every role, so an account without it cannot
    // use any of this. The backend already refuses their token everywhere except
    // enrolment; this is what turns those refusals into somewhere to go rather
    // than a page full of silent failures.
    if (!result.data.mfaEnabled) redirect("/two-factor")
    return result.data
  }

  // A cookie that the backend rejected is different: they *were* signed in and
  // have been thrown out mid-task. Without a word, the app looks like it forgot
  // them for no reason.
  if (result.error.status === 401 || result.error.status === 403) {
    redirect("/login?reason=session-expired")
  }

  throw new Error(`Could not load the signed-in user: ${result.error.message}`)
}

/**
 * For pages under `(auth)`. Sends an already-signed-in visitor to the app
 * rather than showing them a sign-in form they do not need.
 *
 * Only a *confirmed* session redirects. Checking merely that a cookie exists
 * would loop forever on a stale one: `/login` would bounce to `/dashboard`,
 * which would reject the token and bounce back. The cookie cannot be cleared
 * here to break that cycle either — Next.js only allows cookie writes in Server
 * Actions and Route Handlers, never during a page render. So an expired cookie
 * falls through to the form, which is exactly where someone holding one needs
 * to be.
 */
export async function redirectIfAuthenticated() {
  const result = await loadUser()
  if (!result?.ok) return

  // Straight to enrolment rather than bouncing off /dashboard on the way. The
  // destination is the same either way; this just spares them a redirect they
  // would briefly see in the address bar.
  redirect(result.data.mfaEnabled ? "/dashboard" : "/two-factor")
}

/**
 * Signed in, enrolled or not. For the enrolment screen alone.
 *
 * <p><b>Deliberately does not redirect people who already have 2FA on</b>, and
 * that is not an oversight. Finishing enrolment writes a new session cookie, and
 * a Server Action that writes a cookie makes Next re-render the page it was
 * called from. A check here for "2FA is on now, off you go" would therefore fire
 * the instant enrolment succeeded — throwing away the recovery codes screen
 * before it ever painted, and with it the only copy of those codes that will
 * ever exist.
 *
 * <p>So the decision moves into the client component, which is the only thing
 * that knows whether it is mid-flow. Someone who wanders here already enrolled
 * is shown a dead end and a way out, rather than being bounced.
 */
export async function requireSignedIn(): Promise<SessionUser> {
  const result = await loadUser()

  if (!result) redirect("/login")
  if (result.ok) return result.data

  if (result.error.status === 401 || result.error.status === 403) {
    redirect("/login?reason=session-expired")
  }

  throw new Error(`Could not load the signed-in user: ${result.error.message}`)
}
