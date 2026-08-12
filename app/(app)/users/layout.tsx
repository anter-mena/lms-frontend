import { AccessProvider } from "@/components/access/accessProvider"
import { getPermissionCatalogue, getRoles } from "@/lib/users"

/**
 * Loads the permission model for every screen under `/users`.
 *
 * <p>A layout rather than a fetch in each page: the picker, the matrix, the role
 * dialog and the filter panel all need it, and they are spread across five
 * routes. Fetching here means one place to change and one request per navigation
 * instead of four.
 *
 * <p>The two calls run together rather than one after the other — they do not
 * depend on each other, and awaiting them in sequence would make every user
 * screen wait for the sum rather than the slower of the two.
 *
 * <p>⚠️ Refetched on each navigation. The catalogue is written by migration and
 * never changes at runtime, so this is pure waste — but `apiFetch` is
 * `no-store` throughout, deliberately, because everything else it carries is
 * per-user and must never be cached. Giving it a cacheable mode is worth doing
 * once there is a second thing that needs one.
 */
export default async function UsersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [catalogue, roles] = await Promise.all([
    getPermissionCatalogue(),
    getRoles(),
  ])

  return (
    <AccessProvider
      // Empty rather than thrown on failure. A member reaching any of these is
      // already being turned away by middleware, and an administrator hitting a
      // backend outage should see the page's own error, not this one's.
      groups={catalogue.ok ? catalogue.data.groups : []}
      roles={roles.ok ? roles.data : []}
    >
      {children}
    </AccessProvider>
  )
}
