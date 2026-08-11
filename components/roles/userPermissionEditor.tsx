"use client"

import { useState } from "react"

import { PermissionPicker } from "@/components/users/permissionPicker"
import { TopBanner } from "@/components/ui/topBanner"
import { THIN_SCROLLBAR } from "@/lib/scrollbar"
import { roleGrantsEverything } from "@/lib/permissions"
import { cn } from "@/lib/utils"

/**
 * One person's permissions, as a thing you can change.
 *
 * <p>The same picker the add-user form uses, on the same theory: what gets
 * stored is not a copy of every permission somebody holds, it is the
 * <em>difference</em> from what their role already grants. Ticking a box a
 * Member does not have is a grant; clearing one an Administrator does have is a
 * deny. Sending the whole set instead would freeze their access in place the
 * next time their role changed.
 *
 * <p>⚠️ Nothing is saved. There is no endpoint that writes `user_permissions` —
 * blocker #2 on the bug list — so the Save button is a shape, not a promise.
 */

/**
 * Lets the Save button live up in the page header beside the title.
 *
 * <p>A button carrying `form="…"` submits that form from anywhere on the page.
 * Plain HTML, no state lifted out of this component and no context threaded
 * through — the same trick the add-user screen uses.
 */
const PERMISSIONS_FORM_ID = "user-permissions-form"

function UserPermissionEditor({
  user,
}: {
  user: { role: string; permissions: string[] }
}) {
  const [permissions, setPermissions] = useState<Set<string>>(
    () => new Set(user.permissions),
  )

  // An administrator has everything by definition. A grid of twelve ticked
  // boxes is not a decision, and leaving it there invites somebody to untick
  // one — which is a per-person hole in an administrator, and precisely the
  // kind of thing nobody finds again.
  if (roleGrantsEverything(user.role)) {
    return (
      <TopBanner message="This account is an administrator, so it already holds every permission. Change their role to Member first if they should have less." />
    )
  }

  return (
    <form
      id={PERMISSIONS_FORM_ID}
      className={cn("min-h-0 flex-1 overflow-y-auto pr-2", THIN_SCROLLBAR)}
    >
      <PermissionPicker
        role={user.role}
        value={permissions}
        onChange={setPermissions}
      />
    </form>
  )
}

export { UserPermissionEditor, PERMISSIONS_FORM_ID }
