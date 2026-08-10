"use server"

import { apiFetch } from "@/lib/api"

/** Mirrors the backend's MfaSetupResponse. */
type MfaSetupResponse = {
  secret: string
  qrCodeImage: string
}

/** Mirrors the backend's MfaConfirmResponse. */
type MfaConfirmResponse = {
  message: string
  recoveryCodes: string[]
}

export type SetupState = {
  /** The base32 seed, for people who type it in rather than scan. */
  secret?: string
  /** A `data:image/png;base64,...` URL, ready for an <img> src. */
  qrCodeImage?: string
  message?: string
}

/**
 * Begins enrolment: asks the backend for a fresh TOTP seed and its QR code.
 *
 * <p>Fired from a button, deliberately — never during a page render. Every call
 * to `/2fa/setup` generates a <em>new</em> secret and overwrites the stored one
 * (AuthService.startMfaSetup), so a page that fetched this while rendering
 * would silently invalidate whatever the user had just scanned the moment they
 * refreshed.
 *
 * <p>Nothing is switched on here. `mfaEnabled` stays false until a code is
 * confirmed, which is what stops an abandoned setup locking anyone out.
 *
 * <p>Takes no parameters: it reads nothing from the form and nothing from the
 * previous state. `useActionState` still passes both, and a function is free to
 * ignore arguments it was handed.
 */
export async function startSetup(): Promise<SetupState> {
  const result = await apiFetch<MfaSetupResponse>("/api/auth/2fa/setup", {
    method: "POST",
    authenticated: true,
  })

  if (!result.ok) {
    return { message: result.error.message }
  }

  return {
    secret: result.data.secret,
    qrCodeImage: result.data.qrCodeImage,
  }
}

export type ConfirmState = {
  /**
   * Plaintext, and the only time they will ever exist — the database stores
   * bcrypt hashes. Nothing can retrieve these afterwards, including an admin.
   */
  recoveryCodes?: string[]
  message?: string
  fieldErrors?: Record<string, string>
}

/**
 * Proves the QR was really scanned, and switches two-factor on.
 *
 * <p>This is the point of no return for the account: from here, signing in
 * needs the phone. It is also the only response that carries the recovery
 * codes, so whatever renders it has one chance to show them.
 *
 * <p>Unlike the login step, a wrong code here costs nothing —
 * `confirmMfaSetup` answers 400 and never touches the failed-attempt counter,
 * so someone fumbling their first code cannot lock themselves out.
 */
export async function confirmSetup(
  _prevState: ConfirmState,
  formData: FormData
): Promise<ConfirmState> {
  const code = String(formData.get("code") ?? "").trim()

  if (!code) {
    return { fieldErrors: { code: "Enter the 6-digit code from your app" } }
  }
  if (!/^\d{6}$/.test(code)) {
    return { fieldErrors: { code: "The code must be exactly 6 digits" } }
  }

  const result = await apiFetch<MfaConfirmResponse>("/api/auth/2fa/confirm", {
    method: "POST",
    authenticated: true,
    body: JSON.stringify({ code }),
  })

  if (!result.ok) {
    return {
      message: result.error.message,
      fieldErrors: result.error.fieldErrors,
    }
  }

  return { recoveryCodes: result.data.recoveryCodes }
}
