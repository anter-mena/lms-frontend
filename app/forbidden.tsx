import Link from "next/link"
import { ShieldX } from "lucide-react"

import { ErrorState } from "@/components/error/errorState"
import { Button } from "@/components/ui/button"

/**
 * Rendered when a Server Component calls `forbidden()` — the user is signed in,
 * but their role doesn't cover this screen. Distinct from 401 on purpose:
 * telling someone to sign in again when they're already signed in sends them
 * round a loop that can never succeed.
 */
export default function Forbidden() {
  return (
    <ErrorState
      code="403"
      icon={ShieldX}
      title="You don't have access to this"
      description="Your role doesn't include this area. Some access can be granted to you individually and some — Management, for instance — comes only with being an administrator. An administrator can tell you which this is."
    >
      <Button size="lg" render={<Link href="/dashboard" />}>
        Go to dashboard
      </Button>
      <Button variant="outline" size="lg" render={<Link href="/help-center" />}>
        Request access
      </Button>
    </ErrorState>
  )
}
