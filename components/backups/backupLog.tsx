"use client"

import { Fragment } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
  CircleAlert,
  CircleCheck,
  CircleSlash,
  Download,
  ExternalLink,
  LoaderCircle,
  Trash2,
} from "lucide-react"

import { Panel } from "@/components/system/panel"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TablePagination } from "@/components/ui/tablePagination"
import {
  LOG_PAGE_SIZES,
  type BackupLogPage,
  type BackupOutcome,
  type BackupQuery,
  type BackupSortKey,
} from "@/lib/backupTypes"
import { bytes, duration, utcStamp } from "@/lib/format"
import { THIN_SCROLLBAR } from "@/lib/scrollbar"
import { cn } from "@/lib/utils"

/**
 * Every run, newest first.
 *
 * <p>This is the panel that gets used when something is wrong, so it carries the
 * <b>reason</b> a run failed rather than only the fact. "Failed" tells nobody
 * anything at two in the morning; "Google refused the upload — the connection
 * expired" says what to go and fix.
 *
 * <p>⚠️ A day where nothing ran at all produces no row here, because there was no
 * run to write down. That is precisely why the heatmap above exists: absence is
 * invisible in a list and obvious in a grid.
 *
 * <p><b>Client-side only for the headings.</b> The rows arrive as a prop, already
 * in order — the sort is applied by whoever fetched them, exactly as the users
 * list works. All this component does is write the choice into the address bar
 * and let the page come back with the answer. See `lib/backups.ts`.
 */

const OUTCOME: Record<
  BackupOutcome,
  { label: string; tone: string; icon: React.ComponentType<{ className?: string }> }
> = {
  succeeded: { label: "Successful", tone: "text-success", icon: CircleCheck },
  failed: { label: "Failed", tone: "text-destructive", icon: CircleAlert },
  missed: { label: "Nothing ran", tone: "text-warning", icon: CircleSlash },
  running: { label: "In progress", tone: "text-foreground", icon: LoaderCircle },
}

/**
 * The four columns worth ordering by, and which way each leans.
 *
 * <p>Keyed by the field rather than the heading, because these strings end up in
 * the address bar. Actions is not here: there is nothing to order a pair of
 * buttons by.
 */
const COLUMNS: {
  key: BackupSortKey
  label: string
  /** Numbers read down a right edge; dates and words read down a left one. */
  align: "left" | "right"
  /** Share of the table. See {@link WIDTHS}. */
  width: string
  className?: string
}[] = [
  {
    key: "startedAt",
    label: "Created at",
    align: "left",
    width: "24%",
    className: "pl-4",
  },
  { key: "outcome", label: "Status", align: "left", width: "18%", className: "px-3" },
  {
    key: "sizeBytes",
    label: "Size",
    align: "right",
    width: "18%",
    className: "px-3",
  },
  {
    key: "durationSeconds",
    label: "Duration",
    align: "right",
    width: "19%",
    className: "px-3",
  },
]

/** Actions has no heading to sort by, so it carries its share here. */
const ACTIONS_WIDTH = "21%"

/**
 * ⚠️ <b>The columns are declared, not measured — and they have to be.</b>
 *
 * <p>A browser sizing a table to its content reads every cell, and one of these
 * cells holds a whole sentence: the reason a run failed, spanning four columns
 * under the row it belongs to. So a page with a failure on it laid its columns
 * out differently from a page without one — Status sat seventy pixels further
 * along, Size moved with it, and paging through the log made the whole table
 * shuffle sideways under the pointer.
 *
 * <p>`table-fixed` takes the decision away from the content: the widths below
 * are the widths, on every page, whether or not anything broke that day. The
 * error keeps its full width because it spans four of these columns; what it can
 * no longer do is decide how wide they are.
 */
const WIDTHS = [...COLUMNS.map((column) => column.width), ACTIONS_WIDTH]

const HEAD =
  "py-2 font-mono text-[0.65rem] font-medium tracking-wider text-muted-foreground uppercase"

/**
 * `12s`, `2m 15s`, `1h 04m` — how long a run took.
 *
 * <p>Not the shared `duration()` helper, which is built for uptimes and rounds
 * to one unit: it turns two and a quarter minutes into "2 minutes". For an
 * uptime that is right, because nobody needs the minutes of a fortnight. Here
 * the seconds are the interesting part — a run that grows from 12s to 45s is
 * telling you something, and both round to the same word.
 */
function took(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ${Math.round(seconds % 60)}s`

  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m`
}

const ACTION_BUTTON =
  "rounded-sm p-1 text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:text-muted-foreground/40 disabled:hover:text-muted-foreground/40"

/**
 * Open, download, delete — in that order, and that order is the argument.
 *
 * <p>Least to most destructive, left to right. The one that ends a backup sits
 * furthest from the one that merely looks at it, so a misplaced click lands on
 * something harmless.
 *
 * <p><b>Open</b> goes to the file where it actually lives, at the destination.
 * It is keyed off whether there <em>is</em> a file rather than off the outcome:
 * a run that failed has nothing to show, a run still going has not finished
 * writing one, and a success that somehow left nothing behind should say so
 * rather than offer a link into thin air.
 *
 * <p>Download and delete are drawn but not wired — see bugForLater #24. A button
 * that silently does nothing is worse than one that says why it cannot.
 *
 * <p>⚠️ When delete is built it needs a confirmation. It is the one control on
 * this screen that destroys a backup, which is the thing the screen exists to
 * protect.
 */
function Actions({ url }: { url: string | null }) {
  return (
    <span className="flex items-center justify-end gap-1">
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer noopener"
          title="Open this backup in Google Drive"
          aria-label="Open this backup in Google Drive"
          className={ACTION_BUTTON}
        >
          <ExternalLink className="size-3.5" />
        </a>
      ) : (
        <button
          type="button"
          disabled
          title="This run left no file to open"
          aria-label="Open this backup in Google Drive"
          className={ACTION_BUTTON}
        >
          <ExternalLink className="size-3.5" />
        </button>
      )}

      <button
        type="button"
        disabled
        title="Downloading a backup is not built yet"
        aria-label="Download this backup"
        className={ACTION_BUTTON}
      >
        <Download className="size-3.5" />
      </button>
      <button
        type="button"
        disabled
        title="Deleting a backup is not built yet"
        aria-label="Delete this backup"
        className={ACTION_BUTTON}
      >
        <Trash2 className="size-3.5" />
      </button>
    </span>
  )
}

function BackupLog({
  log,
  now,
  query,
}: {
  /** One page of runs, already sorted and sliced by the server. */
  log: BackupLogPage
  /** Decided by the caller, so relative times match between server and browser. */
  now: Date
  /** What the address bar currently says. The single source of truth. */
  query: BackupQuery
}) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const [sortKey, sortDir] = (query.sort ?? "").split(",")

  /** 1-based index of the first row on screen, for "Showing 11–20 of 62". */
  const from = (log.page - 1) * log.size + 1

  /**
   * Asks for a different order and lets the server answer.
   *
   * <p>A new column starts ascending. Carrying the previous direction over
   * means clicking a fresh heading can sort it backwards for no visible reason.
   *
   * <p>`scroll: false` because the log is a scrolling region inside a fixed
   * page — jumping to the top of a document that does not move would be a
   * change nobody could see, on a panel that had just visibly reordered itself.
   */
  function toggleSort(key: BackupSortKey) {
    const nextDir = sortKey === key && sortDir !== "desc" ? "desc" : "asc"

    setParam("sort", `${key},${nextDir}`)
  }

  /**
   * Writes one parameter and lets the server answer.
   *
   * <p>Anything except the page number returns to page one. Page 4 of a 50-row
   * log is not page 4 of a 10-row one, and re-sorting while on page 3 leaves you
   * looking at rows that have nothing to do with what you asked for.
   *
   * <p>`scroll: false` because the log is a scrolling region inside a page that
   * does not move — jumping to the top of a static document would be a change
   * nobody could see, on a panel that had just visibly reordered itself.
   */
  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString())
    next.set(key, value)
    if (key !== "page") next.delete("page")

    router.push(`${pathname}?${next.toString()}`, { scroll: false })
  }

  return (
    <Panel
      title="Log"
      hint={
        <>
          Every run that happened. Days where nothing ran leave no row — see the
          year above.
        </>
      }
      action={
        // Count, page size, then position — the order the questions get asked:
        // how much is there, how much am I seeing, where am I in it.
        <span className="flex items-center gap-2">
          <span className="font-mono text-[0.7rem] text-muted-foreground tabular-nums">
            {log.total} runs
          </span>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="xs"
                  className="bg-transparent font-normal"
                  aria-label={`Rows per page: ${log.size}`}
                />
              }
            >
              {log.size} rows
              <ChevronDown data-icon="inline-end" className="opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-32">
              <DropdownMenuRadioGroup
                value={String(log.size)}
                // setParam already returns to page one, which is what this
                // needs: page 4 of a 10-row log does not exist at 50 rows.
                onValueChange={(value) => setParam("size", value)}
              >
                {LOG_PAGE_SIZES.map((size) => (
                  <DropdownMenuRadioItem key={size} value={String(size)}>
                    {size} rows
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

        </span>
      }
      footer={
        /* Under the card on the tinted shell, the same place and the same
           controls as the user list — see `lib/pagination.ts`, which both draw
           their page numbers from so "the same UI" stays a fact rather than a
           coincidence.

           Outside the scrolling region, so the controls stay put while the rows
           move under them. */
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 px-3 py-1.5 text-[0.7rem] text-muted-foreground">
          <p className="pl-1 tabular-nums">
            {log.total === 0
              ? "No runs yet"
              : `Showing ${from}–${from + log.runs.length - 1} of ${log.total}`}
          </p>

          <TablePagination
            page={log.page}
            totalPages={log.totalPages}
            onPage={(next) => setParam("page", String(next))}
          />
        </div>
      }
      className="lg:min-h-48 lg:flex-1"
      bodyClassName="p-0"
    >
      {/* The same scroll chain as the tables card on System Health: the region
          scrolls inside the card rather than growing it, so the summary and the
          heatmap above stay put. */}
      <div className={cn("lg:min-h-0 lg:flex-1 lg:overflow-y-auto", THIN_SCROLLBAR)}>
        {log.runs.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">
            No backup has run yet.
          </p>
        ) : (
          <table className="w-full table-fixed border-collapse text-sm">
            <colgroup>
              {WIDTHS.map((width, index) => (
                <col key={index} style={{ width }} />
              ))}
            </colgroup>

            <thead className="sticky top-0 z-10 bg-card">
              <tr className="border-b">
                {COLUMNS.map(({ key, label, align, className }) => {
                  const active = sortKey === key
                  const Icon = !active
                    ? ChevronsUpDown
                    : sortDir === "desc"
                      ? ChevronDown
                      : ChevronUp

                  return (
                    <th
                      key={key}
                      className={cn(
                        HEAD,
                        align === "right" ? "text-right" : "text-left",
                        className
                      )}
                      // On the header cell, not the button: aria-sort describes
                      // the column, and a button has no such state to report.
                      aria-sort={
                        active
                          ? sortDir === "desc"
                            ? "descending"
                            : "ascending"
                          : "none"
                      }
                    >
                      {/* A real button, so the column is reachable by keyboard
                          rather than being a div that happens to respond to
                          clicks. */}
                      <button
                        type="button"
                        onClick={() => toggleSort(key)}
                        className={cn(
                          "inline-flex items-center gap-1 transition-colors hover:text-foreground",
                          // The column the table is actually ordered by, in the
                          // full-strength text. It used to be marked only by the
                          // arrow swapping shape at 12px, which is far too quiet
                          // for the thing explaining why the rows are in the
                          // order they are in — a list sorted by size has its
                          // dates apparently scrambled, and nothing said why.
                          active && "text-foreground"
                        )}
                      >
                        {label}
                        <Icon
                          className={cn("size-3", active ? "opacity-100" : "opacity-40")}
                          aria-hidden
                        />
                      </button>
                    </th>
                  )
                })}

                <th className={cn(HEAD, "pr-4 text-right whitespace-nowrap")}>
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {log.runs.map((run) => {
                const outcome = OUTCOME[run.outcome]
                const Icon = outcome.icon
                const ago = Math.max(
                  0,
                  (now.getTime() - new Date(run.startedAt).getTime()) / 1000
                )

                return (
                  <Fragment key={run.id}>
                    <tr
                      className={cn(
                        "align-top",
                        // The rule belongs under whichever line is last, so a
                        // failure and its reason are fenced together as one
                        // entry rather than divided from each other.
                        !run.error && "border-b last:border-b-0"
                      )}
                    >
                      <td className="py-2.5 pl-4 whitespace-nowrap">
                        <span className="font-mono text-xs">
                          {utcStamp(run.startedAt)}
                        </span>
                        <span className="block text-[0.7rem] text-muted-foreground">
                          ({duration(ago)} ago)
                        </span>
                      </td>

                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span
                          className={cn(
                            "flex items-center gap-1.5 text-xs font-medium",
                            outcome.tone
                          )}
                        >
                          <Icon
                            className={cn(
                              "size-3.5 shrink-0",
                              run.outcome === "running" && "animate-spin"
                            )}
                            aria-hidden
                          />
                          {outcome.label}
                        </span>
                      </td>

                      <td className="px-3 py-2.5 text-right text-xs tabular-nums">
                        {run.sizeBytes > 0 ? (
                          bytes(run.sizeBytes)
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </td>

                      <td className="px-3 py-2.5 text-right text-xs text-muted-foreground tabular-nums">
                        {took(run.durationSeconds)}
                      </td>

                      <td className="py-2.5 pr-4 text-right">
                        <Actions url={run.url} />
                      </td>
                    </tr>

                    {/* The reason belongs to the status, and starts where the
                        status does — the empty cell in front of it is what lines
                        the two up.

                        It cannot live *inside* that cell: a sentence there is
                        what made Status wide enough to hold one, and four rows
                        in five then paid for a column that was empty for them.
                        Nor can it start at the left edge, which reads as a note
                        about the whole run rather than about the word directly
                        above it. So it begins under Status and runs to the end
                        of the table — aligned with what it explains, with the
                        width to be a sentence. */}
                    {run.error && (
                      <tr className="border-b last:border-b-0">
                        <td />
                        <td
                          colSpan={COLUMNS.length}
                          className="px-3 pb-2.5 text-[0.7rem] text-muted-foreground"
                        >
                          {run.error}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </Panel>
  )
}

export { BackupLog }
