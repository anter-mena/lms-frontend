/**
 * The calendar chart's measurements, in a file both sides can import.
 *
 * <p>These two live here rather than beside the square that uses them, because
 * that component is `"use client"` — and <b>everything</b> exported from a client
 * module is a client reference, including a plain string. The server component
 * drawing the axis and the month row imported them, received references rather
 * than text, and `cn()` silently dropped both: the squares kept their size and
 * spacing (set inside the client file, where the constants are real) while the
 * grid around them lost its gaps entirely and the month cells collapsed to zero
 * width, stacking twelve labels on top of each other at the left edge.
 *
 * <p>Nothing threw. That is the part worth remembering — a client reference is a
 * valid object, so it survives every check up to the moment CSS is asked for a
 * class name that is not there. Same reason `lib/countdown.ts` was split out of
 * the ticking clock, and `lib/actionState.ts` out of the server actions.
 */

/**
 * GitHub's contribution square, to the pixel: ten across, three of gap, two of
 * corner.
 *
 * <p>Nine and eleven were both tried. Ten is GitHub's own, and those proportions
 * are the most-looked-at calendar heatmap there is — the size at which a year of
 * squares reads as texture at a glance rather than as a spreadsheet.
 *
 * <p><b>Half a pixel wider once the radar is up.</b> The radar only appears on a
 * screen with room going spare, and on that screen the calendar can afford to
 * spend some of it — 10.5px takes the year from 686 across to 712. It is tied to
 * the same 1740px breakpoint as the radar rather than a nearer one, because the
 * two are the same decision: below it the space is not there to spend, and above
 * it both changes are affordable together.
 *
 * <p>⚠️ <b>These numbers are load-bearing.</b> The calendar is 53 columns wide,
 * so every pixel here costs 53 across the year, and the width at which the radar
 * fits beside it is worked out from that. Change either size and the breakpoints
 * in `backupYear.tsx` have to be recomputed — 10.5px is what moved the first one
 * from 1720 to 1740, because at 1720 it overflowed by eight pixels.
 *
 * <p>The three-pixel gap is left alone. Scaling both together would keep the
 * ratio and lose the thing that ratio is for: at this size the gap is what stops
 * a run of good nights reading as one long bar.
 *
 * <p>Copied rather than guessed. Those proportions are the most-looked-at
 * calendar heatmap there is, and they are what makes a year of squares read as
 * texture at a glance instead of as a spreadsheet.
 *
 * <p><b>Fixed, not flexible.</b> The squares used to stretch to fill the panel,
 * which kept the chart flush with both edges and made the same year a different
 * shape on every screen. A calendar has a natural size; this is it. The room
 * left over on a wide screen is where the radar goes.
 */
export const CELL = "size-[10px] shrink-0 min-[1740px]:size-[10.5px]"

/** Between squares, both directions. GitHub's `border-spacing`. */
export const GAP = "gap-[3px]"
