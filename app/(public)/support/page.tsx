import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Support",
}

/**
 * Stub. The most-linked of the three — the navbar, the login and OTP screens,
 * and the 404/403 pages all send people here, so it is the one worth filling in
 * first. Someone who lands here is usually already stuck.
 */
export default function SupportPage() {
  return (
    <>
      <h1 className="font-heading text-2xl font-semibold tracking-tight">
        Support
      </h1>
      <p className="text-sm text-muted-foreground">Content to come.</p>
    </>
  )
}
