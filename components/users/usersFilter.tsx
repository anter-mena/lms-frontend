"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { CircleCheck, CircleDot, CircleX, ListFilter, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ROLES } from "@/lib/permissions"
import { cn } from "@/lib/utils"

/**
 * Filters for the user list, sitting up in the title row.
 *
 * <p><b>They live in the URL, not in state.</b> That is what lets this button
 * stand next to the page title while the table it filters is somewhere else
 * entirely — neither has to know about the other, because both read the same
 * address bar. It also makes a filtered list something you can send to a
 * colleague, and something the back button restores.
 *
 * <p>The cost is a round trip per change instead of an instant re-render. At a
 * dozen rows that is invisible, and once filtering moves to the backend — which
 * it must, since the API returns every row — the URL is where the query would
 * have had to live anyway.
 */

/**
 * Icons match the table badges so a status is recognisable wherever it appears,
 * but the colour does not come with them. In the table a badge is one cell among
 * many and colour helps it stand out; here they sit three in a row as options,
 * and three tinted cards read as three warnings rather than a choice.
 */
const STATUSES = [
  { value: "ACTIVE", label: "Active", icon: CircleCheck },
  { value: "PENDING_VERIFICATION", label: "Pending", icon: CircleDot },
  { value: "SUSPENDED", label: "Suspended", icon: CircleX },
]

/**
 * "Either" is the absence of a filter rather than a third state, which is why
 * this group needs no separate reset the way Role and Status do — choosing it
 * removes the key from the URL.
 */
const TWO_FACTOR_STOPS = [
  { value: "any", label: "Either" },
  { value: "on", label: "On" },
  { value: "off", label: "Off" },
]

/**
 * The selection mark on a card.
 *
 * <p>Drawn rather than a native radio: the browser's own control cannot be sized
 * to sit beside 11px type without looking bolted on, and it ignores most
 * styling. The real `<input type="radio">` is still there in each card, hidden —
 * so keyboard, focus and screen readers behave exactly as they should.
 */
function RadioDot({ selected }: { selected: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-3 shrink-0 items-center justify-center rounded-full border transition-colors",
        selected ? "border-foreground" : "border-border"
      )}
    >
      {selected && <span className="size-1.5 rounded-full bg-foreground" />}
    </span>
  )
}

/** The keys this component owns. Anything else in the URL is left alone. */
const KEYS = ["role", "status", "mfa"] as const

function UsersFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const active = KEYS.filter((key) => params.get(key)).length
  const selectedRole = params.get("role")
  const selectedStatus = params.get("status")

  function set(key: string, value: string) {
    const next = new URLSearchParams(params.toString())

    // "any" is the absence of a filter, not a value to store — keeping it in the
    // URL would make a default look like a choice somebody made.
    if (value === "any") next.delete(key)
    else next.set(key, value)

    // Any change invalidates the page you were on: page 3 of an unfiltered list
    // is rarely page 3 of a filtered one.
    next.delete("page")

    router.push(`${pathname}?${next.toString()}`, { scroll: false })
  }

  function clear() {
    const next = new URLSearchParams(params.toString())
    KEYS.forEach((key) => next.delete(key))
    router.push(next.toString() ? `${pathname}?${next}` : pathname, {
      scroll: false,
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            className="relative rounded-md bg-card"
            aria-label={
              active > 0 ? `Filters, ${active} active` : "Filter users"
            }
          />
        }
      >
        <ListFilter />
        {/* A count, not just a dot: with three filters available, "some are on"
            is less use than knowing how many are hiding rows. */}
        {active > 0 && (
          <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-foreground font-mono text-[0.6rem] font-medium text-background">
            {active}
          </span>
        )}
      </DropdownMenuTrigger>

      {/* The sidebar's surface, not the popover's. Everything inside is a white
          card, and on a white panel those cards had nothing to sit against —
          the borders were doing all the work. A sunken background gives them
          something to lift off, and matches the one other place in the app that
          holds a stack of controls. */}
      <DropdownMenuContent align="end" className="w-72 bg-sidebar">
        {/* Plain labels rather than menu items, so choosing a role does not
            close the panel. Setting two filters should not mean opening this
            twice. */}
        <div className="px-2 pt-1.5 pb-2">
          <div className="flex items-center justify-between gap-2 pb-1.5">
            <span className="font-mono text-[0.7rem] font-medium tracking-wider text-muted-foreground uppercase">
              Role
            </span>
            {selectedRole && (
              <button
                type="button"
                onClick={() => set("role", "any")}
                className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
              >
                Any role
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {ROLES.map((role) => {
              const selected = selectedRole === role.key

              return (
                // The mark is pushed to the card's right edge, matching the role
                // cards on the add-user form. Text starts at a common left edge
                // and the marks line up in their own column down the right,
                // which is what makes the selected one findable at a glance.
                <label
                  key={role.key}
                  className={cn(
                    "flex cursor-pointer items-start justify-between gap-2 rounded-md border p-2 transition-colors",
                    // The fill stays put whatever is chosen. Now the panel
                    // behind these is the sunken sidebar surface, tinting the
                    // selected card made it sink into the background — the one
                    // card that should stand out was the one that disappeared.
                    // Selection is the border and the filled mark instead.
                    "bg-card hover:bg-muted/40",
                    selected && "border-foreground/40"
                  )}
                >
                  <input
                    type="radio"
                    name="role-filter"
                    checked={selected}
                    onChange={() => set("role", role.key)}
                    className="sr-only"
                  />

                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-xs font-medium">{role.label}</span>
                    <span className="text-[0.7rem] leading-tight text-muted-foreground">
                      {role.key === "ADMIN"
                        ? "Full access"
                        : "Only what they are given"}
                    </span>
                  </span>

                  {/* Nudged down to meet the first line of text rather than the
                      top of its box. */}
                  <span className="mt-0.5">
                    <RadioDot selected={selected} />
                  </span>
                </label>
              )
            })}
          </div>
        </div>

        <DropdownMenuSeparator />

        <div className="px-2 pt-1.5 pb-2">
          <div className="flex items-center justify-between gap-2 pb-1.5">
            <span className="font-mono text-[0.7rem] font-medium tracking-wider text-muted-foreground uppercase">
              Status
            </span>
            {selectedStatus && (
              <button
                type="button"
                onClick={() => set("status", "any")}
                className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
              >
                Any status
              </button>
            )}
          </div>

          {/* Three across, so the icons line up as a row of states rather than a
              column of options. The icon carries the meaning at this size — the
              word is barely wide enough to read as a label on its own. */}
          {/* Stacked, not three across. Each card carries a radio, an icon, a
              title and a sentence — four things that will not fit side by side
              in a dropdown without the sentence wrapping to three words a line. */}
          <div className="flex flex-col gap-2">
            {STATUSES.map((status) => {
              const selected = selectedStatus === status.value
              const Icon = status.icon

              return (
                <label
                  key={status.value}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-md border px-2 py-1.5 transition-colors",
                    // The fill stays put whatever is chosen. Now the panel
                    // behind these is the sunken sidebar surface, tinting the
                    // selected card made it sink into the background — the one
                    // card that should stand out was the one that disappeared.
                    // Selection is the border and the filled mark instead.
                    "bg-card hover:bg-muted/40",
                    selected && "border-foreground/40"
                  )}
                >
                  <input
                    type="radio"
                    name="status-filter"
                    checked={selected}
                    onChange={() => set("status", status.value)}
                    className="sr-only"
                  />
                  <Icon
                    className="size-3.5 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                  <span className="text-xs font-medium">{status.label}</span>

                  {/* ml-auto rather than justify-between: the text between them
                      can be short, and only pushing the mark itself keeps the
                      icon and label together at the left. */}
                  <span className="ml-auto">
                    <RadioDot selected={selected} />
                  </span>
                </label>
              )
            })}
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Three stops on a track. Two-factor is one setting with a middle
            position meaning "do not care", and a line makes that middle read as
            the resting state — which a stack of three radio rows never does.

            Real radio inputs underneath, hidden: arrow keys, focus and screen
            readers all work without reimplementing any of it. */}
        <div className="px-2 pt-1.5 pb-3">
          <span className="font-mono text-[0.7rem] font-medium tracking-wider text-muted-foreground uppercase">
            Two-factor
          </span>

          {/* Radios, not a slider. Off / Either / On is a choice between three
              named things, not a quantity — a track implies the middle is
              "halfway", when it actually means "do not care".

              Three across rather than stacked: the labels are one word each, so
              a column of them would be three rows of mostly empty card. */}
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            {TWO_FACTOR_STOPS.map((stop) => {
              const selected = (params.get("mfa") ?? "any") === stop.value

              return (
                <label
                  key={stop.value}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-md border px-2 py-1.5 transition-colors",
                    // The fill stays put whatever is chosen. Now the panel
                    // behind these is the sunken sidebar surface, tinting the
                    // selected card made it sink into the background — the one
                    // card that should stand out was the one that disappeared.
                    // Selection is the border and the filled mark instead.
                    "bg-card hover:bg-muted/40",
                    selected && "border-foreground/40"
                  )}
                >
                  <input
                    type="radio"
                    name="mfa-filter"
                    checked={selected}
                    onChange={() => set("mfa", stop.value)}
                    className="sr-only"
                  />
                  <span className="truncate text-xs font-medium">
                    {stop.label}
                  </span>
                  <span className="ml-auto">
                    <RadioDot selected={selected} />
                  </span>
                </label>
              )
            })}
          </div>
        </div>

        {active > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={clear}>
              <X data-icon="inline-start" />
              Clear filters
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { UsersFilter }
