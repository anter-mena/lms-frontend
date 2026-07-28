"use client" // Error boundaries must be Client Components

import { RotateCw, ServerCrash } from "lucide-react"

import { ErrorState } from "@/components/error/error-state"
import { Button } from "@/components/ui/button"

// This file replaces the root layout when it renders, so it has to pull in
// global styles itself. Fonts are deliberately left to the system stack — this
// screen only appears when the app is already broken, so fewer moving parts.
import "./globals.css"

/**
 * Last line of defence: catches errors thrown by the root layout itself, which
 * `app/error.tsx` cannot reach. Must render its own <html> and <body>.
 * Metadata exports are unsupported here, hence the React <title>.
 */
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-background text-foreground">
        <title>Something went wrong · Lumen</title>

        <ErrorState
          code="500"
          icon={ServerCrash}
          title="The application failed to load"
          description="Something broke before the page could render. Reloading may fix it — if not, IT will need the reference below."
        >
          <Button size="lg" onClick={() => unstable_retry()}>
            <RotateCw data-icon="inline-start" />
            Try again
          </Button>

          {error.digest && (
            <p className="w-full pt-2 text-center font-mono text-xs text-muted-foreground">
              Reference: {error.digest}
            </p>
          )}
        </ErrorState>
      </body>
    </html>
  )
}
