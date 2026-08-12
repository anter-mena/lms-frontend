import Link from "next/link"
import { ShieldX } from "lucide-react"

import { ErrorState } from "@/components/error/errorState"
import { Button } from "@/components/ui/button"

/**
 * Management, refused.
 *
 * <p>Reached only by a middleware rewrite, so the address bar still says the page
 * that was asked for and the response carries a real 403. Nothing links here.
 *
 * <p>Separate from `app/forbidden.tsx`, which Next renders when a Server
 * Component calls `forbidden()`. That one still exists and still fires — but the
 * app layout streams before a page runs, so by then the 200 has already gone out.
 * This is the version that can still choose a status.
 *
 * <p>The copy is specific on purpose. "Ask your administrator for access" is the
 * usual line and it is wrong here: Management is admin-only in the database, so
 * there is nobody who can grant it one permission at a time. Sending somebody to
 * ask for something impossible wastes their afternoon and their colleague's.
 */
export default function NoAccess() {
  return (
    <ErrorState
      code="403"
      icon={ShieldX}
      title="This is for administrators"
      description="Managing accounts comes with being an administrator — it is not something that can be granted to you one permission at a time. If you need it, somebody has to change your role."
    >
      <Button size="lg" render={<Link href="/dashboard" />}>
        Go to dashboard
      </Button>
      <Button variant="outline" size="lg" render={<Link href="/help-center" />}>
        Help centre
      </Button>
    </ErrorState>
  )
}
