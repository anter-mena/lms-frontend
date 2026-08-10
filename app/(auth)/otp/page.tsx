import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { OtpForm } from "@/components/otp/otpForm"
import { redirectIfAuthenticated } from "@/lib/auth"
import { getMfaToken } from "@/lib/session"

export const metadata: Metadata = {
  title: "Two-factor authentication",
}

/**
 * Second factor, reached when the login action gets `mfaRequired` back. The
 * code comes from an authenticator app (TOTP), not from email — so there is
 * nothing to resend and no address to change here.
 */
export default async function OtpPage() {
  // Costs nothing for someone mid-login: they hold only the MFA cookie, so
  // this returns without a request. It catches the case of arriving here with
  // a finished session, which would otherwise bounce via /login to get here.
  await redirectIfAuthenticated()

  // No challenge cookie means step one never happened, or its five minutes ran
  // out. The action checks this too — it has to, since it is a public endpoint
  // — but checking on the way in as well means someone landing here cold gets
  // sent to the password step immediately, rather than being offered a code box
  // that cannot possibly succeed.
  if (!(await getMfaToken())) {
    redirect("/login")
  }

  return <OtpForm />
}
