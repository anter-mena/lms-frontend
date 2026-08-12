import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PageHeader } from "@/components/layout/pageHeader"
import { UserDetail } from "@/components/users/userDetail"
import { requireUser } from "@/lib/auth"
import { getUser } from "@/lib/users"

export const metadata: Metadata = {
  title: "User details",
}

/**
 * One person, in full.
 *
 * <p>A page rather than a drawer. The two were weighed earlier: a drawer keeps
 * the list visible and suits a quick edit, but this screen has to hold a role, a
 * status, two-factor state and a per-user permission grid — which is more than a
 * side panel can show without becoming a page in a panel's clothing. Being a URL
 * also means a row can be linked to, which is how anyone actually asks a
 * colleague about an account.
 *
 * <p>Refusing a member is middleware's job, not this page's: the whole `/users`
 * tree is admin-only, and middleware is the last moment a real 403 can still be
 * returned — by the time a page runs the layout has already started streaming a
 * 200.
 */
export default async function UserDetailPage({
  params,
}: {
  // A promise since Next 15. Awaiting it is what marks the route dynamic.
  params: Promise<{ id: string }>
}) {
  await requireUser()

  const { id } = await params
  const result = await getUser(id)

  if (!result.ok) {
    // 404 covers both "no such account" and a hand-typed `/users/banana`, which
    // are the same thing from a reader's point of view. Anything else is an
    // outage and should be thrown rather than dressed up as a missing person.
    if (result.error.status === 404 || result.error.status === 400) notFound()
    throw new Error(result.error.message)
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-5 overflow-hidden p-6 pb-3">
      {/* The navbar builds a breadcrumb from the path, so it already reads
          "users › 12" up there. The chevron is the deliberate way back to the
          list — a breadcrumb is a location, not a control.

          No description: the name and id sit at the top of the left column,
          where the layout puts the identity. Repeating them here would be the
          same two facts twice within 60 pixels. */}
      <PageHeader
        title="User details"
        backHref="/users"
        backLabel="Back to users"
      />

      {/* No `activity` passed, and that is not an omission — nothing in the
          system records what an account did. The panel says so plainly rather
          than showing an empty list, which would read as "this person has done
          nothing". It needs an `audit_log` table first. */}
      <UserDetail user={result.data} />
    </div>
  )
}
