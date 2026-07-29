import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy",
}

/** Stub. Linked from the auth footer — exists so that link is not a 404. */
export default function PrivacyPage() {
  return (
    <>
      <h1 className="font-heading text-2xl font-semibold tracking-tight">
        Privacy Policy
      </h1>
      <p className="text-sm text-muted-foreground">Content to come.</p>
    </>
  )
}
