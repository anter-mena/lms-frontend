"use client"

import { useState } from "react"
import { GeneratedPassword } from "@/components/users/generatedPassword"
import { PermissionPicker } from "@/components/users/permissionPicker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TopBanner } from "@/components/ui/topBanner"
import {
  ROLES,
  permissionsForRole,
  roleGrantsEverything,
} from "@/lib/permissions"
import { cn } from "@/lib/utils"

/**
 * Creating an account: who they are, what they may do, and how they first get in.
 *
 * <p>⚠️ Nothing is submitted yet. There is no endpoint that creates an account
 * with a chosen role — registration always hands out MEMBER — so this is the
 * shape of the form and not yet a working one.
 */

/**
 * A titled panel, in the same nested shape the stat cards and the table use.
 *
 * <p>The heading sits on the grey shell rather than inside the white card. That
 * is what the two layers are for: the outer one says what this is, the inner one
 * holds what you actually touch. With the heading inside, the grey was a 2px rim
 * doing nothing and the card had a label glued to its own contents.
 *
 * <p>Padded to `px-4` so the heading's left edge lands on the same line as the
 * fields below it — the inner card's own `p-4` starts from the same 2px inset,
 * so any other value would have them a few pixels out of step.
 *
 * <p>`flex-1` on the card is what lets a section fill a row rather than stopping
 * at its content. Side by side, the shorter of two sections would otherwise end
 * early and leave the grey shell hanging below it.
 */
function Section({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col rounded-md border bg-muted/40 p-0.5">
      {/* The page header's treatment, one level down: same sizes, same weight,
          same gap. The old pairing had a tiny mono label over a text-sm sentence,
          so the description outweighed the thing it described. */}
      <div className="flex flex-col gap-1 px-4 pt-3 pb-3">
        <h2 className="font-heading text-lg font-semibold tracking-tight">
          {title}
        </h2>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      <div className="flex flex-1 flex-col gap-4 rounded-sm border bg-card p-4">
        {children}
      </div>
    </section>
  )
}

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
    <form id={ADD_USER_FORM_ID} className="flex w-full flex-col gap-4">
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

          {/* Its own row rather than sharing one with the email: the column is
              already narrow beside Role, and an email in half of it wraps.

              `tel`, not `text` — it brings up the phone keypad on a handset and
              stops a browser offering an email address here. Optional because
              the column is nullable, and because an account works without one:
              nothing signs in or recovers by phone in this system. */}
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

          {/* The password belongs here rather than in a section of its own: it
              is not a decision, it is the last field of who this person is —
              generated, copied, handed over. */}
          <div className="flex flex-col gap-1.5 border-t pt-4">
            <Label>Temporary password</Label>
            <GeneratedPassword value={password} onChange={setPassword} />
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
            {ROLES.map((option) => {
              const selected = option.key === role
              const count = permissionsForRole(option.key).length

              return (
                <label
                  key={option.key}
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
                    name="role"
                    value={option.key}
                    checked={selected}
                    onChange={() => chooseRole(option.key)}
                    className="sr-only"
                  />
                  <span className="flex items-center justify-between text-sm font-medium">
                    {option.label}
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
    </form>
  )
}

export { AddUserForm, ADD_USER_FORM_ID }
