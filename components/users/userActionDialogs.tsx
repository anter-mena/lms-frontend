"use client"

import { useState } from "react"
import { KeyRound, ShieldAlert, UserCog } from "lucide-react"

import { DeactivateUserDialog } from "@/components/users/deactivateUserDialog"
import { GeneratedPassword } from "@/components/users/generatedPassword"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { LiquidGlassLayers } from "@/components/ui/liquidGlass"
import { ROLES, permissionsForRole } from "@/lib/permissions"
import { cn } from "@/lib/utils"

/**
 * Every dialog a single account can open, behind one switch.
 *
 * <p>Both places that act on a user — the row menu in the table and the quick
 * actions on the detail page — need the same four. Holding four booleans in each
 * of them is four chances for two to be true at once; one nullable action cannot
 * be in two states.
 *
 * <p>Rendered as a sibling of whatever opened it, never inside. Choosing a menu
 * item closes the menu and unmounts its contents, so a dialog nested in there
 * vanishes in the frame it appeared.
 *
 * <p>⚠️ <b>None of these do anything yet.</b> Only two-factor reset has an
 * endpoint. Changing a role, changing a password and changing a status are all
 * blocker #2 on the bug list — the backend has no way to do any of them, at all.
 */

/** Which dialog is open. `null` is the resting state, and there is only ever one. */
type UserAction = "role" | "twoFactor" | "password" | "deactivate" | null

/** What every dialog here needs to know about the person. */
type ActionTarget = {
  /** Needed by the callers, which link to per-person screens by id. */
  id: number
  firstName: string
  lastName: string
  email: string
  role: string
  mfaEnabled: boolean
}

/**
 * The account named inside the dialog, not only in the sentence above it.
 *
 * <p>These open from a row menu, and by the time the dialog covers the table the
 * row it came from is behind it. Without this you are confirming something
 * irreversible against a name you last read a second ago.
 */
function TargetCard({ user }: { user: ActionTarget }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-md border bg-muted/40 px-3 py-2 text-center">
      <span className="text-sm font-medium">
        {user.firstName} {user.lastName}
      </span>
      <span className="text-xs break-all text-muted-foreground">
        {user.email}
      </span>
    </div>
  )
}

/** The icon-beside-title header the deactivate dialog established. */
function DialogHead({
  icon: Icon,
  tone,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  /** Background and text for the media chip, e.g. `bg-warning/10 text-warning`. */
  tone: string
  title: string
  children: React.ReactNode
}) {
  return (
    <AlertDialogHeader className="flex flex-col items-center gap-1.5 text-center">
      <div className="flex items-center gap-2">
        <AlertDialogMedia
          className={cn("relative size-8 overflow-hidden", tone)}
        >
          <LiquidGlassLayers />
          {/* relative so it paints above the glass layers, and sized explicitly
              to opt out of the media slot's size-6 default. */}
          <Icon className="relative size-4" />
        </AlertDialogMedia>
        <AlertDialogTitle>{title}</AlertDialogTitle>
      </div>
      <AlertDialogDescription>{children}</AlertDialogDescription>
    </AlertDialogHeader>
  )
}

/**
 * Moving somebody between roles.
 *
 * <p>A choice rather than a confirmation, so the roles are in the dialog instead
 * of a sentence asking "are you sure". The consequence of each is spelled out
 * where the choice is made — by the time you have clicked through to a
 * confirmation screen it is too late to be told what you picked.
 */
function ChangeRoleDialog({
  user,
  open,
  onOpenChange,
}: {
  user: ActionTarget
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [role, setRole] = useState(user.role)

  // Reopening after a cancel should not offer the abandoned choice as though it
  // had been made. Watched on `open` rather than reset in the cancel handler,
  // because a dialog also closes by Escape and by a click outside.
  //
  // Adjusted during render rather than in an effect. React's own advice: an
  // effect would paint the stale choice once and then correct it, and this way
  // there is no frame where the dialog shows the wrong role.
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) setRole(user.role)
  }

  const changed = role !== user.role
  const leavingAdmin = user.role === "ADMIN" && changed

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <DialogHead
          icon={UserCog}
          tone="bg-muted text-foreground"
          title="Change role"
        >
          A role sets what this account can do before any per-person exception.
        </DialogHead>

        <TargetCard user={user} />

        <div className="flex flex-col gap-2">
          {ROLES.map((option) => {
            const selected = option.key === role
            const count = permissionsForRole(option.key).length

            return (
              <label
                key={option.key}
                className={cn(
                  "flex cursor-pointer flex-col gap-1 rounded-md border p-3 transition-colors",
                  "bg-card hover:bg-muted/40",
                  selected && "border-foreground/40"
                )}
              >
                <input
                  type="radio"
                  name="role-change"
                  value={option.key}
                  checked={selected}
                  onChange={() => setRole(option.key)}
                  className="sr-only"
                />

                <span className="flex items-center justify-between gap-2 text-sm font-medium">
                  {option.label}
                  {/* Says which one they are on now, so "no change" is visible
                      rather than something you work out by remembering. */}
                  {option.key === user.role && (
                    <span className="font-mono text-[0.6rem] tracking-wide text-muted-foreground uppercase">
                      Current
                    </span>
                  )}
                </span>
                <span className="text-xs text-muted-foreground">
                  {option.description}
                </span>
                <span className="font-mono text-[0.65rem] tracking-wide text-muted-foreground uppercase">
                  {count === 0
                    ? "Nothing by default"
                    : `All ${count} permissions`}
                </span>
              </label>
            )
          })}
        </div>

        {/* Only for the direction that quietly takes access away. Promoting
            somebody is visible in what they can suddenly do; demoting them is
            visible the first time they cannot do something, which is usually
            during whatever they were in the middle of. */}
        {leavingAdmin && (
          <p className="rounded-md border border-warning/30 bg-warning/5 px-3 py-2 text-xs text-muted-foreground">
            They lose every permission that came with being an administrator.
            Anything they still need has to be granted to them one at a time.
          </p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          {/* Nothing to save when nothing changed — a live button that does
              nothing teaches people the button does nothing. */}
          <AlertDialogAction disabled={!changed}>Change role</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/**
 * Clearing somebody's second factor so they can enrol again.
 *
 * <p>The one action on this menu with an endpoint already built —
 * `POST /api/users/{id}/2fa/reset`, behind `USER:UPDATE`.
 *
 * <p>The copy leads with the lockout rather than the reset, because that is the
 * part people get wrong. Two-factor is mandatory here: clearing it does not put
 * the account back to a password-only state, it puts the account into an
 * enrolment it cannot skip and cannot pass until it reaches a new authenticator.
 * Doing this to somebody who has lost their phone helps; doing it to somebody
 * who has not is an outage for them.
 */
function ResetTwoFactorDialog({
  user,
  open,
  onOpenChange,
}: {
  user: ActionTarget
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size="sm">
        <DialogHead
          icon={ShieldAlert}
          tone="bg-warning/10 text-warning"
          title="Reset two-factor?"
        >
          {user.mfaEnabled
            ? "Their authenticator app stops working immediately, and they set up a new one the next time they sign in."
            : "This account has not set up two-factor yet, so there is nothing to reset."}
        </DialogHead>

        <TargetCard user={user} />

        {/* The consequence, separated from the description so it is not read as
            more reassurance.

            An account that never enrolled is already sitting in the enrolment
            screen — resetting it would change nothing, so the dialog says so
            rather than letting somebody press a button and wonder what it did. */}
        <p className="rounded-md border border-warning/30 bg-warning/5 px-3 py-2 text-xs text-muted-foreground">
          {user.mfaEnabled
            ? "Two-factor is required for everyone here, so until they finish setting it up again they cannot do anything at all — not even sign in and wait. Their old recovery codes stop working too."
            : "They are already being asked to enrol every time they sign in, and cannot do anything until they finish. If they are stuck, the problem is not their two-factor."}
        </p>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={!user.mfaEnabled}>
            Reset two-factor
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/**
 * Issuing a new password for somebody who cannot get in.
 *
 * <p>A generated password handed over, not a reset link emailed. There is no
 * mail being sent by this system at all — no verification, no invitations,
 * nothing — so a link would be a button that silently does nothing. This is also
 * how the add-user form already works, which makes the two consistent: an
 * administrator generates a password and passes it on.
 *
 * <p>⚠️ The obvious missing half is forcing a change at next sign-in. There is
 * no `must_change_password` column and no endpoint, so the temporary password is
 * simply the password until the person is told to change it — which nothing
 * makes them do. Worth fixing before this is wired up.
 */
function ResetPasswordDialog({
  user,
  open,
  onOpenChange,
}: {
  user: ActionTarget
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [password, setPassword] = useState("")

  // A fresh one per opening. Reopening and seeing the password from last time
  // suggests it is the account's current password, which it is not — nothing
  // was saved. Cleared rather than regenerated here, because GeneratedPassword
  // makes one the moment it is handed an empty value.
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) setPassword("")
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <DialogHead
          icon={KeyRound}
          tone="bg-muted text-foreground"
          title="Reset password"
        >
          Their current password stops working. Copy this one and give it to
          them yourself.
        </DialogHead>

        <TargetCard user={user} />

        <div className="flex flex-col gap-1.5">
          <GeneratedPassword value={password} onChange={setPassword} />
        </div>

        <p className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          Nothing is emailed — this system sends no mail. Send it by a route you
          trust and ask them to change it once they are in. Their two-factor is
          untouched, so they still need their authenticator.
        </p>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction>Set this password</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function UserActionDialogs({
  user,
  action,
  onClose,
}: {
  user: ActionTarget
  action: UserAction
  onClose: () => void
}) {
  // Each dialog gets its own `open`, all driven off the one action. Base UI
  // needs the boolean to go true→false for the close animation to play, which a
  // conditionally-rendered dialog never gets to do.
  const close = (next: boolean) => {
    if (!next) onClose()
  }

  return (
    <>
      <ChangeRoleDialog
        user={user}
        open={action === "role"}
        onOpenChange={close}
      />
      <ResetTwoFactorDialog
        user={user}
        open={action === "twoFactor"}
        onOpenChange={close}
      />
      <ResetPasswordDialog
        user={user}
        open={action === "password"}
        onOpenChange={close}
      />
      <DeactivateUserDialog
        user={user}
        open={action === "deactivate"}
        onOpenChange={close}
        // ⚠️ Nothing happens yet. Deactivating needs a status-change endpoint,
        // which the backend does not have — see bugForLater.
        onConfirm={onClose}
      />
    </>
  )
}

export { UserActionDialogs, type UserAction, type ActionTarget }
