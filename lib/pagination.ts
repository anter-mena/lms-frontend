/**
 * Which page buttons to draw.
 *
 * <p>Shared rather than copied. It lives here because two tables now draw the
 * same control — the user list and the backup log — and "the same UI" is a claim
 * that only stays true if there is one implementation of it. A second copy would
 * be identical on the day it was written and quietly different a year later.
 */

/**
 * Up to this many pages, every one is drawn.
 *
 * <p>Five, not eight. The old threshold was set so that nothing was ever hidden
 * unless hiding it actually saved room — true of the arithmetic, wrong on the
 * screen: a row of seven numbers reads as a list to work through rather than as
 * a position in one, and by the time you have counted them you could have
 * clicked the arrow twice.
 *
 * <p>Five is where the row still reads at a glance. Below it there is nothing to
 * collapse anyway — {1 … 4} skips nothing, so an ellipsis would be a character
 * standing in for no pages at all.
 */
const SHOW_ALL_UP_TO = 5

/**
 * Always the first and last page, always the current one and its neighbours,
 * with a gap standing in for whatever is skipped.
 *
 * <p>First and last stay pinned deliberately. A sliding window of five is
 * tidier and never changes width, and it leaves no way to reach the end of a
 * forty-page log except by walking there.
 */
export function pageNumbers(current: number, total: number): (number | "gap")[] {
  if (total <= SHOW_ALL_UP_TO) return Array.from({ length: total }, (_, i) => i + 1)

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
