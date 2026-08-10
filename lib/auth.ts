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

  if (!result) redirect("/login")
  if (result.ok) return result.data

  if (result.error.status === 401 || result.error.status === 403) {
    redirect("/login")
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
  if (result?.ok) redirect("/dashboard")
}
