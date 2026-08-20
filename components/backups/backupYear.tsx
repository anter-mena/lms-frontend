import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { OutcomeRadar } from "@/components/backups/outcomeRadar"
import { Panel } from "@/components/system/panel"
import { WeekStick, type WeekBar } from "@/components/backups/weekStick"
import type { BackupDay, BackupQuery, BackupStatus } from "@/lib/backupTypes"
import { CELL, GAP } from "@/lib/backupChart"
import { THIN_SCROLLBAR } from "@/lib/scrollbar"
import { cn } from "@/lib/utils"

/**
 * A year of backups as a calendar of nights, against the year before it.
 *
 * <p><b>One square is one night, and where it sits is which night it was</b> — a
 * column is a week, a row is a weekday. That makes this a calendar rather than a
 * bar chart, and the difference is not cosmetic: in a bar chart a square's
 * position means "how many", so the squares have to be sorted by outcome and
 * none of them can say which night it is. Here position is the date, which is
 * what lets every square answer for itself when you point at it.
 *
 * <p><b>Columns are real weeks, Sunday to Saturday.</b> Blocks of seven days
 * from 1 January were simpler and made the row labels a lie — the same row would
 * be Thursday one year and Wednesday the next. Aligning to the calendar costs a
 * partial column at each end, drawn as blanks, and pays for itself twice: the
 * weekday labels are true, and the last days of the year are drawn rather than
 * dropped, which the fixed-blocks version could not manage without a final
 * column taller than its neighbours.
 *
 * <p><b>No dependencies and nothing measured in the browser.</b> Three hundred
 * and seventy-odd squares, rendered on the server. A ready-made heatmap library
 * was tried here once: it worked, and it cost fifty-seven files and six runtime
 * dependencies for one panel. This is the whole chart.
 */

const NIGHTS = 7

/**
 * Seven rows, three labels, <b>Sunday first</b>.
 *
 * <p>The week starts on Sunday here because that is where it starts for whoever
 * reads this. It is not a detail the chart can shrug at: the row a square lands
 * on <em>is</em> its weekday, so getting the first row wrong mislabels all three
 * hundred and sixty-five of them by a day.
 *
 * <p>Only every other day is named, which is what GitHub does with the same
 * chart. At ten pixels a row, seven labels stack into a solid block of text
 * taller than it is readable; three are enough to count from, because the rows
 * in between are obviously the days in between.
 *
 * <p>The blanks are still rendered. Dropping them would leave four rows of
 * squares with nothing holding their height, and the axis would drift out of
 * step with the grid it is labelling.
 */
const WEEKDAYS = ["", "Mon", "", "Wed", "", "Fri", ""]

/** 1 for 1 January. Parsed as UTC, like every other date on this screen. */
function dayOfYear(date: string): number {
  const at = new Date(`${date}T00:00:00Z`)
  const start = Date.UTC(at.getUTCFullYear(), 0, 1)
  return Math.floor((at.getTime() - start) / 86_400_000) + 1
}

/**
 * Where the year sits on the grid.
 *
 * <p>`offset` is how many blank squares stand in front of 1 January — none when
 * it falls on a Monday, six when it falls on a Sunday. Everything else here is
 * arithmetic on top of it, which is why it is worked out once and passed around
 * rather than recomputed.
 */
function gridFor(year: number) {
  const jan1 = new Date(Date.UTC(year, 0, 1))
  const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
  const days = leap ? 366 : 365

  // getUTCDay already numbers Sunday 0, which is the week this chart draws, so
  // it is taken as it comes. It used to be rotated by six to lead with Monday.
  const offset = jan1.getUTCDay()

  return { offset, days, columns: Math.ceil((offset + days) / NIGHTS) }
}

/**
 * One character a night.
 *
 * <p>S backed up, F failed, M nothing ran, `.` in the year but no record, `_`
 * outside the year altogether — the blanks at the two ends of the grid.
 *
 * <p>A string rather than an array of outcome words, because this crosses to the
 * browser once per column. See {@link WeekBar}.
 */
const MARK: Record<string, string> = {
  succeeded: "S",
  failed: "F",
  missed: "M",
}

type Week = {
  /** Seven characters, Sunday first. */
  nights: string
  /** Whether the record reaches this far. False for a week not yet lived. */
  recorded: boolean
}

/**
 * Blanks out everything after a given night.
 *
 * <p>Used on the year being compared against, never on the year being shown. In
 * the week we are currently living through, the nights still to come have no
 * record — and the year before has a full set. Left alone, those draw as pale
 * squares, which is the chart saying "last year managed these and this year did
 * not" about nights that have not happened yet.
 *
 * <p>The column-level cut-off does not reach this: the current week <em>is</em>
 * recorded, so it survives that filter and only the days inside it are wrong.
 */
function maskAfter(nights: string, slot: number): string {
  return nights
    .split("")
    .map((mark, at) => (at <= slot ? mark : "."))
    .join("")
}

function weeksFor(days: BackupDay[], year: number): Week[] {
  const { offset, days: total, columns } = gridFor(year)

  // "_" everywhere to begin with, then every day of the year claims its own
  // square. What is left as "_" is exactly the two partial weeks at the ends.
  const slots: string[][] = Array.from({ length: columns }, () =>
    Array.from({ length: NIGHTS }, () => "_")
  )
  const recorded = Array.from({ length: columns }, () => false)

  for (let day = 1; day <= total; day += 1) {
    const at = day - 1 + offset
    slots[Math.floor(at / NIGHTS)][at % NIGHTS] = "."
  }

  for (const day of days) {
    if (Number(day.date.slice(0, 4)) !== year) continue

    const at = dayOfYear(day.date) - 1 + offset
    const column = Math.floor(at / NIGHTS)

    // Set even for a day with no outcome. This marks how far the record runs,
    // which is a different question from whether anything was backed up — and
    // it is the one that decides where the comparison stops.
    recorded[column] = true

    if (day.outcome) slots[column][at % NIGHTS] = MARK[day.outcome] ?? "."
  }

  return slots.map((nights, column) => ({
    nights: nights.join(""),
    recorded: recorded[column],
  }))
}

/**
 * "Jan", on the first column of each month.
 *
 * <p>Positioned to overflow its column. A month label is three characters and a
 * column is a dozen pixels; the three after it are always blank, so letting it
 * spill is free and beats a row of single letters where three of them are J.
 */
function monthAt(
  column: number,
  year: number,
  offset: number,
  days: number
): string | null {
  const firstOfColumn = column * NIGHTS - offset
  if (firstOfColumn >= days) return null

  const at = new Date(Date.UTC(year, 0, 1 + Math.max(0, firstOfColumn)))

  if (column > 0) {
    const before = new Date(
      Date.UTC(year, 0, 1 + Math.max(0, (column - 1) * NIGHTS - offset))
    )
    if (before.getUTCMonth() === at.getUTCMonth()) return null
  }

  return at.toLocaleString("en-GB", { month: "short", timeZone: "UTC" })
}

/** Keeps whatever else is in the address bar — the log's sort and page size. */
function hrefFor(query: BackupQuery, year: number): string {
  const params = new URLSearchParams()
  if (query.sort) params.set("sort", query.sort)
  if (query.size) params.set("size", query.size)
  params.set("year", String(year))

  return `?${params.toString()}`
}

const STEP =
  "flex size-5 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"

/**
 * One year at a time, with the ends made obvious.
 *
 * <p>A year with nothing before it renders the arrow greyed rather than hiding
 * it. A control that disappears at the end of a range moves the other one, and
 * the click that was going to land on it lands on something else.
 */
function YearNav({
  years,
  selected,
  query,
}: {
  years: number[]
  selected: number
  query: BackupQuery
}) {
  const at = years.indexOf(selected)
  const earlier = years[at - 1]
  const later = years[at + 1]

  return (
    <span className="flex items-center gap-0.5">
      {earlier === undefined ? (
        <span className={cn(STEP, "pointer-events-none opacity-30")} aria-hidden>
          <ChevronLeft className="size-3.5" />
        </span>
      ) : (
        <Link
          href={hrefFor(query, earlier)}
          scroll={false}
          aria-label={`Show ${earlier}`}
          className={STEP}
        >
          <ChevronLeft className="size-3.5" />
        </Link>
      )}

      <span className="min-w-10 text-center font-mono text-[0.7rem] font-medium tabular-nums">
        {selected}
      </span>

      {later === undefined ? (
        <span className={cn(STEP, "pointer-events-none opacity-30")} aria-hidden>
          <ChevronRight className="size-3.5" />
        </span>
      ) : (
        <Link
          href={hrefFor(query, later)}
          scroll={false}
          aria-label={`Show ${later}`}
          className={STEP}
        >
          <ChevronRight className="size-3.5" />
        </Link>
      )}
    </span>
  )
}

/**
 * What the four colours mean — and only that.
 *
 * <p>Fixed wording, not the years. It used to read "2026 · Failed · 2025", which
 * put two dates and an outcome in one row and quietly asked the reader to work
 * out that the first one meant "backed up". A key explains what a colour
 * <em>means</em>; which year is on screen is the year control's job, and it is
 * already saying so a few inches to the left.
 *
 * <p>Four entries rather than three, too. The faint square — by far the most
 * common one after black — was never in the key at all, so the one colour that
 * says "nothing happened here" was the one nobody could look up.
 */
const KEYS = [
  { tone: "bg-foreground", label: "Backed up" },
  { tone: "bg-destructive", label: "Failed" },
  { tone: "bg-foreground/[0.07]", label: "Nothing ran" },
]

function Key({ tone, label }: { tone: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      {/* A square, the same one the chart draws. A key in a different shape from
          the thing it explains is a key you have to translate. */}
      <span className={cn("size-2 rounded-[2px] ring-1 ring-border", tone)} aria-hidden />
      {label}
    </span>
  )
}

function BackupYear({
  status,
  query,
}: {
  status: BackupStatus
  /** What the address bar says. The year lives there, like the log's sort. */
  query: BackupQuery
}) {
  const years = [...new Set(status.days.map((day) => Number(day.date.slice(0, 4))))].sort(
    (a, b) => a - b
  )

  // The most recent year unless asked otherwise, and an unknown year in the URL
  // falls back to it rather than drawing an empty chart. Someone editing the
  // address bar by hand is the least of it — a stale link from a year that has
  // since dropped out of the window would do the same.
  const asked = Number(query.year)
  const selected = years.includes(asked) ? asked : (years.at(-1) ?? 0)

  const { offset, days: daysInYear } = gridFor(selected)
  const weeks = weeksFor(status.days, selected)
  const previousYear = years.includes(selected - 1) ? selected - 1 : null
  const previous = previousYear ? weeksFor(status.days, previousYear) : null

  /**
   * The last night anything is known about, as a square on the grid.
   *
   * <p>Taken from the days themselves rather than from the clock. The chart is
   * rendered on the server and read in a browser some milliseconds later, and a
   * component that decides what "now" means twice gets two answers.
   */
  const lastNight = status.days.reduce((latest, day) => {
    if (Number(day.date.slice(0, 4)) !== selected) return latest
    return Math.max(latest, dayOfYear(day.date) - 1 + offset)
  }, -1)

  /**
   * How far into the year the record reaches.
   *
   * <p>The comparison is cut off here too. Without it, looking at a year still
   * in progress draws pale squares across the months that have not happened yet
   * — which reads as a catastrophic collapse rather than as a calendar. Like
   * against like: the same weeks of each year, or nothing.
   */
  const lastRecorded = weeks.reduce(
    (last, week, index) => (week.recorded ? index : last),
    -1
  )

  const counts = status.days.reduce(
    (all, day) => {
      if (Number(day.date.slice(0, 4)) === selected && day.outcome) all[day.outcome] += 1
      return all
    },
    { succeeded: 0, failed: 0, missed: 0, running: 0 }
  )

  const bars: WeekBar[] = weeks.map((week, index) => {
    const before = previous?.[index]
    const comparable = Boolean(before) && index <= lastRecorded

    // The comparison stops at the last night on record, not at the end of the
    // week containing it. Only the final column needs trimming; every earlier
    // one is complete, and every later one was already dropped by `comparable`.
    const previousNights =
      comparable && before
        ? index === Math.floor(lastNight / NIGHTS)
          ? maskAfter(before.nights, lastNight % NIGHTS)
          : before.nights
        : ""

    return {
      year: selected,
      week: index,
      offset,
      nights: week.nights,
      previous: previousNights,
      previousYear: comparable ? previousYear : null,
    }
  })

  return (
    <Panel
      title="The year"
      hint={
        <>
          One square a night: a column is a week, a row is a weekday. Filled means
          it ran, red means it broke, faint means nothing ran. A pale square is a
          night the year before managed and this one did not. Hover any of them.
        </>
      }
      action={
        <span className="flex items-center gap-3">
          <span className="font-mono text-[0.7rem] text-muted-foreground tabular-nums">
            {counts.succeeded} good · {counts.failed} failed · {counts.missed} missed
          </span>
          <YearNav years={years} selected={selected} query={query} />
        </span>
      }
      className="shrink-0"
      bodyClassName="gap-0 p-3"
    >
      {/* The calendar, then — if the screen has the room — the radar beside it.

          The breakpoints are arbitrary values rather than Tailwind's own, and
          deliberately: they are worked out from the width of the calendar and the
          20rem the summary cards take, not chosen from a list. `2xl` would have
          introduced the radar into a gap it does not fit. */}
      <div className="flex items-center gap-4">
        {/* Fixed-size squares can outgrow their column; this lets the calendar
            scroll sideways rather than be squashed or overflow the card, which is
            what GitHub does with the same chart on a narrow screen.

            ⚠️ <b>This grows, and the radar beside it does not.</b> Both had
            `flex-1` once: two items at `flex: 1 1 0%` split the row in half
            whatever either needed, so the radar took three hundred pixels it had
            no use for and the calendar was pushed into a scrollbar with the space
            sitting right next to it. The radar is a fixed width now, this takes
            everything else, and the year is centred in it.

            py-1.5 is not padding for looks. Setting overflow on one axis makes
            the other one clip too — that is the CSS rule, not a quirk — so
            without a little room above and below, a square on the Monday row had
            its top shaved off the moment it grew under the pointer. */}
        <div className={cn("min-w-0 flex-1 overflow-x-auto py-1.5", THIN_SCROLLBAR)}>
          {/* Two columns: the weekday axis, then everything that lines up against
              it. A grid rather than nested flexes so the axis and the squares
              share one row height.

              `mx-auto` at every width. Alone, the year sits in the middle of the
              card; beside the radar, in the middle of the space left over. Either
              way it is centred in whatever it has been given rather than pinned
              to one edge with the slack piled up on the other.

              Auto margins collapse to nothing when the content is wider than the
              box, so this cannot push January out of reach on a small screen. */}
          <div className="mx-auto grid w-fit grid-cols-[auto_minmax(0,1fr)] gap-x-1.5">
        {/* flex-1 rows divide whatever height the squares turn out to need, so
            the labels stay level with them at any width. */}
        <div
          className={cn(
            "flex flex-col font-mono text-[0.6rem] tracking-wider text-muted-foreground uppercase",
            GAP
          )}
        >
          {WEEKDAYS.map((day, row) => (
            <span key={row} className="flex flex-1 items-center leading-none">
              {day}
            </span>
          ))}
        </div>

        {/* role="img" with the year in a sentence, because the squares are not
            reachable by keyboard — a tab stop per night in front of the log would
            be an obstacle course to reach figures the log already lists. */}
        <div
          role="img"
          aria-label={`${selected}: ${counts.succeeded} backups made, ${counts.failed} failed, ${counts.missed} nights nothing ran.`}
          className={cn("flex", GAP)}
        >
          {bars.map((bar, index) => (
            <WeekStick key={index} week={bar} />
          ))}
        </div>

        <div />

        <div className={cn("mt-2 flex border-t pt-1.5", GAP)}>
          {bars.map((_, index) => {
            const month = monthAt(index, selected, offset, daysInYear)

            return (
              <div key={index} className={cn("relative h-3", CELL)}>
                {month && (
                  <span className="absolute left-0 font-mono text-[0.6rem] tracking-wider text-muted-foreground uppercase">
                    {month}
                  </span>
                )}
              </div>
            )
          })}
        </div>

        <div />

        <div className="mt-2 flex items-center justify-end gap-3 font-mono text-[0.6rem] tracking-wider text-muted-foreground uppercase">
          {/* Three keys, not four. The pale comparison square used to have one,
              and it is the only colour here that needs a sentence rather than a
              name — "a night the year before managed and this one did not" does
              not fit beside three two-word labels. It is explained in the ⓘ at
              the top of the panel instead, where there is room to say it. */}
          {KEYS.map((key) => (
            <Key key={key.label} tone={key.tone} label={key.label} />
          ))}
          </div>
          </div>
        </div>

        {/* The separator and the radar are one element: a border rather than a
            rule of its own, so there is nothing left behind on a narrower screen
            when the chart beside it is not drawn.

            A fixed width, and it is the calendar that grows. That order matters:
            the calendar has exactly one correct size — 53 weeks of ten-pixel
            squares — and anything that squeezes it below that costs a scrollbar,
            while the radar is legible at any size and simply gets smaller. So the
            radar states what it needs and the year takes the rest.

            Two widths, both chosen against a breakpoint rather than by eye, and
            both derived from the square size rather than picked.

            The squares grow to 10.5px at this same breakpoint, so the figure to
            budget against is the larger calendar: 712 wide, 741 with its axis.
            The radar needs 280 to be worth drawing and the separator takes 17, so
            the card has to hold 1038 before this can appear — a window of about
            1729. 1740 gives that a little air. The second step needs 1138, or a
            window near 1829, so 1900 clears it comfortably.

            ⚠️ Change `CELL` and these two numbers have to be recomputed. Leave
            them and a wider square silently pushes the calendar into a scrollbar
            at the very width the radar arrives. */}
        <div className="hidden w-[280px] shrink-0 items-center justify-center border-l pl-4 min-[1740px]:flex min-[1900px]:w-[380px]">
          <OutcomeRadar counts={counts} />
        </div>
      </div>
    </Panel>
  )
}

export { BackupYear }
