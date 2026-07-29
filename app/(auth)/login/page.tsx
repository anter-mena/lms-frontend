import type { Metadata } from "next"
import Link from "next/link"
import { GalleryVerticalEnd } from "lucide-react"

import { LoginForm } from "@/components/login/loginForm"

export const metadata: Metadata = {
  title: "Sign in",
}

/**
 * Sign-in screen. `/` redirects here — this is an internal platform, so there
 * is no public landing page in front of it, and nothing on this page links
 * "back home".
 */
export default function LoginPage() {
  return (
    <div className="mx-auto flex w-full max-w-xs flex-col gap-4">
      <div className="flex flex-col items-center gap-2 text-center">
        {/* Decorative: aria-hidden because the h1 right below already names the
            company, so announcing it again would just be noise. Not a link —
            there is no home page to point it at. The border is what makes the
            card read in light mode, where --card and --background are both
            white; in dark mode the fill carries it on its own. */}
        <div className="mb-1 flex size-9 items-center justify-center rounded-lg border bg-card shadow-sm">
          <GalleryVerticalEnd className="size-4" aria-hidden />
        </div>
        <h1 className="font-heading text-lg font-bold tracking-tight text-balance">
          Welcome to Norden Capital
        </h1>
        {/* Where a consumer product would put "Don't have an account? Sign up".
            Accounts here are provisioned internally, so the only dead end worth
            catching is someone who already has one and can't get in. */}
        <p className="text-xs text-muted-foreground">
          Can&apos;t access your account?
          <br />
          <Link
            href="/support"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Contact IT support
          </Link>
        </p>
      </div>

      <LoginForm />
    </div>
  )
}
