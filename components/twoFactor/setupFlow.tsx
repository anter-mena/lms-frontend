"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useActionState, useState } from "react"
import {
  ArrowLeft,
  Check,
  Copy,
  KeyRound,
  ShieldCheck,
  Smartphone,
} from "lucide-react"

import {
  confirmSetup,
  startSetup,
  type ConfirmState,
  type SetupState,
} from "@/app/(app)/settings/security/two-factor/actions"
import { RecoveryCodesPanel } from "@/components/twoFactor/recoveryCodesPanel"
import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/inputOtp"

const initialSetupState: SetupState = {}
const initialConfirmState: ConfirmState = {}

const SLOT_CLASS = "size-10 rounded-lg border text-base"

/**
 * Enrolment, start to finish, in one component.
 *
 * <p>One component rather than a route per step, because the secret must be
 * fetched exactly once: `/2fa/setup` issues a new one on every call, so a step
 * that lived at its own URL would hand out a fresh secret on every refresh and
 * quietly break the entry the user had already scanned. Holding it in memory
 * makes that impossible.
 *
 * <p>Both actions' hooks live here so the step is derived in one place, from
 * what has actually come back, rather than tracked in a counter that can fall
 * out of step with reality.
 *
 * <p>Deliberately free of app chrome. When 2FA becomes mandatory, a user who
 * has not enrolled cannot use the sidebar (every link is forbidden until they
 * do), so this same component gets mounted on a bare `(auth)` route.
 */
function TwoFactorSetupFlow({ email }: { email: string }) {
  const [setupState, startAction, startPending] = useActionState(
    startSetup,
    initialSetupState
  )
  const [confirmState, confirmAction, confirmPending] = useActionState(
    confirmSetup,
    initialConfirmState
  )

  if (confirmState.recoveryCodes) {
    return <RecoveryCodesStep codes={confirmState.recoveryCodes} email={email} />
  }

  if (setupState.secret && setupState.qrCodeImage) {
    return (
      <ScanStep
        secret={setupState.secret}
        qrCodeImage={setupState.qrCodeImage}
        formAction={confirmAction}
        pending={confirmPending}
        state={confirmState}
      />
    )
  }

  return (
    <IntroStep
      formAction={startAction}
      pending={startPending}
      message={setupState.message}
    />
  )
}

/* ── Step 1: what this is, and a button that starts it ──────────────────── */

function IntroStep({
  formAction,
  pending,
  message,
}: {
  formAction: (formData: FormData) => void
  pending: boolean
  message?: string
}) {
  return (
    <Shell>
      <header className="flex flex-col gap-1">
        <div className="mb-2 flex size-9 items-center justify-center rounded-lg border bg-card shadow-sm">
          <ShieldCheck className="size-4" aria-hidden />
        </div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Set up two-factor authentication
        </h1>
        <p className="text-sm text-muted-foreground">
          A second step when you sign in: a 6-digit code from your phone, on top
          of your password. If someone learns your password, it still is not
          enough on its own.
        </p>
      </header>

      <div className="flex items-start gap-3 rounded-lg border bg-card p-3">
        <Smartphone className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">You will need an authenticator app</p>
          <p className="text-sm text-muted-foreground">
            Google Authenticator, 1Password, Authy or similar. Install one
            before you start — the next screen shows a code to scan.
          </p>
        </div>
      </div>

      <form action={formAction} className="flex flex-col gap-3">
        {message ? <ErrorBanner>{message}</ErrorBanner> : null}

        <div className="flex items-center gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Preparing…" : "Start setup"}
          </Button>
          <Button variant="ghost" render={<Link href="/settings/security" />}>
            Cancel
          </Button>
        </div>
      </form>
    </Shell>
  )
}

/* ── Step 2: scan it, then prove it worked ──────────────────────────────── */

function ScanStep({
  secret,
  qrCodeImage,
  formAction,
  pending,
  state,
}: {
  secret: string
  qrCodeImage: string
  formAction: (formData: FormData) => void
  pending: boolean
  state: ConfirmState
}) {
  return (
    <Shell>
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Scan this with your authenticator app
        </h1>
        <p className="text-sm text-muted-foreground">
          Open the app, add a new account, and point the camera at this code.
        </p>
      </header>

      {/* White regardless of theme: a QR code needs light quiet space around
          the pattern to stay scannable, and the PNG itself has none to spare. */}
      <div className="flex w-fit items-center justify-center rounded-xl border bg-white p-4 shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element -- a data: URL
            from the backend. next/image cannot optimise one, and would demand
            explicit dimensions in exchange for nothing. */}
        <img
          src={qrCodeImage}
          alt="QR code containing your two-factor setup key. The same key is written out below."
          className="size-44"
        />
      </div>

      <SecretBlock secret={secret} />

      {/* The confirm field sits on this screen rather than the next one: the
          user has their app open and a code in front of them, and a separate
          route would remount this component and throw the secret away. */}
      <form
        action={formAction}
        className="flex flex-col gap-3 border-t pt-5"
      >
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-medium">
            Enter the 6-digit code from the app
          </h2>
          <p className="text-sm text-muted-foreground">
            This is what proves the scan worked. Two-factor is switched on once
            it is accepted.
          </p>
        </div>

        {state.message ? <ErrorBanner>{state.message}</ErrorBanner> : null}

        <InputOTP
          name="code"
          maxLength={6}
          disabled={pending}
          autoFocus
          aria-invalid={Boolean(state.fieldErrors?.code)}
          containerClassName="gap-2"
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

        {state.fieldErrors?.code ? (
          <FieldError>{state.fieldErrors.code}</FieldError>
        ) : null}

        <div className="flex items-center gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Checking…" : "Turn on two-factor"}
          </Button>
          <Button variant="ghost" render={<Link href="/settings/security" />}>
            Cancel
          </Button>
        </div>
      </form>

      <p className="text-xs">
        <Link
          href="/settings/security"
          className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3" aria-hidden />
          Back to security
        </Link>
      </p>
    </Shell>
  )
}

/**
 * The seed in text, always visible rather than tucked behind a "can't scan?"
 * toggle — it is the only route in for anyone without a working camera, and
 * the only part of this screen a screen reader can convey.
 */
function SecretBlock({ secret }: { secret: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(secret)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access can be refused outright; the text is selectable, so
      // there is still a way through.
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted-foreground">
        Can&apos;t scan it? In your app choose{" "}
        <strong className="font-medium text-foreground">
          &ldquo;Enter a setup key&rdquo;
        </strong>{" "}
        and type this:
      </p>

      <div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-2">
        <code className="min-w-0 flex-1 font-mono text-sm break-all select-all">
          {secret}
        </code>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={copy}
          className="shrink-0 bg-card"
        >
          {copied ? <Check data-icon="inline-start" /> : <Copy data-icon="inline-start" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
    </div>
  )
}

/* ── Step 3: the one screen that cannot be shown twice ──────────────────── */

/**
 * Recovery codes, in the only moment they exist as plaintext.
 *
 * <p>The database holds bcrypt hashes, so nothing — not this app, not an
 * administrator, not someone with the database — can produce these again. A
 * refresh loses them for good, which is why leaving is gated behind an explicit
 * acknowledgement rather than a link someone can click past.
 */
function RecoveryCodesStep({
  codes,
  email,
}: {
  codes: string[]
  email: string
}) {
  const router = useRouter()
  const [saved, setSaved] = useState(false)

  function finish() {
    // refresh() first so the security page re-runs requireUser() and reports
    // two-factor as on; without it the row could paint from a cached payload
    // taken before enrolment.
    router.refresh()
    router.push("/settings/security")
  }

  return (
    <Shell>
      <header className="flex flex-col gap-1">
        <div className="mb-2 flex size-9 items-center justify-center rounded-lg border bg-card shadow-sm">
          <KeyRound className="size-4" aria-hidden />
        </div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Save your recovery codes
        </h1>
        <p className="text-sm text-muted-foreground">
          Two-factor authentication is now on. These codes are how you get back
          in if you lose your phone.
        </p>
      </header>

      <RecoveryCodesPanel codes={codes} email={email} />

      <label className="flex items-start gap-2.5 text-sm">
        <input
          type="checkbox"
          checked={saved}
          onChange={(event) => setSaved(event.target.checked)}
          className="mt-0.5 size-4 shrink-0 accent-primary"
        />
        <span>I have saved these codes somewhere safe</span>
      </label>

      <div>
        <Button type="button" onClick={finish} disabled={!saved}>
          Finish
        </Button>
      </div>
    </Shell>
  )
}

/* ── Shared bits ────────────────────────────────────────────────────────── */

function ErrorBanner({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      aria-live="polite"
      className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
    >
      {children}
    </p>
  )
}

/** Shared column so every step sits on the same measure. */
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full max-w-lg flex-col gap-5 p-6">{children}</div>
  )
}

export { TwoFactorSetupFlow }
