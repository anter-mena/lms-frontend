import type { Metadata } from "next"

import { PageHeader } from "@/components/layout/pageHeader"
import { RolesMatrix } from "@/components/roles/rolesMatrix"
import {
  PERMISSIONS_FORM_ID,
  UserPermissionEditor,
} from "@/components/roles/userPermissionEditor"
import { Button } from "@/components/ui/button"
import { requireUser } from "@/lib/auth"
import { placeholderUser } from "@/lib/placeholderUsers"

export const metadata: Metadata = {
  title: "Permissions",
}

/**
 * Permissions — for one person if the address names one, otherwise for the roles.
 *
 * <p><b>Reached by doing something, not by browsing.</b> It is deliberately not
 * in the sidebar any more. "Change permissions" on a user — from the row menu or
 * from their own page — links here with `?user=12`, and that is what tells this
 * page whose permissions to show. A permissions screen with no person attached
 * has the obvious problem that it cannot know which of twelve accounts you meant,
 * which is exactly the hole this closes.
 *
 * <p>Without a `user` it still renders something: the roles matrix, which is what
 * permissions mean before anybody is given anything. That is the honest fallback
 * for whoever arrives on the bare URL, and worth keeping — it is the only place
 * the model itself is written down.
 *
 * <p>⚠️ <b>Nothing saves.</b> No endpoint writes `user_permissions`, and none
 * changes what a role grants. Blocker #2 on the bug list.
 *
 * <p>⚠️ <b>The database does not agree with the roles view.</b>
 * `V2__seed_roles_and_permissions.sql` seeds <em>three</em> roles — ADMIN,
 * MANAGER and MEMBER — and gives MEMBER `RECORD:READ` outright. The product
 * decision is two roles with MEMBER granting nothing, which is what
 * `lib/permissions.ts` and therefore this page describe. Reconciling that is a
 * migration, and it has to happen before any of this is wired up.
 */
export default async function PermissionsPage({
  searchParams,
}: {
  // The person travels in the URL rather than in state. That is what lets a menu
  // item in a table open this page at all, and what makes a half-finished change
  // survive a refresh or a link sent to a colleague.
  searchParams: Promise<{ user?: string }>
}) {
  await requireUser()

  const { user: userId } = await searchParams
  const id = Number(userId)
  // Only a real, positive id counts. "?user=" or "?user=abc" falls through to
  // the roles view rather than rendering a page about account zero.
  const user =
    userId && Number.isFinite(id) && id > 0 ? placeholderUser(id) : null

  return (
    // min-h-0 alongside h-full: a flex child's minimum is its content by default,
    // which would let it grow past the height just set and hand the scroll back
    // to the shell. This pair keeps the scrolling inside the panel below.
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden p-6 pb-3">
      {user ? (
        <>
          <PageHeader
            title="Change permissions"
            // The name goes here, not in a card underneath. The page is about
            // one person, and the header is where every other screen says who
            // or what it is about.
            description={`${user.firstName} ${user.lastName} · ${user.email}`}
            // Back to the person, not to the list. This page was opened from
            // them, and their page is where the change gets checked.
            backHref={`/users/${user.id}`}
            backLabel="Back to this account"
            actions={
              <Button
                type="submit"
                form={PERMISSIONS_FORM_ID}
                className="rounded-md"
              >
                Save permissions
              </Button>
            }
          />

          <UserPermissionEditor user={user} />
        </>
      ) : (
        <>
          <PageHeader
            title="Roles & permissions"
            description="What each role grants on its own. To change one person's access, open their account."
          />

          {/* The table and nothing else. The cards and the notice that used to
              sit here said in four paragraphs what the grid says in ticks. */}
          <RolesMatrix />
        </>
      )}
    </div>
  )
}
