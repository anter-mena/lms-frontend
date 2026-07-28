"use client" // Error boundaries must be Client Components

import { useEffect } from "react"
import Link from "next/link"
import { RotateCw, TriangleAlert } from "lucide-react"

import { ErrorState } from "@/components/error/error-state"
import { Button } from "@/components/ui/button"

/**
 * Catches runtime errors anywhere below the root layout — the 500-class case.
 * Note: Next 16 renamed this boundary's recovery prop to `unstable_retry`;
 * it is no longer `reset`.
 */
export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    // Swap for the real reporter (Sentry, Datadog) once one is wired up.
    console.error(error)
  }, [error])

  return (
    <ErrorState
      code="500"
      icon={TriangleAlert}
      title="Something went wrong on our end"
      description="This isn't your fault. Trying again usually works — if it doesn't, send IT the reference below."
    >
      <Button size="lg" onClick={() => unstable_retry()}>
        <RotateCw data-icon="inline-start" />
        Try again
      </Button>
      <Button variant="outline" size="lg" render={<Link href="/dashboard" />}>
        Go to dashboard
      </Button>

      {/* The digest is the only thread tying this screen to a server log. */}
      {error.digest && (
        <p className="w-full pt-2 text-center font-mono text-xs text-muted-foreground">
          Reference: {error.digest}
        </p>
      )}
    </ErrorState>
  )
}
