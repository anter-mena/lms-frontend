import type { Metadata } from "next"
import Link from "next/link"
import { ShieldCheck } from "lucide-react"

import { RegenerateRecoveryCodes } from "@/components/twoFactor/regenerateRecoveryCodes"
import { Button } from "@/components/ui/button"
import { requireUser } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Security",
}

/**
 * Everything about proving who you are and keeping the account yours.
 *
 * Deliberately a page rather than a folder: two-factor is the first thing to
 * land here, but verifying an email address, changing a password and reviewing
 * active sessions all belong on this screen too. Anything that runs as a
 * multi-step flow — enrolment being the first — gets its own route beneath
 * this one and returns here when it finishes.
 */
export default async function SecurityPage() {
  const user = await requireUser()

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Security
        </h1>
        <p className="text-sm text-muted-foreground">
          How you sign in, and how this account is protected.
        </p>
      </div>

      {/* Status comes off requireUser(), which already returned the user — no
          second request to ask whether 2FA is on. */}
      <div className="flex max-w-lg items-start gap-3 rounded-lg border bg-card p-4">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="text-sm font-medium">Two-factor authentication</p>
          <p className="text-sm text-muted-foreground">
            {user.mfaEnabled
              ? "On. Signing in asks for a code from your authenticator app."
              : "Off. Your password is currently the only thing protecting this account."}
          </p>
        </div>

        {!user.mfaEnabled && (
          <Button
            size="sm"
            className="shrink-0"
            render={<Link href="/settings/security/two-factor" />}
          >
            Set up
          </Button>
        )}
      </div>

      {/* No "turn off" here, deliberately. Two-factor is mandatory, so the
          only way out is an administrator clearing it — which is what
          POST /api/users/{id}/2fa/reset is for. */}
      {user.mfaEnabled && (
        <div className="flex max-w-lg flex-col gap-3 rounded-lg border bg-card p-4">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">Recovery codes</p>
            <p className="text-sm text-muted-foreground">
              Single-use codes for signing in when you do not have your phone.
              Generate a new set if you are running low, or if you think someone
              else has seen them.
            </p>
          </div>

          <RegenerateRecoveryCodes email={user.email} />
        </div>
      )}
    </div>
  )
}
