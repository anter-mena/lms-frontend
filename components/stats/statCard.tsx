import { ArrowBigDownDash, ArrowBigUpDash } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * A headline number, in a card sitting inside another card.
 *
 * <p>The nesting is the whole shape: a tinted outer shell carries the change
 * over time, and a white inner panel carrying the figure floats on top of it.
 * The number looks lifted off the page while its context stays pressed into the
 * background — which is the point, since the number is what anyone glancing at
 * this row came for.
 *
 * <p>Two elements rather than one card with a divider, because the outer surface
 * has to be visible around the inner one on three sides. A border cannot do that.
 */

/**
 * The little bar chart beside the figure.
 *
 * <p>Values are normalised against the largest, so any scale of input fills the
 * height. Decorative — it carries a shape, not a readable quantity, so it is
 * hidden from screen readers rather than described.
 */
function Sparkline({ values, className }: { values: number[]; className?: string }) {
  const peak = Math.max(...values, 1)

  return (
    <div aria-hidden className={cn("flex h-8 items-end gap-[3px]", className)}>
      {values.map((value, i) => (
        <span
          key={i}
          className="w-[3px] rounded-[1px] bg-foreground"
          // Floored at 12% so a zero still reads as a bar rather than a gap in
          // the row, which would look like a rendering fault.
          style={{ height: `${Math.max(12, (value / peak) * 100)}%` }}
        />
      ))}
    </div>
  )
}

/** How the figure moved, and over what stretch of time. */
type Change = {
  /** Positive rises, negative falls. The sign drives both arrow and colour. */
  percent: number
  /** The window it moved over — "in the last 28 days". */
  period: string
}

function StatCard({
  label,
  value,
  unit,
  change,
  sparkline,
  className,
}: {
  label: string
  value: string
  /** Sits after the figure in small grey type — "accounts", "orders". */
  unit?: string
  change?: Change
  sparkline?: number[]
  className?: string
}) {
  const rising = (change?.percent ?? 0) >= 0
  const Arrow = rising ? ArrowBigUpDash : ArrowBigDownDash

  return (
    <div
      // Barely there. The tinted surface is a hairline frame around the panel,
      // not a gutter between two separate cards — anything wider and the two
      // read as siblings rather than one nested in the other.
      className={cn("flex flex-col rounded-2xl border bg-muted/40 p-0.5", className)}
    >
      <div className="rounded-xl border bg-card px-4 py-3.5 shadow-sm">
        {/* Mono for both the label and the figure. It is what gives this row its
            instrument-panel feel: every digit occupies the same width, so the
            numbers hold their shape and the letter-spaced caps read as a readout
            rather than a sentence. */}
        <p className="font-mono text-[0.7rem] font-medium tracking-wider text-muted-foreground uppercase">
          {label}
        </p>

        <div className="mt-2 flex items-end justify-between gap-3">
          {/* items-center, not items-baseline. Sitting the unit on the figure's
              baseline drops it to the very bottom of a 24px number, where it
              reads as a footnote that slipped. Centred, it reads as part of the
              same phrase. */}
          <p className="flex items-center gap-1.5">
            {/* tabular-nums is belt and braces next to font-mono — it also keeps
                the comma and currency glyphs on the same rhythm. */}
            <span className="font-mono text-2xl font-semibold tracking-tight tabular-nums">
              {value}
            </span>
            {unit ? (
              <span className="text-xs text-muted-foreground">{unit}</span>
            ) : null}
          </p>

          {sparkline ? <Sparkline values={sparkline} /> : null}
        </div>
      </div>

      {/* In the outer shell, below the panel — the reason for the nesting.
          Pushed to opposite ends: the arrow is a glanceable mark and the numbers
          are read, so pinning each to its own edge stops them competing for the
          same spot and lines the arrows up down a column of cards. */}
      {change ? (
        <div className="flex items-center justify-between gap-2 px-2 py-1.5 text-xs">
          {/* The disc is a shade darker than the shell it sits on, which is what
              separates it — a ring would add a third border to a card that
              already has two. */}
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-foreground/10">
            {/* fill-muted, matching the shell this disc sits on, so the arrow
                reads as punched out of the disc rather than drawn on top of it.
                The stroke keeps the direction colour, which is what stops the
                shape being purely decorative.

                fill-* is needed at all because lucide ships these with
                fill="none"; a CSS rule outranks an SVG presentation attribute,
                so no prop has to be threaded through. */}
            {/* Stroke and fill are the same colour, so no outline is left
                around the shape — it is a hole in the disc rather than an icon
                sitting in one. Colour is carried by the figure on the right
                instead; the direction is already in which way the arrow points,
                and saying it twice made the disc compete with the number. */}
            <Arrow className="size-3 fill-background text-background" aria-hidden />
            <span className="sr-only">{rising ? "Up" : "Down"}</span>
          </span>

          <p className="flex items-baseline gap-1 truncate">
            <span
              className={cn(
                "font-mono font-medium tabular-nums",
                rising ? "text-success" : "text-destructive"
              )}
            >
              {/* Negatives carry their own minus; positives need the plus
                  adding, or a rise reads as a bare quantity rather than a
                  movement. */}
              {rising ? "+" : ""}
              {change.percent}%
            </span>
            <span className="truncate text-muted-foreground">
              {change.period}
            </span>
          </p>
        </div>
      ) : null}
    </div>
  )
}

export { StatCard, Sparkline, type Change }
