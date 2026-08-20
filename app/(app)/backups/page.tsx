import type { Metadata } from "next"

import { BackupLog } from "@/components/backups/backupLog"
import { BackupSummary } from "@/components/backups/backupSummary"
import { BackupYear } from "@/components/backups/backupYear"
import { PageHeader } from "@/components/layout/pageHeader"
import { TopBanner } from "@/components/ui/topBanner"
import { requireUser } from "@/lib/auth"
import { getBackupStatus } from "@/lib/backups"
import type { BackupQuery } from "@/lib/backupTypes"

export const metadata: Metadata = {
  title: "Backups",
}

/**
 * Copies of the database, and whether they can be trusted.
 *
 * <p>⚠️ <b>The layout is real, the numbers are not.</b> Nothing backs anything up
 * yet — this is the screen built first so the shape can be argued with before the
 * machinery exists, the same way System Health was. The banner says so, because a
 * backup page is the one screen somebody opens specifically to decide they do not
 * need to worry, and one that looks healthy while nothing exists behind it is
 * worse than no page at all.
 *
 * <p>Three panels, in the order the questions get asked:
 *
 * <ul>
 *   <li><b>How exposed am I</b> — time since the last good backup, which is
 *       exactly how much work is lost if the machine dies now.</li>
 *   <li><b>Has this been reliable</b> — a year of squares, where a bad week is
 *       visible without reading anything.</li>
 *   <li><b>What went wrong</b> — the log, carrying the reason and not just the
 *       fact.</li>
 * </ul>
 *
 * <p>Two things deliberately absent, both recorded in `bugForLater.md`:
 * <b>restoring</b> a backup, and <b>proving</b> one can be restored. The second
 * matters more — until it exists, a green square means "the file uploaded", which
 * is not the same claim as "the data comes back".
 *
 * <p>Administrators only, via middleware's `ADMIN_ONLY` — the last moment a real
 * 403 can still be returned, since a page that has begun rendering has already
 * sent a 200.
 */
export default async function BackupsPage({
  searchParams,
}: {
  /** The log's sort and the chart's year. Both write here and read from here. */
  searchParams: Promise<BackupQuery>
}) {
  await requireUser()

  const query = await searchParams

  // Decided once, on the server, and passed down. Components that read the clock
  // themselves render one answer here and a different one after hydration, which
  // React reports as a mismatch.
  const now = new Date()

  // Ordered here rather than in the table, the same split the users list uses:
  // the component asks for a sort by writing it into the address bar, and the
  // rows come back already in that order. The day this is a real API, the sort
  // is a query parameter forwarded to it and nothing on the screen changes.
  const { status, log } = await getBackupStatus(query, now)

  return (
    <div className="flex h-full min-h-0 flex-col gap-5 overflow-y-auto p-4 pb-3 sm:p-6 lg:overflow-hidden">
      <TopBanner message="Preview — nothing is backing up yet. Every figure on this page is an example." />

      <PageHeader
        title="Backups"
        description="Copies of the database, and whether they can actually be restored."
      />

      {/* Two columns, not three rows. The left holds the history — the year
          above the log, both about the same thing at different zoom levels. The
          right holds the four single figures.

          A fixed 20rem for the cards rather than a share of the width, and the
          left column takes everything else. Proportional tracks were the first
          attempt: at 2fr/1fr the cards grew with the window, and on a wide screen
          four short readings sat in a column half again as wide as they needed
          while the five-column table beside them was the thing actually short of
          room. A single figure needs a fixed amount of space; a table will use
          whatever it is given. */}
      <div className="grid gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-4 lg:min-h-0">
          <BackupYear status={status} query={query} />
          {/* Keyed on the query, the same way the user list is. A new page of
              runs into the same element leaves the scrolling region exactly
              where it was, so moving to page 2 lands you halfway down it looking
              at rows you have not chosen. Remounting starts it at the top, which
              is where a new page begins. */}
          <BackupLog
            key={JSON.stringify(query)}
            log={log}
            now={now}
            query={query}
          />
        </div>

        <BackupSummary status={status} now={now} />
      </div>
    </div>
  )
}
