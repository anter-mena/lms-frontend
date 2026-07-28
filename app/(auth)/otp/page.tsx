import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, MailCheck } from "lucide-react"

import { OtpForm } from "@/components/otp/otp-form"

export const metadata: Metadata = {
  title: "Verify your email",
}

export default function OtpPage() {
  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/login"
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to sign in
      </Link>

      <div className="flex flex-col gap-1.5">
        <span className="mb-2 flex size-10 items-center justify-center rounded-full bg-muted">
          <MailCheck className="size-5" />
        </span>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Check your email
        </h1>
        <p className="text-sm text-muted-foreground">
          We sent a 6-digit code to{" "}
          <span className="font-medium text-foreground">s•••••@lumen.com</span>.
          It expires in 10 minutes.
        </p>
      </div>

      <OtpForm />
    </div>
  )
}
