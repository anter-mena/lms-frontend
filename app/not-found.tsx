import Link from "next/link"
import { FileQuestion } from "lucide-react"

import { ErrorState } from "@/components/error/errorState"
import { Button } from "@/components/ui/button"

/**
 * Serves both unmatched URLs and any `notFound()` call. The app has a single
 * root layout, so this composes cleanly — no need for `globalNotFound`.
 */
export default function NotFound() {
  return (
    <ErrorState
      code="404"
      icon={FileQuestion}
      title="We can't find that page"
      description="The link may be broken, or the course or lesson it pointed to has since been removed."
    >
      <Button size="lg" render={<Link href="/dashboard" />}>
        Go to dashboard
      </Button>
      <Button variant="outline" size="lg" render={<Link href="/help-center" />}>
        Contact IT support
      </Button>
    </ErrorState>
  )
}
