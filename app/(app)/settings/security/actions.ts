"use server"

import { apiFetch } from "@/lib/api"

/** Mirrors the backend's MfaConfirmResponse — the same shape enrolment returns. */
type MfaConfirmResponse = {
  message: string
  recoveryCodes: string[]
}

export type RegenerateState = {
  recoveryCodes?: string[]
  message?: string
  fieldErrors?: Record<string, string>
}

/**
 * Issues a fresh set of recovery codes and destroys the old ones.
 *
 * <p>Takes the current password even though the caller is already signed in.
 * Being logged in is not enough for something this sensitive: an unlocked
 * laptop left on a desk would otherwise be all it takes to walk off with ten
 * working ways into the account.
 */
export async function regenerateCodes(
  _prevState: RegenerateState,
  formData: FormData
): Promise<RegenerateState> {
  const password = String(formData.get("password") ?? "")

  if (!password) {
    return { fieldErrors: { password: "Your current password is required" } }
  }

  const result = await apiFetch<MfaConfirmResponse>(
    "/api/auth/2fa/recovery-codes",
    {
      method: "POST",
      authenticated: true,
      body: JSON.stringify({ password }),
    }
  )

  if (!result.ok) {
    return {
      message: result.error.message,
      fieldErrors: result.error.fieldErrors,
    }
  }

  return { recoveryCodes: result.data.recoveryCodes }
}
