import type { Metadata } from "next"

import { PageHeader } from "@/components/layout/pageHeader"
import { UsersFilter } from "@/components/users/usersFilter"
import { UsersTable, type UserRow } from "@/components/users/usersTable"
import { apiFetch } from "@/lib/api"
import { requireUser } from "@/lib/auth"

export const metadata: Metadata = {
  title: "User management",
}

/**
 * ⚠️ Flip to `false` to show the real accounts from the backend.
 *
 * <p>Typed as `boolean` rather than inferred, or TypeScript narrows it to the
 * literal `true` and marks the live branch below as unreachable — which is
 * exactly the code that must not rot while this is switched on.
 */
const USE_PLACEHOLDER_USERS: boolean = true

/**
 * ⚠️ Invented people, for looking at the table with.
 *
 * <p>The real accounts are six test users who are all ACTIVE with 2FA on, so
 * they exercise one row style out of six. This set deliberately covers every
 * state the table can render — each status, both 2FA states, all three roles,
 * and long names against short ones — because those are the rows that break a
 * layout, and none of them exist yet in the real data.
 */
const PLACEHOLDER_USERS: UserRow[] = [
  { id: 1, firstName: "Sarah", lastName: "Amrani", email: "sarah.amrani@nordencapital.com", role: "ADMIN", status: "ACTIVE", mfaEnabled: true },
  { id: 2, firstName: "Youssef", lastName: "Benali", email: "youssef.benali@nordencapital.com", role: "MANAGER", status: "ACTIVE", mfaEnabled: true },
  { id: 3, firstName: "Imane", lastName: "Belkacem", email: "imane.belkacem@nordencapital.com", role: "MANAGER", status: "ACTIVE", mfaEnabled: true },
  { id: 4, firstName: "Thomas", lastName: "Van Der Berg", email: "thomas.vanderberg@nordencapital.com", role: "MEMBER", status: "ACTIVE", mfaEnabled: false },
  { id: 5, firstName: "Nadia", lastName: "Cherkaoui", email: "nadia.cherkaoui@nordencapital.com", role: "MEMBER", status: "PENDING_VERIFICATION", mfaEnabled: false },
  { id: 6, firstName: "Marcus", lastName: "Lindqvist", email: "marcus.lindqvist@nordencapital.com", role: "MEMBER", status: "ACTIVE", mfaEnabled: true },
  { id: 7, firstName: "Fatima", lastName: "El Idrissi", email: "fatima.elidrissi@nordencapital.com", role: "MANAGER", status: "ACTIVE", mfaEnabled: true },
  { id: 8, firstName: "Daniel", lastName: "Okonkwo", email: "daniel.okonkwo@nordencapital.com", role: "MEMBER", status: "SUSPENDED", mfaEnabled: true },
  { id: 9, firstName: "Léa", lastName: "Moreau", email: "lea.moreau@nordencapital.com", role: "MEMBER", status: "ACTIVE", mfaEnabled: false },
  { id: 10, firstName: "Karim", lastName: "Ouazzani", email: "karim.ouazzani@nordencapital.com", role: "MEMBER", status: "PENDING_VERIFICATION", mfaEnabled: false },
  { id: 11, firstName: "Sofia", lastName: "Hernández", email: "sofia.hernandez@nordencapital.com", role: "MEMBER", status: "ACTIVE", mfaEnabled: true },
  { id: 12, firstName: "James", lastName: "Whitfield", email: "james.whitfield@nordencapital.com", role: "MEMBER", status: "SUSPENDED", mfaEnabled: false },
]

/**
 * Everyone with an account, and what may be done to them.
 *
 * <p>Lives at `/users` because that is where the sidebar has pointed since it was
 * written — the link has been a 404 until now.
 *
 * <p>Guarded by `requireUser()` like every other signed-in page. That is not the
 * whole story though: reading the user list needs the `USER:READ` permission,
 * which only ADMIN and MANAGER hold, so a MEMBER reaching this page would be
 * refused by the backend rather than by the route. Deciding what a MEMBER should
 * see here — a plain refusal, or no sidebar entry at all — is part of building
 * this properly.
 */
export default async function UsersPage({
  searchParams,
}: {
  // Filters travel in the URL so the button beside the title and the table below
  // it need no shared state — see UsersFilter.
  searchParams: Promise<{ role?: string; status?: string; mfa?: string }>
}) {
  await requireUser()

  const filters = await searchParams

  // Fetched here rather than in the table, so the token stays on the server and
  // the list is in the first paint instead of arriving after one.
  //
  // Still fetched while placeholders are on: it keeps the request, the typing
  // and the 403 branch honest, so switching back is one constant rather than a
  // rediscovery of whatever broke in the meantime.
  const result = await apiFetch<UserRow[]>("/api/users", { authenticated: true })
  const users = USE_PLACEHOLDER_USERS
    ? PLACEHOLDER_USERS
    : result.ok
      ? result.data
      : []

  return (
    // h-full + overflow-hidden: this page takes exactly the room the shell gives
    // it and never more, so nothing here scrolls except the table, which manages
    // its own. Without the height cap the table has nothing to be shorter than
    // and simply grows until the page scrolls again.
    // pb-3 rather than a uniform p-6: the footer sits directly under this, and a
    // full 24px above a border that is itself only a few pixels from the bottom
    // of the window left the two looking unrelated.
    <div className="flex h-full flex-col gap-6 overflow-hidden p-6 pb-3">
      {/* No back chevron: this is where /users/new and /users/[id] go back to. */}
      <PageHeader
        title="User management"
        description="Accounts, roles, and access."
        actions={<UsersFilter />}
      />

      {/* Listing users needs USER:READ, which a MEMBER does not hold. Saying so
          plainly beats an empty table that looks like the company has nobody in
          it — and beats crashing the page over a permission working correctly. */}
      {USE_PLACEHOLDER_USERS || result.ok ? (
        <UsersTable users={users} filters={filters} />
      ) : (
        <div className="rounded-xl border bg-card p-8 text-center">
          <p className="text-sm font-medium">Cannot show the user list</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {result.error.status === 403
              ? "Your role does not include permission to view user accounts."
              : result.error.message}
          </p>
        </div>
      )}
    </div>
  )
}
