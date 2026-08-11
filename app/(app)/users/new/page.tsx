import type { Metadata } from "next"

import { PageHeader } from "@/components/layout/pageHeader"
import { ADD_USER_FORM_ID, AddUserForm } from "@/components/users/addUserForm"
import { Button } from "@/components/ui/button"
import { requireUser } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Add user",
}

/**
 * Creating an account.
 *
 * <p>A page rather than a dialog, matching the detail screen next door. A new
 * account needs a name, an email, a role and a starting status, and a form that
 * size in a modal has nowhere to put its errors. It also survives a refresh,
 * which a half-filled dialog does not.
 *
 * <p><b>`new` sits beside `[id]` on purpose.</b> Next matches a literal segment
 * before a dynamic one, so `/users/new` lands here and never on the detail page
 * asking to look up a user called "new". The cost is that no real user can ever
 * have the id `new`, which — since ids are numbers — is free.
 *
 * <p>⚠️ A shell. Building the form needs an endpoint that creates an account
 * <em>with a chosen role</em>: registration always hands out MEMBER and nothing
 * can change it afterwards. That is blocker #2 on the bug list, and this page
 * cannot do its job until it is lifted.
 */
export default async function AddUserPage() {
  await requireUser()

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-6 pb-3">
      {/* The chevron is the only way out — a Cancel button beside Create said
          the same thing twice, and one of them had to be the one people reach
          for. */}
      <PageHeader
        title="Add user"
        description="Create an account and choose what it can do."
        backHref="/users"
        backLabel="Back to users"
        actions={
          // Outside the <form> it submits — `form` is what connects them, so
          // this stays a Server Component with no state of its own.
          <Button type="submit" form={ADD_USER_FORM_ID} className="rounded-md">
            Create account
          </Button>
        }
      />

      <AddUserForm />
    </div>
  )
}
