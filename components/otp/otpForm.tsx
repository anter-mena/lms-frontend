"use client"

import { useActionState, useState } from "react"
import { ArrowLeft, ShieldCheck } from "lucide-react"

import {
  signInWithAnotherEmail,
  verifyOtp,
  type OtpState,
} from "@/app/(auth)/otp/actions"
import { Button } from "@/components/ui/button"
import { FieldDescription, FieldError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/inputOtp"

// size-10, down from size-11/md:size-12: six slots plus a separator now have to
// fit the same max-w-xs column the other auth screens use, and 40px keeps the
// digits comfortable without overflowing it.
const SLOT_CLASS = "size-10 rounded-lg border text-base"

const initialState: OtpState = {}

function OtpForm() {
  const [state, formAction, pending] = useActionState(verifyOtp, initialState)
  // Which factor is on screen. Client state, not a route: it is a way of
  // answering the same challenge, not a different step, so putting it in the
  // URL would let someone land straight on it without a challenge open.
  const [useRecovery, setUseRecovery] = useState(false)

  return (
    <div className="mx-auto flex w-full max-w-xs flex-col gap-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="mb-1 flex size-9 items-center justify-center rounded-lg border bg-card shadow-sm">
          <ShieldCheck className="size-4" aria-hidden />
        </div>
        <h1 className="font-heading text-lg font-bold tracking-tight text-balance">
          Two-factor authentication
        </h1>
        <p className="text-xs text-muted-foreground">
          {useRecovery
            ? "Enter one of the recovery codes you saved when you set up two-factor authentication."
            : "Open your authenticator app and enter the 6-digit code for Norden Capital."}
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-3">
        {/* The backend's own wording, passed through unchanged: it tells an
            expired challenge apart from a wrong code apart from a locked
            account, and each needs a different reaction from the reader. */}
        {state.message ? (
          <p
            role="alert"
            aria-live="polite"
            className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {state.message}
          </p>
        ) : null}

        {useRecovery ? (
          <>
            {/* Tells the action which factor to expect. Without it, an empty
                submit would be reported as a missing 6-digit code. */}
            <input type="hidden" name="mode" value="recovery" />
            <Input
              name="recoveryCode"
              autoFocus
              autoComplete="off"
              spellCheck={false}
              placeholder="ABCDE-12345"
              disabled={pending}
              aria-invalid={Boolean(state.fieldErrors?.recoveryCode)}
              // uppercase is display only — CSS cannot change the submitted
              // value, so the action normalises it again server-side.
              className="h-10 text-center font-mono tracking-widest uppercase placeholder:normal-case placeholder:tracking-normal"
            />
          </>
        ) : (
          /* name="code" is what puts the digits into FormData — input-otp
             spreads its props onto the real <input> it renders behind the
             slots. Without it the action receives an empty body. */
          <InputOTP
            name="code"
            maxLength={6}
            disabled={pending}
            autoFocus
            aria-invalid={Boolean(state.fieldErrors?.code)}
            containerClassName="justify-between gap-2"
          >
            <InputOTPGroup className="gap-2">
              <InputOTPSlot index={0} className={SLOT_CLASS} />
              <InputOTPSlot index={1} className={SLOT_CLASS} />
              <InputOTPSlot index={2} className={SLOT_CLASS} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup className="gap-2">
              <InputOTPSlot index={3} className={SLOT_CLASS} />
              <InputOTPSlot index={4} className={SLOT_CLASS} />
              <InputOTPSlot index={5} className={SLOT_CLASS} />
            </InputOTPGroup>
          </InputOTP>
        )}

        {/* Keyed per field, so switching factors never shows the other one's
            error — only the general banner above persists across a toggle. */}
        {state.fieldErrors?.code && !useRecovery ? (
          <FieldError>{state.fieldErrors.code}</FieldError>
        ) : null}
        {state.fieldErrors?.recoveryCode && useRecovery ? (
          <FieldError>{state.fieldErrors.recoveryCode}</FieldError>
        ) : null}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Verifying…" : "Verify and continue"}
        </Button>
      </form>

      {/* No "resend", no "use a different email": a TOTP code is generated on
          the device and rotates on its own, so there is nothing for the server
          to send again. Losing the device is what recovery codes are for.
          No support link here either — the auth layout's footer already carries
          one on every screen in this flow. */}
      <div className="flex flex-col gap-2">
        <FieldDescription className="text-center">
          {useRecovery
            ? "Each recovery code works once, then stops."
            : "Your code changes every 30 seconds."}
        </FieldDescription>

        <FieldDescription className="text-center">
          {useRecovery ? (
            <>
              Got your phone back?{" "}
              <button
                type="button"
                onClick={() => setUseRecovery(false)}
                className="text-foreground underline underline-offset-4 hover:text-primary"
              >
                Use your authenticator app
              </button>
            </>
          ) : (
            <>
              Lost access to your device?{" "}
              <button
                type="button"
                onClick={() => setUseRecovery(true)}
                className="text-foreground underline underline-offset-4 hover:text-primary"
              >
                Use a recovery code
              </button>
            </>
          )}
        </FieldDescription>
      </div>

      {/* A form, not a link: leaving has to tear up the half-finished login, and
          only the server may delete that cookie. */}
      <form action={signInWithAnotherEmail} className="text-center text-xs">
        <button
          type="submit"
          className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3" aria-hidden />
          Sign in with another email
        </button>
      </form>
    </div>
  )
}

export { OtpForm }
