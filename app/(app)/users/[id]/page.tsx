import type { Metadata } from "next"

import { PageHeader } from "@/components/layout/pageHeader"
import { UserDetail } from "@/components/users/userDetail"
import { requireUser } from "@/lib/auth"
import { placeholderUser } from "@/lib/placeholderUsers"

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
 * <p>⚠️ <b>Fed a placeholder.</b> `GET /api/users/{id}` does not exist — the
 * backend only lists everyone — so this shows the same invented person whatever
 * id is in the URL, with only the id itself taken from the address. The layout is
 * the deliverable here; the wiring waits on the endpoint.
 */
const USE_PLACEHOLDER_USER: boolean = true

export default async function UserDetailPage({
  params,
}: {
  // A promise since Next 15. Awaiting it is what marks the route dynamic.
  params: Promise<{ id: string }>
}) {
  await requireUser()

  const { id } = await params
  const user = placeholderUser(Number(id) || 0)

  return (
    <div className="flex h-full flex-col gap-5 overflow-hidden p-6 pb-3">
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

      {USE_PLACEHOLDER_USER ? (
        <UserDetail user={user} />
      ) : (
        <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed bg-muted/30 p-10">
          <p className="max-w-sm text-center text-sm text-muted-foreground">
            Nothing here yet. This page needs an endpoint that returns a single
            user — the backend currently only lists everyone at once.
          </p>
        </div>
      )}
    </div>
  )
}
