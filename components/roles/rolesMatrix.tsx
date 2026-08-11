import { Check, Minus } from "lucide-react"

import {
  RESOURCE_GROUPS,
  ROLES,
  type Resource,
  permissionsForRole,
} from "@/lib/permissions"
import { THIN_SCROLLBAR } from "@/lib/scrollbar"
import { cn } from "@/lib/utils"

/**
 * Every role against every permission, in one grid.
 *
 * <p>Roles across the top rather than down the side. There are two of them and
 * far more permissions, so this way round the table is tall and narrow instead of
 * short and wide — and more to the point, it puts the two roles side by side in
 * adjacent columns, which is the comparison the page exists to make. A row read
 * left to right answers "who can delete a customer", which is the question
 * somebody actually arrives with.
 *
 * <p>Rows are grouped as the sidebar is grouped: a section heading, then each
 * module under it, then its actions. Somebody checking whether a role can open
 * Channels looks where Channels sits in the menu, and finds it there.
 *
 * <p>⚠️ <b>Read-only, and it has to be.</b> There is no endpoint that changes
 * what a role grants — `role_permissions` is written once by
 * `V2__seed_roles_and_permissions.sql` and never again. Ticks that could be
 * clicked but saved nothing would be worse than ticks that cannot.
 */

/** What a role holds, so each column is looked up once rather than per cell. */
const HELD_BY_ROLE = new Map(
  ROLES.map((role) => [role.key, new Set(permissionsForRole(role.key))]),
)

/** Read leads, for the same reason it does in the picker. */
function orderedActions(resource: Resource) {
  if (!resource.actions.includes("READ")) return resource.actions
  return ["READ", ...resource.actions.filter((action) => action !== "READ")]
}

function RolesMatrix() {
  return (
    <div
      className={cn(
        // The whole page below the title, so the grid gets every pixel there is.
        // Both axes scroll: down as modules are added, sideways whenever the
        // window is narrow.
        "min-h-0 flex-1 overflow-auto rounded-md border bg-card",
        THIN_SCROLLBAR,
      )}
    >
      <table className="w-full min-w-[32rem] border-collapse text-sm">
        {/* Sticky, because this is a table somebody scrolls while checking one
            row — and a row of ticks with no column headings in sight says
            nothing at all. */}
        <thead className="sticky top-0 z-10 bg-card">
          <tr className="border-b">
            <th className="py-2.5 pl-4 text-left font-mono text-[0.7rem] font-medium tracking-wider text-muted-foreground uppercase">
              Permission
            </th>
            {ROLES.map((role) => (
              <th
                key={role.key}
                className="px-4 py-2.5 text-center font-mono text-[0.7rem] font-medium tracking-wider text-muted-foreground uppercase"
              >
                {role.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {RESOURCE_GROUPS.map((group) => (
            // Fragments rather than nested tables: every heading is a row like
            // any other, so the columns stay aligned down the whole grid.
            <GroupRows key={group.key} groupKey={group.key} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** A section heading, then each module under it, then that module's actions. */
function GroupRows({ groupKey }: { groupKey: string }) {
  const group = RESOURCE_GROUPS.find((item) => item.key === groupKey)
  if (!group) return null

  return (
    <>
      {/* The section. Filled darker than the module rows below it, so the two
          levels of heading are told apart by weight as well as by indentation —
          indentation alone is hard to follow across a wide table. */}
      <tr className="border-b bg-muted">
        <td
          colSpan={ROLES.length + 1}
          className="py-1.5 pl-4 font-mono text-[0.65rem] font-semibold tracking-wider uppercase"
        >
          {group.label}
        </td>
      </tr>

      {group.resources.map((resource) => (
        <ResourceRows key={resource.key} resource={resource} />
      ))}
    </>
  )
}

/** A module's own heading row, then one row per action it has. */
function ResourceRows({ resource }: { resource: Resource }) {
  return (
    <>
      <tr className="border-b bg-muted/40">
        <td
          colSpan={ROLES.length + 1}
          className="py-1.5 pl-7 text-xs font-medium"
        >
          {resource.label}
        </td>
      </tr>

      {orderedActions(resource).map((action) => (
        <tr key={action} className="border-b">
          <td className="py-2 pl-11">
            {/* The permission as the token actually reads, beside the word.
                Somebody debugging a refused request has the string, not the
                sentence. */}
            <span className="capitalize">{action.toLowerCase()}</span>
            <span className="ml-2 font-mono text-[0.65rem] text-muted-foreground">
              {resource.key}:{action}
            </span>
          </td>

          {ROLES.map((role) => {
            const granted = HELD_BY_ROLE.get(role.key)?.has(
              `${resource.key}:${action}`,
            )

            return (
              <td key={role.key} className="px-4 py-2 text-center">
                <span
                  className={cn(
                    "inline-flex",
                    granted ? "text-success" : "text-muted-foreground/50",
                  )}
                >
                  {granted ? (
                    <Check className="size-4" aria-hidden />
                  ) : (
                    <Minus className="size-4" aria-hidden />
                  )}
                  <span className="sr-only">
                    {granted ? "Granted" : "Not granted"}
                  </span>
                </span>
              </td>
            )
          })}
        </tr>
      ))}
    </>
  )
}

export { RolesMatrix }
