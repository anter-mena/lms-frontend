"use client"

import { UserX } from "lucide-react"

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

/**
 * Confirms deactivating somebody's account.
 *
 * <p><b>Controlled, not trigger-based.</b> The rest of the app opens these with
 * an `AlertDialogTrigger` wrapping the button. That cannot work from a menu
 * item: choosing one closes the menu, which unmounts everything inside it —
 * including a dialog that had only just opened. The row owns the open state
 * instead, so the dialog outlives the menu that asked for it.
 *
 * <p>The copy is deliberately specific about what deactivation is <em>not</em>.
 * Nothing is deleted: the row stays, the history stays, and the email address
 * stays taken so the same person can be turned back on rather than re-created as
 * a stranger. Someone reaching for this needs to know that before they hesitate
 * over a button labelled with a word that sounds permanent.
 */
function DeactivateUserDialog({
  user,
  open,
  onOpenChange,
  onConfirm,
}: {
  user: { firstName: string; lastName: string; email: string }
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm?: () => void
}) {
  const name = `${user.firstName} ${user.lastName}`

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader className="flex flex-col items-center gap-1.5 text-center">
          <div className="flex items-center gap-2">
            <AlertDialogMedia className="relative size-8 overflow-hidden bg-destructive/10 text-destructive">
              <LiquidGlassLayers />
              {/* relative so it paints above the glass layers, and sized
                  explicitly to opt out of the media slot's size-6 default. */}
              <UserX className="relative size-4" />
            </AlertDialogMedia>
            <AlertDialogTitle>Deactivate this account?</AlertDialogTitle>
          </div>

          <AlertDialogDescription>
            {name} will not be able to sign in. Nothing is deleted — their
            history stays, and the account can be switched back on later.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Naming the account inside the dialog, not just in the sentence above.
            These are opened from a row menu, and by the time the dialog covers
            the table the row it came from is hidden behind it. */}
        <div className="flex flex-col gap-0.5 rounded-md border bg-muted/40 px-3 py-2 text-center">
          <span className="text-sm font-medium">{name}</span>
          <span className="text-xs break-all text-muted-foreground">
            {user.email}
          </span>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            Deactivate
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export { DeactivateUserDialog }
