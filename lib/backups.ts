import "server-only"

import { sampleBackupStatus } from "@/lib/backupSample"
import {
  DEFAULT_LOG_PAGE_SIZE,
  LOG_PAGE_SIZES,
  type BackupLogPage,
  type BackupOutcome,
  type BackupQuery,
  type BackupRun,
  type BackupSortKey,
  type BackupStatus,
} from "@/lib/backupTypes"

/**
 * Where the Backups screen gets its data.
 *
 * <p>The same job `lib/system.ts` does for System Health: one place the page
 * asks, so the page never knows whether the answer came from a backend, a file
 * or — as today — an invented sample. When the API arrives, the body of
 * {@link getBackupStatus} becomes an `apiFetch` call and nothing else on the
 * screen changes.
 *
 * <p>Async already, for that reason. A synchronous function here would mean the
 * page's `await` appears on the day the backend does, and a change that touches
 * the page as well as this file is a change that can break the page.
 *
 * <p>Server-only, like its neighbours: the day this fetches, it fetches with a
 * token out of an httpOnly cookie the browser cannot read.
 */

/**
 * How the log is ordered when nobody has said.
 *
 * <p>Newest first. It is what the type promises callers, and the question this
 * screen is opened with is almost always "did last night work".
 */
const DEFAULT_SORT: { key: BackupSortKey; descending: boolean } = {
  key: "startedAt",
  descending: true,
}

/**
 * Which outcome counts as "less" than which, for sorting by status.
 *
 * <p>Alphabetical would be meaningless — failed, missed, running, succeeded is
 * an accident of English, not an order anybody wants. Ranked by <b>how much it
 * should worry you</b> instead, so ascending puts the bad days at the top, which
 * is the only reason to sort this column at all.
 */
const SEVERITY: Record<BackupOutcome, number> = {
  failed: 0,
  missed: 1,
  running: 2,
  succeeded: 3,
}

function compare(a: BackupRun, b: BackupRun, key: BackupSortKey): number {
  switch (key) {
    case "startedAt":
      return new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
    case "outcome":
      return SEVERITY[a.outcome] - SEVERITY[b.outcome]
    case "sizeBytes":
      return a.sizeBytes - b.sizeBytes
    case "durationSeconds":
      return a.durationSeconds - b.durationSeconds
  }
}

/** Anything the address bar offers that is not a column is ignored, not obeyed. */
const SORTABLE: BackupSortKey[] = [
  "startedAt",
  "outcome",
  "sizeBytes",
  "durationSeconds",
]

function parseSort(sort: string | undefined) {
  const [key, direction] = (sort ?? "").split(",")

  if (!SORTABLE.includes(key as BackupSortKey)) return DEFAULT_SORT

  return { key: key as BackupSortKey, descending: direction === "desc" }
}

/**
 * The log in the order the address bar asked for.
 *
 * <p><b>Sorted here rather than in the table, and that split is the point.</b>
 * The users list works the same way — the component writes a sort into the URL
 * and the server comes back with rows already in that order. Doing it in the
 * browser instead means every run has to be sent before any of them can be
 * ordered, which is fine at sixty rows and wrong at six thousand. Keeping the
 * split now means the day this becomes an API call, the sort is a query
 * parameter passed straight through and the table does not change at all.
 *
 * <p>Ties fall back to newest first, so two runs of the same size never swap
 * places between renders for no visible reason.
 */
function sortRuns(runs: BackupRun[], query: BackupQuery): BackupRun[] {
  const { key, descending } = parseSort(query.sort)

  return [...runs].sort((a, b) => {
    const primary = compare(a, b, key)
    if (primary !== 0) return descending ? -primary : primary

    return new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  })
}

/**
 * One page of the log, after the sort.
 *
 * <p>Clamped rather than trusted. A `page` past the end comes back as the last
 * page instead of an empty table — which is what somebody gets by deleting rows
 * while on page 7 of 7, or by following a link that was true last week. An
 * unrecognised `size` falls back to the default for the same reason.
 */
function paginate(runs: BackupRun[], query: BackupQuery): BackupLogPage {
  const asked = Number(query.size)
  const size = LOG_PAGE_SIZES.includes(asked as (typeof LOG_PAGE_SIZES)[number])
    ? asked
    : DEFAULT_LOG_PAGE_SIZE

  const totalPages = Math.max(1, Math.ceil(runs.length / size))
  const page = Math.min(Math.max(Number(query.page) || 1, 1), totalPages)
  const from = (page - 1) * size

  return {
    runs: runs.slice(from, from + size),
    total: runs.length,
    page,
    size,
    totalPages,
  }
}

/**
 * Everything the screen draws, in one call.
 *
 * <p>Two things come back rather than one: the whole picture, and the slice of
 * the log currently on screen. An API would answer the same way — sending four
 * hundred runs so the browser can show ten of them is the arrangement paging
 * exists to avoid.
 *
 * @param query what the address bar says — the sort, the chart's year, the page.
 * @param now   decided by the caller and passed in, so the page and the two
 *              ticking tiles all agree on the moment. Reading the clock in more
 *              than one place is how a server render and its hydration end up
 *              disagreeing.
 *
 * ⚠️ Every figure below is invented — see `lib/backupSample.ts`, and the banner
 * on the page itself. Nothing backs anything up yet.
 */
export async function getBackupStatus(
  query: BackupQuery,
  now: Date
): Promise<{ status: BackupStatus; log: BackupLogPage }> {
  const status = sampleBackupStatus(now)
  const sorted = sortRuns(status.runs, query)

  return {
    status: { ...status, runs: sorted },
    log: paginate(sorted, query),
  }
}
