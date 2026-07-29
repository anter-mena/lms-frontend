import Link from "next/link"
import { ArrowLeft } from "lucide-react"

/**
 * Shell for pages reachable whether or not you are signed in.
 *
 * They cannot live under `(app)` — the auth screens link to them, and that
 * shell assumes a session and renders the whole nav. They do not belong under
 * `(auth)` either, since they are not steps in the sign-in flow and should not
 * carry its brand panel. Hence their own group and this deliberately thin
 * chrome.
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b px-6">
        {/* Points at /dashboard rather than /login so one link is right in both
            states: signed in it lands on the app, signed out the dashboard's
            own auth check bounces it to /login. */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back
        </Link>

        <span className="ml-auto font-heading text-sm font-semibold tracking-tight">
          Norden Capital
        </span>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-3 px-6 py-10">
        {children}
      </main>
    </div>
  )
}
