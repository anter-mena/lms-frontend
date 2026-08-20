"use client"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { CELL, GAP } from "@/lib/backupChart"
import { cn } from "@/lib/utils"

/**
 * One week of the year chart, as seven nights.
 *
 * <p><b>Outcomes travel as one character each</b>, not as words. Fifty-two weeks
 * of fourteen `"succeeded"` strings is seven hundred repetitions of the same
 * nine letters in the payload every visitor downloads; `"SSSFSSS"` is seven
 * bytes. The dates are not sent at all — they are the year, the week and the
 * slot, which the square works out for itself.
 */
export type WeekBar = {
  year: number
  /** 0-based index of this week within the year. */
  week: number
  /** Blank squares standing in front of 1 January. See `gridFor`. */
  offset: number
  /** Seven characters, Monday first. See {@link NIGHT}. */
  nights: string
  /** The same seven a year earlier, or "" when there is nothing to compare with. */
  previous: string
  previousYear: number | null
}

/**
 * What one character means, and what it looks like.
 *
 * <p>The squares are in the order the nights happened — Monday's square is
 * Monday's. Sorting them by outcome would draw tidier columns and would mean
 * a square could no longer say which night it was, which is the entire point of
 * being able to hover one.
 */
const NIGHT = {
  S: { tone: "bg-foreground", said: "Backed up" },
  F: { tone: "bg-destructive", said: "The run failed" },
  M: { tone: "bg-foreground/[0.07]", said: "Nothing ran" },
  /** No record: before backups existed, or a night that has not happened yet. */
  ".": { tone: "bg-foreground/[0.07]", said: "No backup recorded" },
  /**
   * Not a night at all — a blank at one end of the grid.
   *
   * <p>The price of columns being real Monday-to-Sunday weeks: the first and
   * last hold a few days belonging to the neighbouring year. Drawn as nothing
   * and given no tooltip, because there is no night there to describe.
   */
  _: { tone: "bg-transparent", said: "" },
} as const

type Mark = keyof typeof NIGHT

function markAt(encoded: string, slot: number): Mark {
  const mark = encoded[slot]
  return mark === "S" || mark === "F" || mark === "M" || mark === "_" ? mark : "."
}

/**
 * "Tue 4 Aug 2026".
 *
 * <p>Worked out here rather than sent, and fixed to UTC and `en-GB` so this
 * renders identically on the server and in the browser. A component that formats
 * dates by the reader's own settings produces markup the two disagree about.
 */
function nightLabel(week: WeekBar, slot: number): string {
  const at = new Date(
    Date.UTC(week.year, 0, 1 + week.week * 7 + slot - week.offset)
  )

  return at.toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  })
}

/**
 * A single night.
 *
 * <p><b>Pale means last year ran and this year did not</b> — the comparison,
 * night by night rather than count against count. It appears only where this
 * year has nothing to draw, so a healthy week hides it completely and a gap
 * fills with the shape of the year before. That asymmetry is deliberate: the
 * comparison takes up room only when it has something to say.
 *
 * <p>The square grows on hover rather than the whole column. `z-10` goes with it
 * — a flex item that scales is still painted in source order, so without it the
 * square above would sit on top of the one being pointed at.
 */
function NightSquare({ week, slot }: { week: WeekBar; slot: number }) {
  const mark = markAt(week.nights, slot)
  const before = week.previous ? markAt(week.previous, slot) : "."

  // Only where this year has nothing of its own. A night that ran is drawn as
  // what it was, whatever last year did.
  const ghost = (mark === "M" || mark === ".") && (before === "S" || before === "F")

  // A blank at the end of the grid holds no night, so it gets no tooltip and no
  // hover. It is here to keep the column seven tall and the rows straight.
  if (mark === "_") {
    return <span className={CELL} aria-hidden />
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            className={cn(
              CELL,
              "relative rounded-[2px] transition-transform duration-150 ease-out",
              "hover:z-10 hover:scale-[1.75]",
              ghost ? "bg-foreground/25" : NIGHT[mark].tone
            )}
          />
        }
      />

      {/* block, not the default inline-flex. Under flex layout every run of text
          becomes its own column — the same trap `Hint` documents. */}
      <TooltipContent className="block max-w-none text-left leading-snug">
        <p className="font-medium">{nightLabel(week, slot)}</p>

        <p className="mt-0.5 text-background/70">{NIGHT[mark].said}</p>

        {week.previousYear !== null && before !== "." && (
          <p className="mt-1 border-t border-background/20 pt-1 text-background/70">
            {week.previousYear}: {NIGHT[before].said.toLowerCase()}
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  )
}

/**
 * A week as a column of seven squares, one a night.
 *
 * <p><b>One square is one night.</b> That is the whole reason this beats the
 * solid bar it replaced: a bar at 71% height is a number to decode, and five
 * filled squares out of seven is something you can count without meaning to. It
 * also gives the missed nights somewhere to live — before, they showed only as a
 * bar being shorter than its neighbours, which needed a neighbour to compare
 * against.
 *
 * <p>The faint squares are drawn rather than left blank, which is what makes
 * every column the same height and the chart a grid. Seven faint squares say
 * "seven nights, none of them backed up"; seven of nothing says only that
 * something failed to render. The exception is a square outside the year
 * altogether, which is a gap in the calendar rather than a night with no news.
 *
 * <p>A band still lights the whole column on hover. The squares answer for
 * themselves now, but a dozen pixels is a small thing to find twice — the band
 * is what tells you which week your pointer is in while you move down it.
 *
 * <p>⚠️ <b>Not focusable, deliberately.</b> Three hundred and sixty-four tab
 * stops between the chart and the log would make this panel an obstacle course
 * for anybody navigating by keyboard, to reach figures the log below already
 * lists row by row. The chart carries a summary label for assistive technology
 * instead — see `backupYear.tsx`.
 */
function WeekStick({ week }: { week: WeekBar }) {
  return (
    <div className="group relative shrink-0">
      <span
        className="absolute inset-x-0 -inset-y-1 rounded-sm transition-colors group-hover:bg-muted"
        aria-hidden
      />

      {/* Top down, Monday first, the way a calendar is read. It used to run
          upwards, from a time when the column was a bar and the bottom was the
          floor a quantity grew from. Position is the date now, so the reading
          order is the calendar's. */}
      <span className={cn("relative flex flex-col", GAP)}>
        {Array.from({ length: 7 }, (_, slot) => (
          <NightSquare key={slot} week={week} slot={slot} />
        ))}
      </span>
    </div>
  )
}

export { WeekStick }
