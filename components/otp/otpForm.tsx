import Link from "next/link"
import { ArrowLeft, ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { FieldDescription } from "@/components/ui/field"
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

function OtpForm() {
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
          Open your authenticator app and enter the 6-digit code for Norden
          Capital.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <InputOTP maxLength={6} containerClassName="justify-between gap-2">
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

        <Button className="w-full" render={<Link href="/dashboard" />}>
          Verify and continue
        </Button>
      </div>

      {/* No "resend", no "use a different email": a TOTP code is generated on
          the device and rotates on its own, so there is nothing for the server
          to send again. Losing the device is the real dead end here. */}
      <div className="flex flex-col gap-2">
        <FieldDescription className="text-center">
          Your code changes every 30 seconds.
        </FieldDescription>
        <FieldDescription className="text-center">
          Lost access to your device?{" "}
          <Link href="/support" className="text-foreground">
            Contact IT support
          </Link>
        </FieldDescription>
      </div>

      <p className="text-center text-xs">
        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3" aria-hidden />
          Back to sign in
        </Link>
      </p>
    </div>
  )
}

export { OtpForm }
