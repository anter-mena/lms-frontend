import type { Metadata } from "next"

import { TwoFactorSetupFlow } from "@/components/twoFactor/setupFlow"
import { requireSignedIn } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Two-factor authentication required",
}

/**
 * The only screen an un-enrolled account can use.
 *
 * <p>Lives under `(auth)`, not `(app)`, and that is the whole point: the app
 * shell is a sidebar full of links to places this person cannot go. Showing them
 * a menu of locked doors, with a note explaining that they are locked, is worse
 * than showing them the one thing they can actually do.
 *
 * <p>Nothing here enforces anything. The backend already refuses this account's
 * token everywhere except the enrolment endpoints — this screen exists so the
 * refusals have somewhere to point, instead of leaving someone clicking around
 * an app that silently does nothing.
 */
export default async function TwoFactorPage() {
  const user = await requireSignedIn()

  // `alreadyEnrolled` is read once, when the page first renders. That matters:
  // finishing enrolment re-renders this page with it now true, and the component
  // must keep showing the recovery codes rather than react to it. Only the
  // client knows whether it is mid-flow, so only the client may decide.
  //
  // `email` is passed so the downloaded recovery-code file names the account it
  // belongs to — people end up with several of these.
  return (
    <TwoFactorSetupFlow email={user.email} alreadyEnrolled={user.mfaEnabled} />
  )
}
