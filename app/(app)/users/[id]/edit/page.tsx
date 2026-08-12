import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PageHeader } from "@/components/layout/pageHeader"
import { EDIT_USER_FORM_ID, EditUserForm } from "@/components/users/editUserForm"
import { Button } from "@/components/ui/button"
import { requireUser } from "@/lib/auth"
import { getUser } from "@/lib/users"

export const metadata: Metadata = {
  title: "Edit user",
}

/**
 * Changing somebody's name, email or phone.
 *
 * <p><b>Its own page, beside `/users/new` rather than sharing it.</b> They are
 * the same shape at a glance and different jobs underneath: creating an account
 * also sets a password, a role and a starting set of permissions, none of which
 * this may touch. Sharing one page would mean a form full of conditionals, and
 * the first time somebody adds a field to the wrong branch an edit screen starts
 * accepting a role.
 *
 * <p>Everything else about an account has its own screen or dialog for the same
 * reason — role, status, password, permissions and two-factor each carry a
 * different consequence, and each is reached from the account's own page.
 */
export default async function EditUserPage({
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
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-6 pb-3">
      {/* Back to the account, not to the list. This page is reached from there
          and it is where the change gets checked. */}
      <PageHeader
        title="Edit details"
        description={`${user.firstName} ${user.lastName} · ${user.email}`}
        backHref={`/users/${user.id}`}
        backLabel="Back to this account"
        actions={
          <Button type="submit" form={EDIT_USER_FORM_ID} className="rounded-md">
            Save changes
          </Button>
        }
      />

      <EditUserForm user={user} />
    </div>
  )
}
