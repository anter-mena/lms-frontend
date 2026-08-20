/**
 * The shape the Backups screen draws.
 *
 * <p>Client-safe on purpose, the same split as `userTypes` and `systemTypes`:
 * the components are shared between the server page and, later, whatever polls
 * for updates, and a file that reads the session cookie cannot be imported from
 * the browser.
 *
 * <p>⚠️ Nothing produces this yet. It is written as the shape the API will
 * return so the screen can be built against it, and so the day the backend
 * arrives the only change is where the data comes from.
 */

/**
 * What happened on a given day.
 *
 * <p>`missed` is deliberately its own state rather than a kind of failure. A
 * failure is loud — something ran, broke, and said so. A miss is silent: nothing
 * ran at all, because the machine was off or the schedule never fired. That is
 * the more dangerous of the two, and it appears only in the year counts, never
 * in the log — a list can show what happened, never what did not.
 *
 * <p>`running` is the only one that is not yet a verdict — it is a run in
 * progress, so it has a duration so far but no size and no destination. It is
 * also the only one that changes on its own while somebody is looking at it.
 */
export type BackupOutcome = "succeeded" | "failed" | "missed" | "running"

export type BackupRun = {
  id: string
  /** ISO timestamp the run started. */
  startedAt: string
  outcome: BackupOutcome
  /** Size of the finished file. Zero when the run never produced one. */
  sizeBytes: number
  durationSeconds: number
  /** Where it was stored. Null when it never got that far. */
  destination: string | null
  /**
   * Why it failed, in a sentence a person can act on.
   *
   * <p>"Failed" on its own is useless at two in the morning. "Google refused the
   * upload — the permission expired" tells you what to go and fix.
   */
  error: string | null
  /**
   * Where the finished file sits, for opening it at the destination.
   *
   * <p>Null whenever there is nothing to open — a run that failed before it
   * uploaded, and a run still going. The log keys the "open" action off this
   * rather than off the outcome, so a success that somehow left no file is
   * still honest about having nothing behind it.
   */
  url: string | null
}

/**
 * The columns of the log that can be ordered.
 *
 * <p>Named after the fields rather than the headings, because these strings end
 * up in the address bar and outlive whatever the column is called on screen.
 */
export type BackupSortKey =
  | "startedAt"
  | "outcome"
  | "sizeBytes"
  | "durationSeconds"

/**
 * What the address bar carries, and the only state the log has.
 *
 * <p>Same shape as `UserQuery`: `"sizeBytes,desc"` — the column and the
 * direction in one string. It lives in the URL rather than in the component so
 * the Back button undoes a sort and a sorted view can be sent to somebody.
 */
export type BackupQuery = {
  sort?: string
  /** Which year the chart is showing. Absent means the most recent one. */
  year?: string
  /** 1-based page of the log. */
  page?: string
  /** Rows a page. One of {@link LOG_PAGE_SIZES}. */
  size?: string
}

/**
 * Rows a page in the log.
 *
 * <p>Ten by default. The log sits in a panel of fixed height beside the summary
 * cards, so a page taller than the panel does not show more of anything — it
 * puts a scrollbar inside a scrollbar and makes the page numbers meaningless.
 * The larger two are for a screen with the room, not for scrolling further.
 */
export const LOG_PAGE_SIZES = [10, 25, 50] as const

export const DEFAULT_LOG_PAGE_SIZE = 10

/**
 * One page of the log, and enough about the rest to draw the controls.
 *
 * <p>Separate from {@link BackupStatus} on purpose. Everything in that is a fact
 * about the backups; this is a fact about what somebody is currently looking at,
 * and folding the two together is what makes a status object slowly become a
 * view model.
 */
export type BackupLogPage = {
  runs: BackupRun[]
  /** Every run the log holds, before paging. */
  total: number
  /** 1-based, and always within range — a page past the end comes back as the last. */
  page: number
  size: number
  totalPages: number
}

/** One square on the heatmap. `outcome: null` means before backups existed. */
export type BackupDay = {
  /** YYYY-MM-DD. */
  date: string
  outcome: BackupOutcome | null
}

export type BackupStatus = {
  /**
   * The last run that actually worked, or null if none ever has.
   *
   * <p>This — not the next run — is the number the page leads with. How long ago
   * it was is exactly how much work is currently at risk, and that is the only
   * figure on this screen anybody can act on.
   */
  lastSuccessAt: string | null
  nextRunAt: string | null
  /** The schedule in words, e.g. "Every day at 03:00". */
  schedule: string
  /**
   * Files sitting at the destination right now, after retention has pruned.
   *
   * <p>Smaller than {@link totalRuns} and meant to be — retention deletes old
   * copies on purpose. Showing both says "we have run this 412 times and are
   * keeping 38 of them", which is the difference between a working retention
   * rule and one that quietly never fires.
   */
  storedCount: number
  storedBytes: number
  /** Every run that ever succeeded, including copies since deleted. */
  totalRuns: number
  /** Where backups are sent, for the screen to name. */
  destination: string
  /**
   * The destination's whole quota — not just what backups occupy.
   *
   * <p>⚠️ On a personal Google account this is the <em>same</em> 15 GB as Gmail
   * and Photos. Backups are around a megabyte each and will never fill it on
   * their own; a phone uploading its camera roll will. That is exactly why this
   * is on the page: the thing most likely to stop backups working is something
   * that has nothing to do with backups.
   */
  destinationUsedBytes: number
  destinationTotalBytes: number
  /** Oldest first, one per day, for the heatmap. */
  days: BackupDay[]
  /** Newest first. */
  runs: BackupRun[]
}
