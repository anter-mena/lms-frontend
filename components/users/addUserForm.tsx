"use client"

import { useActionState, useState } from "react"
import { CircleAlert } from "lucide-react"
import { createUser } from "@/app/(app)/users/actions"
import { IDLE, type ActionState } from "@/lib/actionState"
import { Section } from "@/components/users/formSection"
import { GeneratedPassword } from "@/components/users/generatedPassword"
import { PermissionPicker } from "@/components/users/permissionPicker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TopBanner } from "@/components/ui/topBanner"
import { useAccess } from "@/components/access/accessProvider"
import { cn } from "@/lib/utils"

/**
 * Creating an account: who they are, what they may do, and how they first get in.
 *
 * <p>Submits to `POST /api/users`, which is not the registration endpoint:
 * that one always hands out MEMBER, because letting a caller choose their own
 * role would let anybody sign up as an administrator. This one needs
 * `USER:CREATE` and chooses the role deliberately.
 *
 * <p>⚠️ The permission grid below is <b>not</b> submitted with the form. Creating
 * an account and setting somebody's exceptions are two different requests, and
 * the second one needs an id that does not exist until the first has finished —
 * so the ticks here are read after the account is created. See the note on the
 * submit handler.
 */

/** Member, the one that grants nothing. New accounts start with no access. */
const DEFAULT_ROLE = "MEMBER"

/**
 * Lets the submit button live outside the form.
 *
 * <p>The actions sit up beside the page title, which is a Server Component and
 * cannot be inside this one. A button carrying `form="…"` submits that form from
 * anywhere on the page — plain HTML, no state lifted, no context threaded
 * through. Exported so both halves name the same string.
 */
const ADD_USER_FORM_ID = "add-user-form"

function AddUserForm() {
  const { roles, permissionsForRole, roleGrantsEverything } = useAccess()

  const [state, submit, pending] = useActionState<ActionState, FormData>(
    async (_previous, formData) => createUser(formData),
    IDLE
  )

  const [role, setRole] = useState(DEFAULT_ROLE)
  const [permissions, setPermissions] = useState<Set<string>>(
    () => new Set(permissionsForRole(DEFAULT_ROLE))
  )
  const [password, setPassword] = useState("")

  function chooseRole(next: string) {
    setRole(next)
    // Exceptions are dropped when the role changes, deliberately. They were
    // decided relative to the old role — keeping "removed: RECORD:DELETE" after
    // switching to a role that never had it would be carrying a decision about
    // something that is no longer on the table.
    setPermissions(new Set(permissionsForRole(next)))
  }

  return (
    // Width is the page's business now, not the form's — the header above has to
    // line up with it, and two components each holding their own max-width is
    // how those quietly drift apart.
    <form
      id={ADD_USER_FORM_ID}
      action={submit}
      className="flex w-full flex-col gap-4"
    >
      {/* Whatever the backend said, unchanged. Its refusals are specific and
          worth reading — "An account with this email already exists." tells you
          what to do next in a way "Could not create user" never does. */}
      {state.message && !state.ok && (
        <div
          role="alert"
          aria-live="polite"
          className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          <div className="flex flex-col gap-1">
            <span>{state.message}</span>

            {/* Which field, and why. Without this the backend's generic
                "the request contains invalid fields" is the whole answer, and
                whoever is looking at it has to guess which of six boxes it
                means. */}
            {state.fieldErrors && (
              <ul className="flex flex-col gap-0.5 text-xs">
                {Object.entries(state.fieldErrors).map(([field, problem]) => (
                  <li key={field}>
                    <span className="font-medium capitalize">
                      {field.replace(/([A-Z])/g, " $1").toLowerCase()}
                    </span>
                    {" — "}
                    {problem}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* The role travels as a hidden field as well as a checked radio, because
          the visible radios are `sr-only` inside their labels and a form reads
          whichever it finds — this makes it unambiguous. */}
      <input type="hidden" name="role" value={role} />

      <fieldset disabled={pending} className="contents">
      {/* The same bar the sign-in screen uses, in the same place — across the
          top of the window. Being `fixed` it takes no room in this column, so
          the form does not shift down when Administrator is picked.

          Closing it is fine and nothing remembers that you did: switching role
          unmounts this, so picking Administrator again shows it again. */}
      {roleGrantsEverything(role) && (
        <TopBanner message="Administrators hold every permission, and none of them can be held back — choose Member if this person needs less." />
      )}

      {/* Details and Role side by side. They are the two halves of one decision —
          who this is, and what they are — and separating them down the page made
          the form feel longer than it is. Details takes twice the width because
          it holds four fields to the other's two choices. */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Section
          title="Details"
          description="Who they are, and how they first get in."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                name="firstName"
                required
                placeholder="Sarah"
                className="h-8 rounded-md"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                name="lastName"
                required
                placeholder="Amrani"
                className="h-8 rounded-md"
              />
            </div>
          </div>

          {/* The two ways to reach this person, on one row — the same pairing
              the names above use, so the section reads as two rows of two
              rather than two fields and then a ladder.

              `items-start` so the email's note hangs below its own field
              instead of stretching the phone column to match it. */}
          <div className="grid items-start gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="sarah.amrani@nordencapital.com"
                className="h-8 rounded-md"
              />
              <p className="text-xs text-muted-foreground">
                Used to sign in, and it cannot be changed later by the account
                itself.
              </p>
            </div>

            {/* `tel`, not `text` — it brings up the phone keypad on a handset
                and stops a browser offering an email address here. Optional
                because the column is nullable, and because an account works
                without one: nothing signs in or recovers by phone here. */}
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
                // The column is varchar(20), so the field says so rather than
                // letting the backend be the first to mention it.
                maxLength={20}
                placeholder="+212 6 12 34 56 78"
                className="h-8 rounded-md"
              />
            </div>
          </div>

          {/* The password belongs here rather than in a section of its own: it
              is not a decision, it is the last field of who this person is —
              generated, copied, handed over. */}
          <div className="flex flex-col gap-1.5 border-t pt-4">
            <Label>Temporary password</Label>
            <GeneratedPassword
              name="password"
              value={password}
              onChange={setPassword}
            />
          </div>
        </Section>

        <Section
          title="Role"
          description="What they are before anything is granted."
        >
          {/* Stacked, not side by side. Each option carries a sentence that
              decides the choice, and two of those in a narrow column would wrap
              into unreadable slivers.

              flex-1 here and on each card, so the two split whatever height the
              Details column sets rather than sitting at the top with a pool of
              empty card underneath them. */}
          <div className="flex flex-1 flex-col gap-2">
            {roles.map((option) => {
              const selected = option.name === role
              const count = permissionsForRole(option.name).length

              return (
                <label
                  key={option.name}
                  className={cn(
                    // flex-1 rather than a natural height: `flex: 1 1 0%` makes
                    // both cards exactly equal whatever their text does, so
                    // Member's two-line sentence does not make it the taller of
                    // the two options.
                    "flex flex-1 cursor-pointer flex-col gap-1 rounded-md border p-3 transition-colors",
                    selected
                      ? "border-foreground/40 bg-muted/60"
                      : "bg-card hover:bg-muted/40"
                  )}
                >
                  <input
                    type="radio"
                    // Deliberately not `name="role"`: the hidden field above
                    // carries that, and two inputs of the same name submit two
                    // values. This one exists for the keyboard and the screen
                    // reader, which need a real radio group to move through.
                    name="role-choice"
                    value={option.name}
                    checked={selected}
                    onChange={() => chooseRole(option.name)}
                    className="sr-only"
                  />
                  <span className="flex items-center justify-between text-sm font-medium">
                    {option.name === "ADMIN" ? "Administrator" : "Member"}
                    <span
                      aria-hidden
                      className={cn(
                        "size-2 shrink-0 rounded-full",
                        selected ? "bg-foreground" : "bg-border"
                      )}
                    />
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {option.description}
                  </span>
                  {/* mt-auto pins this to the foot of the card. Now the cards
                      are taller than their text, the extra room has to go
                      somewhere — between the sentence and the count, so both
                      cards read as title-at-top, tally-at-bottom rather than
                      as text with a hole under it. */}
                  <span className="mt-auto pt-1 font-mono text-[0.65rem] tracking-wide text-muted-foreground uppercase">
                    {count === 0 ? "Nothing by default" : `All ${count} permissions`}
                  </span>
                </label>
              )
            })}
          </div>
        </Section>
      </div>

      {/* Gone for a role that already grants everything — the banner above says
          why. A grid of twelve boxes, all ticked, all meaning "yes, obviously"
          is not a choice, and leaving it there invites someone to untick one,
          which is a per-user exception on an administrator and precisely the
          kind of quiet hole nobody finds again.

          Asked of the role rather than checking for "ADMIN", so this keeps
          working if the roles change shape. */}
      {!roleGrantsEverything(role) && (
        <Section
          title="Permissions"
          description="What the role gives, and anything you change for this person alone."
        >
          <PermissionPicker
            role={role}
            value={permissions}
            onChange={setPermissions}
          />
        </Section>
      )}
      </fieldset>
    </form>
  )
}

export { AddUserForm, ADD_USER_FORM_ID }
