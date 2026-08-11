"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
  Ellipsis,
  Eye,
  FileJson,
  FileSpreadsheet,
  FileText,
  Info,
  KeyRound,
  KeySquare,
  Plus,
  Search,
  ShieldCheck,
  UserCog,
  UserX,
} from "lucide-react"

import {
  UserActionDialogs,
  type UserAction,
} from "@/components/users/userActionDialogs"
import { StatusBadge, TwoFactorBadge } from "@/components/users/statusBadge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { THIN_SCROLLBAR } from "@/lib/scrollbar"
import { cn } from "@/lib/utils"

/** Mirrors the backend's UserResponse. */
type UserRow = {
  id: number
  firstName: string
  lastName: string
  email: string
  role: string
  status: string
  mfaEnabled: boolean
}

type SortKey = "id" | "firstName" | "lastName" | "email" | "mfaEnabled" | "status"

/**
 * Centred columns are the ones holding a token rather than prose: an identifier
 * and two badges, all of roughly fixed width. Left-aligning a pill leaves a
 * ragged gap down the column, while names and emails vary in length and have to
 * start from a common edge to be scannable.
 */
const COLUMNS: { key: SortKey; label: string; centred?: boolean }[] = [
  { key: "id", label: "ID", centred: true },
  { key: "firstName", label: "First name" },
  { key: "lastName", label: "Last name" },
  { key: "email", label: "Email" },
  { key: "mfaEnabled", label: "2FA", centred: true },
  { key: "status", label: "Status", centred: true },
]

/**
 * Column headings in the same letter-spaced mono as the stat cards, which is
 * what ties the two halves of this page together.
 */
const HEAD =
  "font-mono text-[0.7rem] font-medium tracking-wider text-muted-foreground uppercase"

/**
 * Capped at 15, not the usual 25/50/100.
 *
 * <p>The table lives in a fixed-height panel — the page itself does not scroll —
 * so a page size larger than the panel holds does not show more of anything, it
 * just puts scrolling inside scrolling and makes the page numbers meaningless.
 * These steps stay within what a window can actually display.
 */
const PAGE_SIZES = [5, 10, 15] as const

/** The middle option: a full page on a laptop without reaching the cap. */
const DEFAULT_PAGE_SIZE = 10

/**
 * Which page buttons to draw: always the first and last, always the current and
 * its neighbours, with a gap standing in for whatever is skipped.
 *
 * <p>Below eight pages everything fits, so nothing is hidden — collapsing three
 * pages behind an ellipsis costs a click and saves no room.
 */
function pageNumbers(current: number, total: number): (number | "gap")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages = new Set([1, total, current, current - 1, current + 1])
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)

  return sorted.flatMap((page, i) => {
    const previous = sorted[i - 1]
    // A gap only where numbers were actually skipped — never between 3 and 4.
    return previous !== undefined && page - previous > 1
      ? (["gap", page] as (number | "gap")[])
      : [page]
  })
}

/**
 * Pins the headings while the rows move under them.
 *
 * <p>On the cells rather than on `<thead>`: `position: sticky` is not reliable on
 * a table section, and with `border-collapse: collapse` — which Tailwind's
 * preflight sets — a border on a stuck element scrolls off with the row it was
 * collapsed against. The inset shadow is a border that belongs to the cell
 * itself, so it stays put.
 *
 * <p>An opaque background is not optional here. Without it the rows show
 * straight through the headings as they pass.
 */
const STICKY_HEAD =
  "sticky top-0 z-10 bg-card shadow-[inset_0_-1px_0_var(--border)]"

/**
 * Status sorts by where an account sits in its life, not by its spelling.
 * Alphabetical would file Suspended between Pending and Deactivated, which tells
 * nobody anything — the useful order is settled first, trouble last.
 */
const STATUS_RANK: Record<string, number> = {
  ACTIVE: 0,
  PENDING_VERIFICATION: 1,
  SUSPENDED: 2,
  DEACTIVATED: 3,
}

function compare(a: UserRow, b: UserRow, key: SortKey): number {
  switch (key) {
    case "id":
      return a.id - b.id
    case "mfaEnabled":
      // Accounts still owing enrolment sort first: they are the ones an
      // administrator opened this list to find.
      return Number(a.mfaEnabled) - Number(b.mfaEnabled)
    case "status":
      return (STATUS_RANK[a.status] ?? 99) - (STATUS_RANK[b.status] ?? 99)
    default:
      // localeCompare, not <, so accented names file where a reader expects
      // rather than after Z.
      return a[key].localeCompare(b[key])
  }
}

/**
 * One row's menu, and the dialogs it can open.
 *
 * <p>Its own component so each row holds its own dialog state. Kept up in the
 * table, a single `deactivating` flag would have to remember *which* row asked,
 * and every row would re-render whenever any menu opened.
 *
 * <p>The dialog is a sibling of the menu rather than inside it. Choosing a menu
 * item closes the menu and unmounts its contents, so a dialog nested in there
 * would vanish in the same frame it appeared.
 */
function UserRowActions({ user }: { user: UserRow }) {
  const [action, setAction] = useState<UserAction>(null)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="icon-sm"
              className="bg-card"
              aria-label={`Actions for ${user.firstName} ${user.lastName}`}
            />
          }
        >
          <Ellipsis />
        </DropdownMenuTrigger>

        {/* Wide enough that "Reset two-factor" stays on one line — left to
            itself the menu shrinks to its trigger and wraps every label longer
            than two words.

            Grouped by what the action touches: reading the account, changing
            what it may do, changing how it gets in. The destructive item is last
            and alone, well away from where the pointer rests after opening. */}
        <DropdownMenuContent align="end" className="min-w-52">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Account</DropdownMenuLabel>
            {/* A link, not an onClick: it goes somewhere, so it should be
                openable in a new tab and show its destination on hover like
                anything else that navigates. */}
            <DropdownMenuItem render={<Link href={`/users/${user.id}`} />}>
              <Eye data-icon="inline-start" />
              View details
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuLabel>Access</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setAction("role")}>
              <UserCog data-icon="inline-start" />
              Change role
            </DropdownMenuItem>
            {/* A link, not a dialog. Choosing among twelve permissions needs
                the whole picker, which is a screen — and `?user=` is what tells
                that screen whose permissions it is showing. */}
            <DropdownMenuItem
              render={<Link href={`/roles-permissions?user=${user.id}`} />}
            >
              <KeySquare data-icon="inline-start" />
              Change permissions
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuLabel>Security</DropdownMenuLabel>
            {/* Both of these get somebody back in when they are locked out —
                one for a forgotten password, one for a lost phone. Only the
                second has an endpoint: POST /api/users/{id}/2fa/reset. */}
            <DropdownMenuItem onClick={() => setAction("password")}>
              <KeyRound data-icon="inline-start" />
              Reset password
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setAction("twoFactor")}>
              <ShieldCheck data-icon="inline-start" />
              Reset two-factor
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => setAction("deactivate")}
            >
              <UserX data-icon="inline-start" />
              Deactivate
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <UserActionDialogs
        user={user}
        action={action}
        onClose={() => setAction(null)}
      />
    </>
  )
}

/**
 * Everyone with an account.
 *
 * <p>Client-side because of selection, search, sorting and the row menus. The
 * data arrives as a prop from the page, which fetched it on the server — so no
 * token reaches the browser and the list is in the first paint rather than after
 * a spinner.
 *
 * <p>Search and sort run in memory here. That is right at a dozen users and
 * wrong at a thousand: `GET /api/users` returns every row with no paging, so
 * both have to move server-side before this list grows.
 */
/** Read off the URL by the page and handed down. See `usersFilter.tsx`. */
type Filters = {
  role?: string
  status?: string
  /** "on" | "off" — a string because that is what a URL holds. */
  mfa?: string
}

function UsersTable({
  users,
  filters = {},
}: {
  users: UserRow[]
  filters?: Filters
}) {
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "id",
    dir: "asc",
  })
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE)
  const [page, setPage] = useState(1)

  const matched = useMemo(() => {
    const needle = query.trim().toLowerCase()

    // The dropdown filters narrow first, then the search box searches what is
    // left. Either order gives the same rows; this one means the search reads as
    // "within what I have filtered to", which is how people describe it.
    const filtered = users
      .filter((user) => {
        if (filters.role && user.role !== filters.role) return false
        if (filters.status && user.status !== filters.status) return false
        if (filters.mfa === "on" && !user.mfaEnabled) return false
        if (filters.mfa === "off" && user.mfaEnabled) return false
        return true
      })
      .filter((user) =>
        needle
          ? `${user.firstName} ${user.lastName} ${user.email} ${user.role}`
              .toLowerCase()
              .includes(needle)
          : true
      )

    // Copied before sorting: sort() mutates, and mutating a prop would corrupt
    // the array the page owns.
    return [...filtered].sort((a, b) => {
      const result = compare(a, b, sort.key)
      return sort.dir === "asc" ? result : -result
    })
  }, [users, query, sort, filters.role, filters.status, filters.mfa])

  // Clamped rather than reset. Narrowing a search from page 4 down to one page
  // of results would otherwise leave the table on a page that no longer exists,
  // showing nothing and looking broken.
  const pageCount = Math.max(1, Math.ceil(matched.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const start = (currentPage - 1) * pageSize
  const visible = matched.slice(start, start + pageSize)

  const hasFilters = Boolean(filters.role || filters.status || filters.mfa)

  const allVisibleSelected =
    visible.length > 0 && visible.every((u) => selected.has(u.id))

  function toggleSort(key: SortKey) {
    setSort((current) =>
      current.key === key
        ? { key, dir: current.dir === "asc" ? "desc" : "asc" }
        : // A new column starts ascending. Carrying the previous direction over
          // means clicking a fresh heading can sort it backwards for no visible
          // reason.
          { key, dir: "asc" }
    )
  }

  function toggleAll(checked: boolean) {
    const next = new Set(selected)
    // Only the rows currently on screen, so a filtered "select all" cannot
    // quietly pick up people the person searching never saw.
    visible.forEach((u) => (checked ? next.add(u.id) : next.delete(u.id)))
    setSelected(next)
  }

  function toggleOne(id: number, checked: boolean) {
    const next = new Set(selected)
    if (checked) next.add(id)
    else next.delete(id)
    setSelected(next)
  }

  return (
    // Same nesting as the stat cards above, at the same 2px inset — repeating
    // the shape is what makes the page read as one surface rather than a row of
    // cards followed by an unrelated slab.
    //
    // min-h-0 so this can be the thing that scrolls: a flex child defaults to
    // min-height:auto and would otherwise push the page taller instead of
    // scrolling inside itself.
    <div className="flex min-h-0 flex-1 flex-col rounded-md border bg-muted/40 p-0.5">
      {/* ── Toolbar ────────────────────────────────────────────────────────
          On the tinted shell, outside the white panel. It is chrome for the
          table rather than a row of it, and sitting on the outer surface says
          so — the same way the stat cards keep their footnote out there.

          Every control is 32px so the row has one baseline: the search field
          sets it, and the button and menu match rather than stepping down. */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 px-3 py-2">
        <p className={cn(HEAD, "mr-auto flex items-center gap-1.5 pl-2")}>
          {selected.size > 0 ? `${selected.size} selected` : "All users"}
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  // A button, not a bare icon: a tooltip that only appears on
                  // hover is unreachable by keyboard and invisible on a phone.
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="About this table"
                />
              }
            >
              <Info className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent className="max-w-64">
              Everyone with an account. Two-factor is required, so anyone showing
              Off cannot use the application until they enrol.
            </TooltipContent>
          </Tooltip>
        </p>

        <div className="relative">
          <Search
            className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          {/* No fill: it sits on the tinted shell and borrows it, which is what
              keeps the toolbar reading as one surface rather than three panels
              in a row. */}
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search users..."
            aria-label="Search users"
            className="h-8 w-56 rounded-md bg-transparent pl-8"
          />
        </div>

        <Button className="rounded-md" render={<Link href="/users/new" />}>
          <Plus data-icon="inline-start" />
          Add user
        </Button>

        {/* How many rows fit on a page. Sits with the other controls rather than
            down by the page numbers: it decides what the table shows, which is
            the same job as the search beside it. */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                className="rounded-md bg-transparent font-normal"
                aria-label={`Rows per page: ${pageSize}`}
              />
            }
          >
            {pageSize} rows
            <ChevronDown data-icon="inline-end" className="opacity-60" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-32">
            <DropdownMenuRadioGroup
              value={String(pageSize)}
              onValueChange={(value) => {
                setPageSize(Number(value))
                // Back to the first page: page 4 of a 10-row list does not
                // exist once the list shows 100 at a time.
                setPage(1)
              }}
            >
              {PAGE_SIZES.map((size) => (
                <DropdownMenuRadioItem key={size} value={String(size)}>
                  {size} rows
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                size="icon-sm"
                // Round, unlike the row menus. This one acts on the whole table,
                // and the different shape is what stops it reading as one more
                // per-row control that happens to have escaped upward. Smaller
                // than the two beside it as well: it holds the rarely-used
                // exports, so it should not carry the same weight as Add user.
                className="rounded-full bg-card"
                aria-label="More options"
              />
            }
          >
            <Ellipsis />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-44">
            <DropdownMenuItem>
              <FileText data-icon="inline-start" />
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem>
              <FileJson data-icon="inline-start" />
              Export as JSON
            </DropdownMenuItem>
            <DropdownMenuItem>
              <FileSpreadsheet data-icon="inline-start" />
              Export as Excel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-sm border bg-card">
        {/* The scroll lives on the table's own container, reached through
            containerClassName. Wrapping it in another scrolling div does not
            work: that wrapper stays between the header and the outer element, so
            the header pins itself to a box that only scrolls sideways and slides
            away as soon as you scroll down. */}
        <Table
          containerClassName={cn("min-h-0 flex-1 overflow-auto", THIN_SCROLLBAR)}
          // Only when empty. A table cell is vertically centred by default, so
          // stretching the table to its container is all it takes to put the
          // message in the middle of the space rather than tucked under the
          // headings. With rows present this would stretch them instead.
          className={cn(visible.length === 0 && "h-full")}
        >
            {/* The row's own border is dropped: with border-collapse a border on
                a sticky element scrolls away with the content it was collapsed
                against, leaving the heading floating. STICKY_HEAD draws it as an
                inset shadow on each cell instead, which travels with them. */}
            <TableHeader className="[&_tr]:border-b-0">
              <TableRow className="hover:bg-transparent">
                <TableHead className={cn(STICKY_HEAD, "w-10 pl-4")}>
                  <Checkbox
                    checked={allVisibleSelected}
                    onCheckedChange={toggleAll}
                    aria-label="Select all users"
                  />
                </TableHead>

                {COLUMNS.map(({ key, label, centred }) => {
                  const active = sort.key === key
                  const Icon = !active
                    ? ChevronsUpDown
                    : sort.dir === "asc"
                      ? ChevronUp
                      : ChevronDown

                  return (
                    <TableHead
                      key={key}
                      className={cn(HEAD, STICKY_HEAD, centred && "text-center")}
                      // On the header cell, not the button: aria-sort describes
                      // the column, and a button has no such state to report.
                      aria-sort={
                        active
                          ? sort.dir === "asc"
                            ? "ascending"
                            : "descending"
                          : "none"
                      }
                    >
                      {/* A real button, so the column is reachable by keyboard
                          rather than being a div that happens to respond to
                          clicks. */}
                      <button
                        type="button"
                        onClick={() => toggleSort(key)}
                        className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
                      >
                        {label}
                        <Icon
                          className={cn("size-3", active ? "opacity-100" : "opacity-40")}
                          aria-hidden
                        />
                      </button>
                    </TableHead>
                  )
                })}

                <TableHead className={cn(HEAD, STICKY_HEAD, "w-16 pr-4 text-right")}>
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {visible.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={COLUMNS.length + 2}
                    className="text-center align-middle text-sm text-muted-foreground"
                  >
                    {query
                      ? `No users match "${query}".`
                      : hasFilters
                        ? "No users match these filters."
                        : "No users yet."}
                  </TableCell>
                </TableRow>
              ) : (
                visible.map((user) => (
                  <TableRow
                    key={user.id}
                    data-state={selected.has(user.id) ? "selected" : undefined}
                    // Deactivated accounts dim rather than disappear: they still
                    // hold the email address, so hiding them means the same
                    // person cannot be found when they come back.
                    className={cn(user.status === "DEACTIVATED" && "opacity-55")}
                  >
                    <TableCell className="pl-4">
                      <Checkbox
                        checked={selected.has(user.id)}
                        onCheckedChange={(checked) => toggleOne(user.id, checked)}
                        aria-label={`Select ${user.firstName} ${user.lastName}`}
                      />
                    </TableCell>

                    <TableCell className="text-center font-mono text-xs text-muted-foreground">
                      #{String(user.id).padStart(4, "0")}
                    </TableCell>

                    <TableCell className="font-medium">{user.firstName}</TableCell>
                    <TableCell className="font-medium">{user.lastName}</TableCell>

                    <TableCell className="text-muted-foreground">
                      {user.email}
                    </TableCell>

                    <TableCell className="text-center">
                      <TwoFactorBadge enabled={user.mfaEnabled} />
                    </TableCell>

                    <TableCell className="text-center">
                      <StatusBadge status={user.status} />
                    </TableCell>

                    <TableCell className="pr-4 text-right">
                      <UserRowActions user={user} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
        </Table>
      </div>

      {/* ── Pagination ─────────────────────────────────────────────────────
          On the tinted shell below the card, mirroring the toolbar above it —
          both are chrome for the table rather than part of it, and keeping them
          on the same surface frames the rows between them.

          Outside the scrolling region too, so the controls stay put while the
          rows move. */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 px-3 py-1.5 text-[0.7rem] text-muted-foreground">
        <p className="pl-1 tabular-nums">
          {matched.length === 0
            ? "No results"
            : `Showing ${start + 1}–${Math.min(start + pageSize, matched.length)} of ${matched.length}`}
        </p>

        <div className="flex items-center gap-0.5">
          <Button
            variant="outline"
            size="icon-xs"
            className="rounded-md bg-card"
            disabled={currentPage === 1}
            onClick={() => setPage(currentPage - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft />
          </Button>

          {pageNumbers(currentPage, pageCount).map((entry, i) =>
            entry === "gap" ? (
              // Not a button: there is no single page it would take you to.
              <span key={`gap-${i}`} className="px-0.5 text-muted-foreground">
                …
              </span>
            ) : (
              <Button
                key={entry}
                variant={entry === currentPage ? "default" : "outline"}
                size="icon-xs"
                className={cn(
                  "rounded-md tabular-nums",
                  entry !== currentPage && "bg-card"
                )}
                onClick={() => setPage(entry)}
                aria-label={`Page ${entry}`}
                aria-current={entry === currentPage ? "page" : undefined}
              >
                {entry}
              </Button>
            )
          )}

          <Button
            variant="outline"
            size="icon-xs"
            className="rounded-md bg-card"
            disabled={currentPage === pageCount}
            onClick={() => setPage(currentPage + 1)}
            aria-label="Next page"
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
    </div>
  )
}

export { UsersTable, type UserRow }
