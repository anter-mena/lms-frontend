"use server"

import { redirect } from "next/navigation"

import { apiFetch } from "@/lib/api"
import { createMfaChallenge, createSession } from "@/lib/session"

/** Mirrors the backend's LoginResponse. */
type LoginResponse = {
  mfaRequired: boolean
  mfaToken?: string
  accessToken?: string
  expiresInSeconds?: number
}

export type LoginState = {
  message?: string
  fieldErrors?: Record<string, string>
}

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim()
  const password = String(formData.get("password") ?? "")

  // Checked here as well as in the browser: a Server Action is a public POST
  // endpoint, so required attributes on the inputs prove nothing.
  if (!email || !password) {
    return {
      fieldErrors: {
        ...(email ? {} : { email: "Email is required" }),
        ...(password ? {} : { password: "Password is required" }),
      },
    }
  }

  const result = await apiFetch<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })

  if (!result.ok) {
    // The backend answers identically for a wrong password and an unknown
    // account, on purpose. Passing its message straight through keeps it that
    // way — do not try to be more helpful here.
    return {
      message: result.error.message,
      fieldErrors: result.error.fieldErrors,
    }
  }

  const data = result.data

  if (data.mfaRequired && data.mfaToken) {
    await createMfaChallenge(data.mfaToken)
    redirect("/otp")
  }

  if (!data.accessToken) {
    return { message: "The server returned an unexpected response." }
  }

  await createSession(data.accessToken, data.expiresInSeconds ?? 60 * 60 * 24)
  redirect("/dashboard")
}
