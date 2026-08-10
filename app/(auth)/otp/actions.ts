"use server"

import { redirect } from "next/navigation"

import { apiFetch } from "@/lib/api"
import { clearMfaChallenge, createSession, getMfaToken } from "@/lib/session"

/** Mirrors the backend's LoginResponse — the same shape step one returns. */
type LoginResponse = {
  mfaRequired: boolean
  mfaToken?: string
  accessToken?: string
  expiresInSeconds?: number
}

export type OtpState = {
  message?: string
  fieldErrors?: Record<string, string>
}

/**
 * Gives up on this login and returns to the sign-in form.
 *
 * <p>The commonest mistake at this point is being in the wrong account — the
 * browser filled in another address, or it is a shared machine. Every large
 * provider puts an exit here for exactly that reason, and leaving it out turns a
 * mistyped email into "clear your cookies to escape".
 *
 * <p>An action rather than a link, because only the server may delete the cookie.
 * Middleware clears it too, for anyone arriving at `/login` by the Back button or
 * by typing the address — this covers the deliberate press.
 */
export async function signInWithAnotherEmail() {
  await clearMfaChallenge()
  // The reason travels in the URL rather than a toast: it has to survive a
  // redirect and a fresh page render, and it should still be there if the
  // person reloads while wondering what happened.
  redirect("/login?reason=cancelled")
}

/**
 * Step two of logging in: exchange the 6-digit code for a real session.
 *
 * This has to run on the server, and not by preference. The `mfaToken` proving
 * step one succeeded lives in an httpOnly cookie, so browser JavaScript cannot
 * read it to build this request — and the access token that comes back has to
 * go into another httpOnly cookie, which only the server can set.
 */
export async function verifyOtp(
  _prevState: OtpState,
  formData: FormData
): Promise<OtpState> {
  // No challenge cookie means step one never happened, or the five minutes
  // ran out. Either way there is nothing to verify against, so send them back
  // to the password step rather than showing a form that cannot succeed.
  const mfaToken = await getMfaToken()
  if (!mfaToken) {
    // Landing on a bare sign-in form after carefully typing six digits is
    // baffling. Say what happened.
    redirect("/login?reason=expired")
  }

  // Which factor the form was showing, sent as a hidden field. Inferring it
  // from whichever input came back non-empty would misreport an empty submit
  // as the wrong kind of error.
  const usingRecovery = formData.get("mode") === "recovery"

  // All validation below is checked here as well as in the browser: a Server
  // Action is a public POST endpoint, so the inputs' own constraints prove
  // nothing.
  //
  // Worth knowing why this is not just tidiness — the backend counts a
  // malformed code as a failed attempt (AuthService.registerFailedAttempt),
  // and five of those lock the account for 15 minutes. Catching bad input here
  // means a typo does not eat into that budget.
  let payload: { mfaToken: string; code?: string; recoveryCode?: string }

  if (usingRecovery) {
    // Whitespace stripped and uppercased to match how the backend normalises
    // before comparing, so a pasted code with a stray space still works.
    const recoveryCode = String(formData.get("recoveryCode") ?? "")
      .replace(/\s+/g, "")
      .toUpperCase()

    if (!recoveryCode) {
      return { fieldErrors: { recoveryCode: "Enter one of your recovery codes" } }
    }
    // Shape only — five, a dash, five. Deliberately not policing the exact
    // alphabet: rejecting a genuine code because this list drifted from the
    // backend's would be far worse than letting the backend decide.
    if (!/^[A-Z0-9]{5}-[A-Z0-9]{5}$/.test(recoveryCode)) {
      return {
        fieldErrors: { recoveryCode: "Recovery codes look like ABCDE-12345" },
      }
    }

    payload = { mfaToken, recoveryCode }
  } else {
    const code = String(formData.get("code") ?? "").trim()

    if (!code) {
      return { fieldErrors: { code: "Enter the 6-digit code from your authenticator app" } }
    }
    if (!/^\d{6}$/.test(code)) {
      return { fieldErrors: { code: "The code must be exactly 6 digits" } }
    }

    payload = { mfaToken, code }
  }

  const result = await apiFetch<LoginResponse>("/api/auth/login/2fa", {
    method: "POST",
    body: JSON.stringify(payload),
  })

  if (!result.ok) {
    // Passed through unchanged. The backend distinguishes an expired challenge
    // ("This login session has expired") from a wrong code ("That code is not
    // valid") from a locked account (423), and each needs a different reaction
    // from the person reading it.
    return { message: result.error.message }
  }

  const data = result.data

  if (!data.accessToken) {
    return { message: "The server returned an unexpected response." }
  }

  // Writes the session cookie and drops the now-spent MFA challenge cookie.
  await createSession(data.accessToken, data.expiresInSeconds ?? 60 * 60 * 24)

  // Throws a framework control-flow exception; nothing after it runs.
  redirect("/dashboard")
}
