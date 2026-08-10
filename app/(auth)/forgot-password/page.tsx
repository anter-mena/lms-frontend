import type { Metadata } from "next"

import { ForgotPasswordForm } from "@/components/forgotPassword/forgotPasswordForm"
import { redirectIfAuthenticated } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Reset password",
}

/**
 * Reached from the "Forgot password?" link on the sign-in form. Shares the auth
 * shell, so the brand panel stays put between the two steps. Both steps of the
 * request live in the form component, since the header changes with them.
 */
export default async function ForgotPasswordPage() {
  // Someone signed in changes their password from settings, not from the
  // "I can't get in" flow.
  await redirectIfAuthenticated()

  return <ForgotPasswordForm />
}
