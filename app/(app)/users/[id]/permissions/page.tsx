import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PageHeader } from "@/components/layout/pageHeader"
import {
  PERMISSIONS_FORM_ID,
  UserPermissionEditor,
} from "@/components/roles/userPermissionEditor"
import { Button } from "@/components/ui/button"
import { requireUser } from "@/lib/auth"
import { getUser } from "@/lib/users"

export const metadata: Metadata = {
  title: "Change permissions",
}

/**
 * What one person may do, beyond what their role gives them.
 *
 * <p><b>Under the account, not off on its own.</b> This used to live at
 * `/roles-permissions?user=12`, which had the problem that the bare address —
 * with no `user` — was a page about nobody. It answered by showing the roles
 * matrix instead, which meant one route rendered two unrelated screens depending
 * on a query parameter.
 *
 * <p>Here the id is part of the path, so the route cannot exist without a person.
 * It also sits beside `/users/[id]/edit`, which is the same idea: everything you
 * can change about somebody hangs off their own address.
 */
export default async function UserPermissionsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireUser()

  const { id } = await params
  const result = await getUser(id)

  if (!result.ok) {
    if (result.error.status === 404 || result.error.status === 400) notFound()
    throw new Error(result.error.message)
  }

  const user = result.data

  return (
    // min-h-0 alongside h-full: a flex child's minimum is its content by default,
    // which would let it grow past the height just set and hand the scroll back
    // to the shell. This pair keeps the scrolling inside the panel below.
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden p-6 pb-3">
      <PageHeader
        title="Change permissions"
        // The name goes here, not in a card underneath. The page is about one
        // person, and the header is where every other screen says who or what it
        // is about.
        description={`${user.firstName} ${user.lastName} · ${user.email}`}
        // Back to the person, not to the list. This page was opened from them,
        // and their page is where the change gets checked.
        backHref={`/users/${user.id}`}
        backLabel="Back to this account"
        actions={
          <Button type="submit" form={PERMISSIONS_FORM_ID} className="rounded-md">
            Save permissions
          </Button>
        }
      />

      <UserPermissionEditor user={user} />
    </div>
  )
}
