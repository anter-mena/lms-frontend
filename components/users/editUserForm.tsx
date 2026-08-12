"use client"

import { useActionState } from "react"
import { CircleAlert, CircleCheck } from "lucide-react"

import { updateUser } from "@/app/(app)/users/actions"
import { IDLE, type ActionState } from "@/lib/actionState"
import { Section } from "@/components/users/formSection"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { UserDetail } from "@/lib/userTypes"

/**
 * Editing who somebody is — not what they may do.
 *
 * <p><b>A separate component and a separate page from creating one</b>, and that
 * is a decision rather than an oversight. The two look similar and are not the
 * same form: creating an account sets a password, a role and a starting set of
 * permissions, while this one sets four fields and deliberately cannot touch any
 * of that. Role, status, password, permissions and two-factor each have their own
 * endpoint on the backend for exactly that reason — an endpoint for fixing a typo
 * in a surname should not also be able to hand out administrator.
 *
 * <p>Written as one component with a `mode` prop, that difference becomes a dozen
 * `{mode === "create" && …}` branches around every field, and the day somebody
 * adds a field to the wrong side of one is the day an edit screen starts
 * accepting a role. Two small forms sharing a {@link Section} is cheaper to read
 * and impossible to get wrong that way.
 *
 * <p>All four fields are required together. This is a PUT-shaped body: a partial
 * update where a missing field means "leave it alone" has no way to express
 * "clear the phone number", and clearing it is a thing people do.
 */
function EditUserForm({ user }: { user: UserDetail }) {
  const [state, submit, pending] = useActionState<ActionState, FormData>(
    async (_previous, formData) => updateUser(user.id, formData),
    IDLE
  )

  return (
    <form
      id={EDIT_USER_FORM_ID}
      action={submit}
      className="flex w-full flex-col gap-4"
    >
      {state.message && (
        <p
          role="status"
          aria-live="polite"
          className={
            state.ok
              ? "flex items-start gap-2 rounded-md border border-success/30 bg-success/5 px-3 py-2 text-sm text-success"
              : "flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          }
        >
          {state.ok ? (
            <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
          ) : (
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          )}
          {state.message}
        </p>
      )}

      <fieldset disabled={pending} className="contents">
        <Section
          title="Details"
          description="Their name and how to reach them. Nothing here changes what they can do."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                name="firstName"
                required
                // defaultValue, not value: this is an uncontrolled form, so the
                // browser keeps what has been typed and a re-render from the
                // action does not throw it away.
                defaultValue={user.firstName}
                className="h-8 rounded-md"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                name="lastName"
                required
                defaultValue={user.lastName}
                className="h-8 rounded-md"
              />
            </div>
          </div>

          <div className="grid items-start gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                defaultValue={user.email}
                className="h-8 rounded-md"
              />
              {/* Said here because it is the one field on this page with a
                  consequence beyond the record: it is how they sign in. */}
              <p className="text-xs text-muted-foreground">
                This is what they sign in with. Changing it changes their
                username, so tell them.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">
                Phone
                <span className="font-normal text-muted-foreground">
                  {" "}
                  — optional
                </span>
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                maxLength={20}
                defaultValue={user.phone ?? ""}
                placeholder="+212 6 12 34 56 78"
                className="h-8 rounded-md"
              />
              <p className="text-xs text-muted-foreground">
                Leave it empty to clear it.
              </p>
            </div>
          </div>
        </Section>
      </fieldset>
    </form>
  )
}

/**
 * Lets the Save button live up in the page header beside the title.
 *
 * <p>A button carrying `form="…"` submits that form from anywhere on the page.
 * Plain HTML, no state lifted out of this component and no context threaded
 * through — the same trick the add-user screen uses.
 */
const EDIT_USER_FORM_ID = "edit-user-form"

export { EditUserForm, EDIT_USER_FORM_ID }
