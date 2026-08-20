import type {
  BackupDay,
  BackupOutcome,
  BackupRun,
  BackupStatus,
} from "@/lib/backupTypes"

/**
 * Invented data, so the screen can be designed before the backend exists.
 *
 * <p>⚠️ <b>This is not a measurement and the page says so.</b> Every figure here
 * is made up. It exists to answer "does this layout work" — a heatmap with no
 * squares and a log with no rows tells you nothing about either.
 *
 * <p>Deliberately not random. Two reasons. It is generated on the server and
 * handed to components as props, so anything non-deterministic would render one
 * thing on the server and another in the browser, and React would flag the
 * mismatch. And a design preview wants a <em>story</em> — a long healthy run, one
 * bad patch, one silent gap — rather than noise, because the point is to check
 * that all three read differently at a glance.
 *
 * <p>Delete this file the day the API is real. It should leave no trace in the
 * components, which is why they take a `BackupStatus` and know nothing about
 * where it came from.
 */

/**
 * Two years and a bit.
 *
 * <p>It used to be 364 — one year, which was all the heatmap needed. The year
 * chart compares a year against the one before it, and a comparison needs both:
 * with a single year of history the ghost bars were empty across the whole
 * chart, which says nothing about whether the design works.
 */
const DAYS = 800

/** Before this, backups did not exist — those weeks stay empty. */
const STARTED_DAYS_AGO = 760

/**
 * Stretches where nothing ran at all: the machine was off.
 *
 * <p>One in each year on purpose. A preview where every gap is in the current
 * year cannot show what the comparison looks like when the <em>other</em> year
 * is the bad one.
 */
const GAPS = [
  { startDaysAgo: 96, length: 5 },
  { startDaysAgo: 430, length: 4 },
]

/**
 * Scattered days where the job ran and broke.
 *
 * <p>The recent ones are listed by hand because the log shows the last sixty
 * days and those rows are what the table was designed against. Older failures
 * come from {@link olderFailure}, which spreads a few across the earlier year
 * without another twenty numbers here.
 */
const FAILURE_DAYS_AGO = new Set([173, 142, 141, 63, 24, 9])

/** Roughly one failure every ten weeks, before the hand-listed ones begin. */
function olderFailure(daysAgo: number): boolean {
  return daysAgo > 200 && daysAgo % 71 === 13
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function outcomeFor(daysAgo: number): BackupOutcome | null {
  if (daysAgo > STARTED_DAYS_AGO) return null

  for (const gap of GAPS) {
    if (daysAgo <= gap.startDaysAgo && daysAgo > gap.startDaysAgo - gap.length) {
      return "missed"
    }
  }

  if (FAILURE_DAYS_AGO.has(daysAgo) || olderFailure(daysAgo)) return "failed"

  return "succeeded"
}

/** Roughly plausible: a small database that grows a little over the year. */
function sizeFor(daysAgo: number): number {
  return Math.round(1_180_000 + (STARTED_DAYS_AGO - daysAgo) * 1_450)
}

const REASONS = [
  "Google refused the upload — the connection has expired and needs re-authorising.",
  "The database refused the connection — it was restarting at the time.",
  "Ran out of disk while writing the dump.",
]

export function sampleBackupStatus(now: Date): BackupStatus {
  const today = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  )

  const days: BackupDay[] = []
  for (let daysAgo = DAYS; daysAgo >= 0; daysAgo--) {
    const date = new Date(today)
    date.setUTCDate(date.getUTCDate() - daysAgo)
    days.push({ date: isoDate(date), outcome: outcomeFor(daysAgo) })
  }

  // The log only goes back as far as anybody scrolls. Sixty days is plenty to
  // show the shape of the table and still contain a failure or two.
  const runs: BackupRun[] = []
  for (let daysAgo = 0; daysAgo <= 60; daysAgo++) {
    const outcome = outcomeFor(daysAgo)

    // A miss produces no row at all — that is what makes it silent, and why the
    // heatmap is the only place it shows up. Worth seeing in the preview.
    if (outcome === null || outcome === "missed") continue

    const startedAt = new Date(today)
    startedAt.setUTCDate(startedAt.getUTCDate() - daysAgo)
    startedAt.setUTCHours(3, 0, Math.round((daysAgo * 7) % 60), 0)

    const failed = outcome === "failed"

    runs.push({
      id: `sample-${daysAgo}`,
      startedAt: startedAt.toISOString(),
      outcome,
      sizeBytes: failed ? 0 : sizeFor(daysAgo),
      durationSeconds: failed ? 4 + (daysAgo % 3) : 11 + (daysAgo % 7),
      destination: failed ? null : "Google Drive",
      error: failed ? REASONS[daysAgo % REASONS.length] : null,
      // Null on every sample run, including the ones that "succeeded" —
      // deliberately. Nothing has ever been uploaded, so there is no file
      // anywhere to open, and an invented Drive link would send whoever clicked
      // it to a "file not found" page and teach them the button is broken. The
      // action renders in its disabled state instead, which is the truth.
      url: null,
    })
  }

  // The last success is found before the in-progress run is added, deliberately:
  // a run still going has not saved anything, so it cannot reduce what is at
  // risk. That only drops when a backup finishes.
  const lastSuccess = runs.find((r) => r.outcome === "succeeded")

  // A run happening right now, on top of tonight's scheduled one — the state you
  // would see having just pressed "back up now". It is the only row with no size
  // and no destination, because neither exists until it finishes.
  runs.unshift({
    id: "sample-running",
    startedAt: new Date(now.getTime() - 135_000).toISOString(),
    outcome: "running",
    sizeBytes: 0,
    durationSeconds: 135,
    destination: null,
    error: null,
    // A run in progress has uploaded nothing yet, so this is null for a reason
    // that survives the sample being deleted.
    url: null,
  })

  const nextRun = new Date(today)
  nextRun.setUTCDate(nextRun.getUTCDate() + 1)
  nextRun.setUTCHours(3, 0, 0, 0)

  // Retention: every day for a fortnight, then weekly for three months, then
  // monthly for a year. Roughly forty files, and under a hundred megabytes.
  const storedCount = 14 + 12 + 12
  const storedBytes = storedCount * 1_400_000

  return {
    lastSuccessAt: lastSuccess?.startedAt ?? null,
    nextRunAt: nextRun.toISOString(),
    schedule: "Every day at 03:00 UTC",
    storedCount,
    storedBytes,
    // Every day since backups began, minus the gap and the failures.
    totalRuns: days.filter((d) => d.outcome === "succeeded").length,
    destination: "Google Drive",
    // A free Google account, mostly full of things that are not backups — which
    // is the realistic case, and the one the warning colours exist for. The
    // backups themselves are the 53 MB above.
    destinationUsedBytes: 9_800_000_000,
    destinationTotalBytes: 15_000_000_000,
    days,
    runs,
  }
}
