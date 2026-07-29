"use client"

import Link from "next/link"
import { useState } from "react"
// FingerprintPattern, not Fingerprint: this lucide version renamed the icon and
// keeps the old name only as a back-compat alias.
import { ArrowLeft, FingerprintPattern, MailCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

/**
 * Both steps of "request a reset" live in this one component: the email form,
 * and the confirmation that replaces it. The heading and icon change between
 * them, which is why the header sits here rather than on the page.
 *
 * Presentation only, like the OTP screen — there is no reset endpoint in the
 * backend contract this app was built against, so submitting just advances the
 * local state. Wiring it later means adding an action and swapping the onSubmit.
 */
function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)

  if (sent) {
    return (
      <div className="mx-auto flex w-full max-w-xs flex-col gap-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="mb-1 flex size-9 items-center justify-center rounded-lg border bg-card shadow-sm">
            <MailCheck className="size-4" aria-hidden />
          </div>
          <h1 className="font-heading text-lg font-bold tracking-tight text-balance">
            Check your email
          </h1>
          {/* "If an account exists" is deliberate. Confirming the address is
              registered would let someone enumerate staff emails — the same
              reason login answers identically for a wrong password and an
              account that does not exist. */}
          <p className="text-xs text-muted-foreground">
            If an account exists for{" "}
            <span className="font-medium text-foreground">{email}</span>, a
            reset link is on its way. It expires in 30 minutes.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <FieldDescription className="text-center">
            Didn&apos;t get the email? Resend in{" "}
            <span className="tabular-nums text-foreground">0:28</span>
          </FieldDescription>
          <FieldDescription className="text-center">
            <button
              type="button"
              onClick={() => setSent(false)}
              className="text-foreground underline underline-offset-4 hover:text-primary"
            >
              Use a different email
            </button>
          </FieldDescription>
        </div>

        <BackToSignIn />
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-xs flex-col gap-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="mb-1 flex size-9 items-center justify-center rounded-lg border bg-card shadow-sm">
          <FingerprintPattern className="size-4" aria-hidden />
        </div>
        <h1 className="font-heading text-lg font-bold tracking-tight text-balance">
          Reset your password
        </h1>
        <p className="text-xs text-muted-foreground">
          Enter your email and we&apos;ll send you a link to set a new one.
        </p>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          // Read off the form rather than controlling the input: no re-render
          // per keystroke, and it is the same shape a server action would get.
          const data = new FormData(event.currentTarget)
          setEmail(String(data.get("email") ?? ""))
          setSent(true)
        }}
      >
        <FieldGroup className="gap-3">
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="m@example.com"
              // Carries the address back if they return via "Use a different
              // email", so a typo is an edit rather than a retype.
              defaultValue={email}
              required
            />
          </Field>

          <Button type="submit" className="w-full">
            Send reset link
          </Button>
        </FieldGroup>
      </form>

      <BackToSignIn />
    </div>
  )
}

/** Not underlined, unlike the inline links — this is navigation, not prose. */
function BackToSignIn() {
  return (
    <p className="text-center text-xs">
      <Link
        href="/login"
        className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3" aria-hidden />
        Back to sign in
      </Link>
    </p>
  )
}

export { ForgotPasswordForm }
