import type { Metadata } from "next"

import { LoginForm } from "@/components/login/login-form"
import { SsoButtons } from "@/components/login/sso-buttons"
import { FieldSeparator } from "@/components/ui/field"

export const metadata: Metadata = {
  title: "Sign in",
}

/**
 * Sign-in screen. `/` redirects here — this is an internal platform, so there
 * is no public landing page in front of it.
 */
export default function LoginPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Sign in to your account
        </h1>
        <p className="text-sm text-muted-foreground">
          Pick up where you left off in your courses.
        </p>
      </div>

      <SsoButtons />

      <FieldSeparator>or sign in with email</FieldSeparator>

      <LoginForm />
    </div>
  )
}
