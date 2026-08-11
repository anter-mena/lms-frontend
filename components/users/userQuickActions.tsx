"use client"

import Link from "next/link"
import { useState } from "react"
import { Ban, KeyRound, KeySquare, ShieldX, UserCog } from "lucide-react"

import {
  UserActionDialogs,
  type ActionTarget,
  type UserAction,
} from "@/components/users/userActionDialogs"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * The things anyone actually opens this page to do.
 *
 * <p>They live in the left column under the identity rather than behind a `…`
 * menu in the corner. A menu is right in a table, where twelve rows each need
 * their own and space is the scarce thing; on a page about one person the
 * actions are the point, and hiding them behind a click to save a strip of an
 * otherwise empty column is a poor trade.
 *
 * <p>Deactivate is last and separated. It is the only one that takes something
 * away, and a destructive action sitting flush against four routine ones gets
 * clicked by muscle memory.
 *
 * <p>⚠️ <b>The dialogs open; nothing is saved.</b> Only two-factor reset has an
 * endpoint behind it. Roles, passwords and statuses cannot be changed by the
 * backend at all — blocker #2 on the bug list.
 */

/** Full width, text at the left edge, so the list reads as a column of verbs. */
const ACTION = "w-full justify-start rounded-md bg-card"

function UserQuickActions({ user }: { user: ActionTarget }) {
  const [action, setAction] = useState<UserAction>(null)

  return (
    <div className="flex flex-col gap-1.5">
      <Button
        variant="outline"
        size="sm"
        className={ACTION}
        onClick={() => setAction("role")}
      >
        <UserCog data-icon="inline-start" />
        Change role
      </Button>

      {/* The one action that navigates rather than opening a dialog: twelve
          permissions and a diff against the role is a screen, not a
          confirmation. `?user=` is what tells that screen who it is about. */}
      <Button
        variant="outline"
        size="sm"
        className={ACTION}
        render={<Link href={`/roles-permissions?user=${user.id}`} />}
      >
        <KeySquare data-icon="inline-start" />
        Change permissions
      </Button>

      <Button
        variant="outline"
        size="sm"
        className={ACTION}
        onClick={() => setAction("password")}
      >
        <KeyRound data-icon="inline-start" />
        Reset password
      </Button>

      <Button
        variant="outline"
        size="sm"
        className={ACTION}
        onClick={() => setAction("twoFactor")}
      >
        <ShieldX data-icon="inline-start" />
        Reset two-factor
      </Button>

      {/* Divided off, not just placed last. */}
      <div className="mt-0.5 border-t pt-2">
        <Button
          variant="outline"
          size="sm"
          className={cn(
            ACTION,
            "text-destructive hover:bg-destructive/10 hover:text-destructive"
          )}
          onClick={() => setAction("deactivate")}
        >
          <Ban data-icon="inline-start" />
          Deactivate account
        </Button>
      </div>

      <UserActionDialogs
        user={user}
        action={action}
        onClose={() => setAction(null)}
      />
    </div>
  )
}

export { UserQuickActions }
