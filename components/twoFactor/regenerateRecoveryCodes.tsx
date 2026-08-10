"use client"

import { useActionState, useState } from "react"
import { RefreshCw } from "lucide-react"

import {
  regenerateCodes,
  type RegenerateState,
} from "@/app/(app)/settings/security/actions"
import { RecoveryCodesPanel } from "@/components/twoFactor/recoveryCodesPanel"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

const initialState: RegenerateState = {}

/**
 * Replaces a user's recovery codes with a fresh set.
 *
 * <p>Three states in one component: a button, a password prompt, and the codes.
 * The password step is not skippable — regenerating hands out ten working ways
 * into the account, so it asks for the same proof the backend does.
 */
function RegenerateRecoveryCodes({ email }: { email: string }) {
  const [state, formAction, pending] = useActionState(
    regenerateCodes,
    initialState
  )
  const [confirming, setConfirming] = useState(false)

  if (state.recoveryCodes) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium">
          Your new recovery codes are ready
        </p>
        <RecoveryCodesPanel codes={state.recoveryCodes} email={email} />
        <p className="text-sm text-muted-foreground">
          Any codes from before this moment have stopped working.
        </p>
      </div>
    )
  }

  if (!confirming) {
    return (
      <div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setConfirming(true)}
        >
          <RefreshCw data-icon="inline-start" />
          Generate new codes
        </Button>
      </div>
    )
  }

  return (
    <form action={formAction} className="flex max-w-xs flex-col gap-3">
      {state.message ? (
        <p
          role="alert"
          aria-live="polite"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.message}
        </p>
      ) : null}

      <Field>
        <FieldLabel htmlFor="regenerate-password">Current password</FieldLabel>
        <Input
          id="regenerate-password"
          name="password"
          type="password"
          autoComplete="current-password"
          autoFocus
          required
          disabled={pending}
          aria-invalid={Boolean(state.fieldErrors?.password)}
        />
        {state.fieldErrors?.password ? (
          <FieldError>{state.fieldErrors.password}</FieldError>
        ) : null}
      </Field>

      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Generating…" : "Generate new codes"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setConfirming(false)}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}

export { RegenerateRecoveryCodes }
