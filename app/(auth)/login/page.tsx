import type { Metadata } from "next"
import Link from "next/link"
import { GalleryVerticalEnd } from "lucide-react"

import { LoginForm } from "@/components/login/loginForm"
import { TopBanner } from "@/components/ui/topBanner"
import { redirectIfAuthenticated } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Sign in",
}

/**
 * Why someone was sent back here, when it was not their own doing.
 *
 * <p>Arriving at a blank sign-in form after typing six digits is baffling, and
 * silence invites the reasonable conclusion that the site is broken. Anything
 * not in this map renders nothing — the reason arrives in the URL, so it can be
 * anything at all, and unknown values must not be echoed back onto the page.
 */
const REASONS: Record<string, string> = {
  expired:
    "That sign-in took too long and has expired. Please enter your details again.",
  cancelled: "Sign-in cancelled. You can sign in with a different account below.",
  "session-expired": "You have been signed out. Please sign in again to continue.",
}

/**
 * Sign-in screen. `/` redirects here — this is an internal platform, so there
 * is no public landing page in front of it, and nothing on this page links
 * "back home".
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>
}) {
  // Someone already signed in has no use for this form. A stale cookie falls
  // through to it rather than bouncing, which is what stops this and
  // /dashboard redirecting at each other forever.
  await redirectIfAuthenticated()

  const notice = REASONS[(await searchParams).reason ?? ""]

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
            href="/help-center"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Contact IT support
          </Link>
        </p>
      </div>

      {/* Informational, not an error: nothing went wrong and nobody did anything
          incorrectly, so it is deliberately not the destructive red the form
          uses for a rejected password. */}
      {notice ? <TopBanner message={notice} /> : null}

      <LoginForm />
    </div>
  )
}
