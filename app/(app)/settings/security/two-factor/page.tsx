import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { TwoFactorSetupFlow } from "@/components/twoFactor/setupFlow"
import { requireUser } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Two-factor authentication",
}

export default async function TwoFactorPage() {
  const user = await requireUser()

  // Enrolling twice is not a thing: /2fa/setup answers 409 when it is already
  // on. Catching it here means the security page handles the "already enrolled"
  // case, rather than this one rendering a flow that cannot finish.
  if (user.mfaEnabled) {
    redirect("/settings/security")
  }

  // Passed down only so the downloaded recovery-code file names the account it
  // belongs to — people end up with several of these.
  return <TwoFactorSetupFlow email={user.email} />
}
