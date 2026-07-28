import Link from "next/link"

import { Button } from "@/components/ui/button"
import { FieldDescription } from "@/components/ui/field"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp"

const SLOT_CLASS = "size-11 rounded-lg border text-base md:size-12"

function OtpForm() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        {/* Slots are enlarged past the 32px default — this is a one-shot,
            high-stakes input and it deserves a comfortable target. */}
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

        <Button
          size="lg"
          className="h-10 w-full"
          render={<Link href="/dashboard" />}
        >
          Verify and continue
        </Button>
      </div>

      <div className="flex flex-col gap-2 text-center">
        <FieldDescription className="text-center">
          Didn&apos;t get the code? Resend in{" "}
          <span className="tabular-nums text-foreground">0:28</span>
        </FieldDescription>
        <FieldDescription className="text-center">
          <Link href="/login" className="text-foreground">
            Use a different email
          </Link>
        </FieldDescription>
      </div>
    </div>
  )
}

export { OtpForm }
