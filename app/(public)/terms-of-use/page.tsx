import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Use",
}

/** Stub. Linked from the auth footer — exists so that link is not a 404. */
export default function TermsPage() {
  return (
    <>
      <h1 className="font-heading text-2xl font-semibold tracking-tight">
        Terms of Use
      </h1>
      <p className="text-sm text-muted-foreground">Content to come.</p>
    </>
  )
}
