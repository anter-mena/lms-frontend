import { ShieldX } from "lucide-react"

/**
 * A module somebody does not hold the permission for.
 *
 * <p>Names the permission rather than saying "access denied". Whoever is looking
 * at this has to go and ask somebody for something, and "I cannot open Search
 * performance" starts a much longer conversation than "I need
 * SEO_OVERVIEW:READ".
 *
 * <p>Inside the page rather than the full-page 403, on purpose. Management is a
 * whole area nobody outside it should see, so middleware turns those away before
 * anything renders. These are ordinary modules where the sidebar link is
 * reasonable to have: the person belongs in the app, just not in this one screen,
 * and keeping the chrome around them says that.
 */
function PermissionRefused({
  module,
  permission,
}: {
  /** What they were trying to open, in the words the menu uses. */
  module: string
  /** The `RESOURCE:ACTION` string, as an administrator would tick it. */
  permission: string
}) {
  return (
    <div className="flex flex-1 items-start justify-center pt-10">
      <div className="flex max-w-md flex-col items-center gap-2 rounded-md border bg-card p-8 text-center">
        <ShieldX className="size-5 text-warning" aria-hidden />
        <p className="text-sm font-medium">You cannot open {module}</p>
        <p className="text-sm text-muted-foreground">
          This needs the{" "}
          <span className="font-mono text-xs">{permission}</span> permission,
          which your account does not have. An administrator can grant it from
          your account page.
        </p>
      </div>
    </div>
  )
}

export { PermissionRefused }
