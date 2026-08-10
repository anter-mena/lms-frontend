"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useActionState, useRef, useState } from "react"
import {
  Check,
  Copy,
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
} from "lucide-react"

import { logout } from "@/app/(app)/actions"
import {
  confirmSetup,
  startSetup,
  type ConfirmState,
  type SetupState,
} from "@/app/(auth)/two-factor/actions"
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
function TwoFactorSetupFlow({
  email,
  alreadyEnrolled,
}: {
  email: string
  alreadyEnrolled: boolean
}) {
  const [setupState, startAction, startPending] = useActionState(
    startSetup,
    initialSetupState
  )
  const [confirmState, confirmAction, confirmPending] = useActionState(
    confirmSetup,
    initialConfirmState
  )

  // Checked before anything else, and that ordering is the whole point.
  // Succeeding at enrolment re-renders the page with `alreadyEnrolled` true; if
  // that were tested first, the codes would vanish at the exact moment they were
  // produced — and they exist nowhere else, ever.
  if (confirmState.recoveryCodes) {
    return <RecoveryCodesStep codes={confirmState.recoveryCodes} email={email} />
  }

  // Arrived here with 2FA already on, without going through the flow. Nothing to
  // do: /2fa/setup answers 409, so offering the button would only produce an
  // error. A dead end deserves a door, not a bounce.
  if (alreadyEnrolled) {
    return <AlreadyEnrolled />
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
      email={email}
    />
  )
}

/** Reached only by navigating here directly with 2FA already switched on. */
function AlreadyEnrolled() {
  return (
    <Shell>
      <header className="flex flex-col gap-1">
        <div className="mb-2 flex size-9 items-center justify-center rounded-lg border bg-card shadow-sm">
          <ShieldCheck className="size-4" aria-hidden />
        </div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Two-factor authentication is already on
        </h1>
        <p className="text-sm text-muted-foreground">
          Nothing to set up. Signing in already asks for a code from your
          authenticator app.
        </p>
      </header>

      <div>
        <Button render={<Link href="/dashboard" />}>Continue to the app</Button>
      </div>
    </Shell>
  )
}

/* ── Step 1: what this is, and a button that starts it ──────────────────── */

function IntroStep({
  formAction,
  pending,
  message,
  email,
}: {
  formAction: (formData: FormData) => void
  pending: boolean
  message?: string
  email: string
}) {
  return (
    <Shell>
      {/* States the rule before anything else. There is no Cancel on this
          screen and nothing behind it — saying so plainly is kinder than
          letting someone hunt for a way past it. */}
      <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
        <p className="text-sm text-destructive">
          <strong className="font-medium">
            Two-factor authentication is required.
          </strong>{" "}
          No action is permitted on this account until it is switched on.
        </p>
      </div>

      <header className="flex flex-col gap-1">
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

        <div>
          <Button type="submit" disabled={pending}>
            {pending ? "Preparing…" : "Set up two-factor"}
          </Button>
        </div>
      </form>

      {/* The escape hatch, and not optional. The commonest reason to be stuck
          on this screen is being signed in as the wrong account — a shared
          machine, or the browser filling in the other address. Without this,
          that mistake has no exit but clearing cookies. */}
      <form action={logout} className="border-t pt-4 text-xs">
        <span className="text-muted-foreground">
          Signed in as <span className="text-foreground">{email}</span>.{" "}
        </span>
        <button
          type="submit"
          className="text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Sign out
        </button>
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
  const formRef = useRef<HTMLFormElement>(null)

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
        ref={formRef}
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

        {/* Submits itself on the sixth digit. A TOTP code lives about 30
            seconds, so making someone reach for a button after typing it is a
            real chance of it expiring between the typing and the clicking.
            Guarded on `pending` so a stray re-fire cannot double-submit. */}
        <InputOTP
          name="code"
          maxLength={6}
          disabled={pending}
          autoFocus
          onComplete={() => {
            if (!pending) formRef.current?.requestSubmit()
          }}
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

        {/* No Cancel. There is nowhere to cancel to — every other page bounces
            an un-enrolled account straight back here, so a button promising
            escape would just blink and return. Signing out is the only genuine
            way off this screen, and it is offered below. */}
        <div>
          <Button type="submit" disabled={pending}>
            {pending ? "Checking…" : "Turn on two-factor"}
          </Button>
        </div>
      </form>

      <form action={logout} className="border-t pt-4 text-xs">
        <span className="text-muted-foreground">Wrong account? </span>
        <button
          type="submit"
          className="text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Sign out
        </button>
      </form>
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
    // The app, not the security settings page. Enrolment used to live inside
    // Settings, so finishing returned you to where you had come from. It is a
    // mandatory gate now — this person has never seen Settings and did not
    // choose to be here. What they wanted was the app, and this is the first
    // moment they are allowed into it.
    //
    // refresh() first so the destination re-reads the user with the new token
    // rather than painting from a payload fetched while 2FA was still off.
    router.refresh()
    router.push("/dashboard")
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
