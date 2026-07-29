import type { Metadata } from "next"

import { OtpForm } from "@/components/otp/otpForm"

export const metadata: Metadata = {
  title: "Two-factor authentication",
}

/**
 * Second factor, reached when the login action gets `mfaRequired` back. The
 * code comes from an authenticator app (TOTP), not from email — so there is
 * nothing to resend and no address to change here.
 */
export default function OtpPage() {
  return <OtpForm />
}
