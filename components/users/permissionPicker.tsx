"use client"

import { RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useAccess } from "@/components/access/accessProvider"
import { grantableGroups } from "@/lib/access"
import type { PermissionModule } from "@/lib/userTypes"
import { cn } from "@/lib/utils"

/**
 * The permission grid: sections, the modules inside them, and one row per action.
 *
 * <p><b>Grouped the way the sidebar is grouped.</b> Somebody deciding what a
 * person may do is thinking in screens — "should they see Channels" — not in
 * abstract resources. Laying this out in the same sections and the same order as
 * the menu means the thing they are looking for is where they expect it, and the
 * grid can be checked against the app by eye.
 *
 * <p>The role sets the baseline and this edits away from it. Anything ticked
 * that the role does not give is a <b>grant</b>; anything unticked that it does
 * give is a <b>deny</b>. That is exactly what `user_permissions` holds, so what
 * is on screen maps to what gets stored without a translation step in between.
 */

/**
 * The action every other action on a module depends on.
 *
 * <p>Creating, editing, deleting or exporting something you cannot see is not a
 * permission anybody means to give. It is a half-state that looks deliberate in
 * the database and produces an account which can delete a customer it is not
 * allowed to open — so this screen refuses to express it at all.
 *
 * <p>⚠️ <b>Nothing enforces this on the server.</b> The API takes whatever
 * permission strings it is sent, so a request made outside this form can still
 * create the half-state. Closing that is a check in the backend, not here.
 */
const VIEW_ACTION = "READ"

/** Whether the actions that need `READ` are currently allowed to be ticked. */
function canSee(resource: PermissionModule, value: Set<string>) {
  // A module with no read action of its own gates nothing — every action on it
  // stands alone.
  if (!resource.actions.includes(VIEW_ACTION)) return true
  return value.has(`${resource.key}:${VIEW_ACTION}`)
}

/**
 * Read first, then the rest in the order the module declares them.
 *
 * <p>It is the one the others hang off, and a prerequisite sitting second in the
 * list reads as an afterthought. Putting it at the top means the row that
 * unlocks the module is the first one you meet.
 */
function orderedActions(resource: PermissionModule) {
  if (!resource.actions.includes(VIEW_ACTION)) return resource.actions
  return [
    VIEW_ACTION,
    ...resource.actions.filter((action) => action !== VIEW_ACTION),
  ]
}

function PermissionPicker({
  role,
  value,
  onChange,
}: {
  role: string
  value: Set<string>
  onChange: (next: Set<string>) => void
}) {
  const access = useAccess()

  const base = new Set(access.permissionsForRole(role))
  const { granted, denied } = access.diffFromRole(role, value)
  const changed = granted.length + denied.length

  // Management never appears here. It is marked admin-only in the database, so
  // the API refuses to grant it to one person however many boxes are ticked —
  // offering them would only produce an error on save.
  //
  // Asked as "does this role already hold everything" rather than checking for
  // ADMIN, so it keeps working if the roles change shape.
  const groups = grantableGroups(access.groups, access.roleGrantsEverything(role))

  function toggle(resource: PermissionModule, action: string, checked: boolean) {
    const next = new Set(value)
    const permission = `${resource.key}:${action}`

    if (checked) next.add(permission)
    else next.delete(permission)

    // Taking away read takes the rest of the module with it. Leaving them ticked
    // but greyed would mean the form showing one thing and submitting another —
    // the set that gets sent has to be the set you can see.
    if (action === VIEW_ACTION && !checked) {
      resource.actions.forEach((other) =>
        next.delete(`${resource.key}:${other}`),
      )
    }

    onChange(next)
  }

  /** Everything in a section at once — the row of ticks people actually want. */
  function toggleGroup(resources: PermissionModule[], grant: boolean) {
    const next = new Set(value)

    resources.forEach((resource) =>
      resource.actions.forEach((action) => {
        const permission = `${resource.key}:${action}`
        if (grant) next.add(permission)
        else next.delete(permission)
      }),
    )

    onChange(next)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {changed === 0
            ? "Matching the role exactly."
            : `${changed} ${changed === 1 ? "exception" : "exceptions"} to the role.`}
        </p>

        {changed > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => onChange(new Set(base))}
          >
            <RotateCcw data-icon="inline-start" />
            Reset to role
          </Button>
        )}
      </div>

      {groups.map((group) => {
        const total = group.modules.reduce(
          (sum, resource) => sum + resource.actions.length,
          0,
        )
        const held = group.modules.reduce(
          (sum, resource) =>
            sum +
            resource.actions.filter((action) =>
              value.has(`${resource.key}:${action}`),
            ).length,
          0,
        )

        return (
          // The nested card the rest of the app uses: a grey shell naming the
          // section, with the white cards it contains sitting inside it. That
          // is what makes the three Overview modules read as one group rather
          // than three unrelated panels that happen to be adjacent.
          <section
            key={group.key}
            className="flex flex-col rounded-md border bg-muted/40 p-0.5"
          >
            {/* The heading lives on the grey, which is the whole point of the
                outer layer. px-3 puts its text on the same left edge as the
                text inside the white cards below. */}
            <div className="flex items-center justify-between gap-3 px-3 py-2">
              <h3 className="font-mono text-[0.7rem] font-medium tracking-wider text-muted-foreground uppercase">
                {group.label}
              </h3>

              <div className="flex items-center gap-2">
                <span className="font-mono text-[0.65rem] tracking-wide text-muted-foreground tabular-nums">
                  {held}/{total}
                </span>
                {/* One switch for the whole section. Granting a person the three
                    Overview dashboards is six ticks otherwise, and six ticks is
                    where people start missing one. */}
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => toggleGroup(group.modules, held < total)}
                >
                  {held < total ? "Select all" : "Clear"}
                </Button>
              </div>
            </div>

            {/* gap-0.5 rather than a full gap: the seams between the modules
                match the 2px rim around them, so the stack reads as one card
                divided up instead of several cards in a box. */}
            <div className="flex flex-col gap-0.5">
              {group.modules.map((resource) => {
                const unlocked = canSee(resource, value)

                return (
                  <div
                    key={resource.key}
                    className="flex flex-col gap-2 rounded-sm border bg-card px-3 py-2.5"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {resource.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {resource.description}
                      </span>
                    </div>

                    {/* All five actions across one row. Fixed columns put every
                        checkbox on the same vertical lines in every module,
                        which is what lets you read down a column — everything
                        this person can delete — instead of only across.

                        Five because that is the widest module. The dashboards
                        have two and leave the middle columns empty on purpose:
                        their read sits under the other reads. */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 sm:grid-cols-3 lg:grid-cols-5">
                      {orderedActions(resource).map((action) => {
                        const permission = `${resource.key}:${action}`
                        const checked = value.has(permission)
                        const fromRole = base.has(permission)
                        // Ticked where the role does not grant, or cleared where
                        // it does. Marked so nobody has to hold the role's
                        // contents in their head to see what they changed.
                        const isException = checked !== fromRole
                        const locked = action !== VIEW_ACTION && !unlocked

                        return (
                          <label
                            key={permission}
                            className={cn(
                              "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors select-none",
                              locked
                                ? "cursor-not-allowed opacity-50"
                                : "cursor-pointer hover:bg-muted/50",
                            )}
                          >
                            <Checkbox
                              checked={checked}
                              disabled={locked}
                              onCheckedChange={(next) =>
                                toggle(resource, action, next)
                              }
                              aria-label={`${resource.label}: ${action.toLowerCase()}`}
                            />
                            <span
                              className={cn(
                                "capitalize",
                                !checked && "text-muted-foreground",
                              )}
                            >
                              {action.toLowerCase()}
                            </span>

                            {/* Beside the word, not pushed to the column's right
                                edge. In five narrow columns those are far enough
                                apart that the tag stops reading as belonging to
                                the action it describes. */}
                            {isException && (
                              <span
                                className={cn(
                                  "shrink-0 font-mono text-[0.65rem] font-medium tracking-wide uppercase",
                                  checked ? "text-success" : "text-destructive",
                                )}
                              >
                                {checked ? "+added" : "−removed"}
                              </span>
                            )}
                          </label>
                        )
                      })}
                    </div>

                    {/* Says why the other rows just went grey. Disabled controls
                        with no account of themselves read as a fault. */}
                    {!unlocked && (
                      <p className="px-2 text-xs text-muted-foreground">
                        Turn on <span className="font-medium">read</span> to
                        grant anything else here.
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}

export { PermissionPicker }
