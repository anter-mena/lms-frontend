"use client"

import { useState, useTransition } from "react"
import { CircleAlert, CircleCheck } from "lucide-react"

import { setUserPermissions } from "@/app/(app)/users/actions"
import { useAccess } from "@/components/access/accessProvider"
import { PermissionPicker } from "@/components/users/permissionPicker"
import { TopBanner } from "@/components/ui/topBanner"
import { THIN_SCROLLBAR } from "@/lib/scrollbar"
import type { UserDetail } from "@/lib/userTypes"
import { cn } from "@/lib/utils"

/**
 * One person's permissions, as a thing you can change.
 *
 * <p>The same picker the add-user form uses, on the same theory: what gets
 * stored is not a copy of every permission somebody holds, it is the
 * <em>difference</em> from what their role already grants. Ticking a box a
 * Member does not have is a grant; clearing one an Administrator does have is a
 * deny. Sending the whole set instead would freeze their access in place the next
 * time their role changed.
 *
 * <p>The Save button lives up in the page header, so this is a form with an id
 * and no visible submit of its own — a button carrying `form="…"` submits it from
 * anywhere on the page.
 */

/** Lets the Save button live up in the page header beside the title. */
const PERMISSIONS_FORM_ID = "user-permissions-form"

function UserPermissionEditor({ user }: { user: UserDetail }) {
  const access = useAccess()

  // Seeded from what they hold today, so the grid opens showing the truth and
  // "no changes" is the resting state rather than something to restore.
  const [permissions, setPermissions] = useState<Set<string>>(
    () => new Set(user.permissions)
  )

  const [pending, start] = useTransition()
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  const { granted, denied } = access.diffFromRole(user.role, permissions)
  const changed = granted.length + denied.length

  function save(event: React.FormEvent) {
    event.preventDefault()
    setResult(null)

    start(async () => {
      const outcome = await setUserPermissions(user.id, granted, denied)

      setResult({
        ok: Boolean(outcome.ok),
        message: outcome.message ?? "Something went wrong. Please try again.",
      })
    })
  }

  // An administrator has everything by definition. A grid of ticked boxes is not
  // a decision, and leaving it there invites somebody to untick one — which is a
  // per-person hole in an administrator, and precisely the kind of thing nobody
  // finds again.
  if (access.roleGrantsEverything(user.role)) {
    return (
      <TopBanner message="This account is an administrator, so it already holds every permission. Change their role to Member first if they should have less." />
    )
  }

  return (
    <form
      id={PERMISSIONS_FORM_ID}
      onSubmit={save}
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-2",
        THIN_SCROLLBAR
      )}
    >
      {result && (
        <p
          role="status"
          aria-live="polite"
          className={cn(
            "flex shrink-0 items-start gap-2 rounded-md border px-3 py-2 text-sm",
            result.ok
              ? "border-success/30 bg-success/5 text-success"
              : "border-destructive/30 bg-destructive/5 text-destructive"
          )}
        >
          {result.ok ? (
            <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
          ) : (
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          )}
          {result.message}
        </p>
      )}

      {/* Said here rather than only on the button, because the button is at the
          top of the page and this is where somebody is looking while deciding. */}
      {changed > 0 && !pending && (
        <p className="shrink-0 text-xs text-muted-foreground">
          {granted.length > 0 && `${granted.length} to add`}
          {granted.length > 0 && denied.length > 0 && ", "}
          {denied.length > 0 && `${denied.length} to remove`}
          {" — not saved yet."}
        </p>
      )}

      <fieldset disabled={pending} className="contents">
        <PermissionPicker
          role={user.role}
          value={permissions}
          onChange={setPermissions}
        />
      </fieldset>
    </form>
  )
}

export { UserPermissionEditor, PERMISSIONS_FORM_ID }
