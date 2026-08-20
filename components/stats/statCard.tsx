import { ArrowBigDownDash, ArrowBigUpDash } from "lucide-react"

import { Hint } from "@/components/ui/hint"
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

/**
 * A share of something with a ceiling, drawn under the figure.
 *
 * <p>For quantities that can be full — disk, a quota — where the number alone
 * does not say how close to the edge it is. A count of orders has no bar to
 * draw, which is why this is optional rather than derived.
 */
type Bar = {
  /** 0–100. Clamped when drawn, so a bad figure cannot escape the track. */
  percent: number
  /** The colour to draw it in — the caller owns the thresholds. */
  tone: string
}

/**
 * <b>Everything below the first five props is optional and off by default.</b>
 * A card given none of them renders exactly as it did before they existed.
 *
 * <p>They exist because the Backups screen needed a card to carry seven things
 * where this carried five: an icon, an explanation, a colour that means
 * something, a progress bar, and a control. Rather than a second card that
 * looks the same and drifts, each became a slot here — so there is still one
 * card in this application, and the page that needs less simply asks for less.
 */

function StatCard({
  label,
  value,
  unit,
  change,
  sparkline,
  className,
  hint,
  icon: Icon,
  tone,
  action,
  bar,
  detail,
  footer,
  footerIcon: FooterIcon,
}: {
  label: string
  value: React.ReactNode
  /** Sits after the figure in small grey type — "accounts", "orders". */
  unit?: string
  change?: Change
  sparkline?: number[]
  className?: string
  /** What this figure measures and how, behind an ⓘ beside the label. */
  hint?: React.ReactNode
  /** Drawn to the left of the figure, and coloured with it. */
  icon?: React.ComponentType<{ className?: string }>
  /**
   * A colour class for the figure and its icon — `text-destructive` and the
   * rest. Left off for the ordinary case, where a number is just a number.
   */
  tone?: string
  /**
   * A control at the right-hand end of the label row.
   *
   * <p>Beside the heading rather than beside the figure. The figure is the thing
   * being read and wants the whole line to itself — a control level with it
   * competes with the one element on the card nobody should have to look twice
   * at. Up on the label it reads as belonging to the card as a whole, which is
   * what a control on a card usually is.
   */
  action?: React.ReactNode
  bar?: Bar
  /**
   * The precise reading behind the headline, inside the panel under the figure.
   *
   * <p>Where the bar goes on a card that has one, and for the same reason: a
   * rounded figure is what you glance at, and this is what you look at when the
   * glance was not enough. "06:47:26" says how long; "20 Aug 2026, 03:00 UTC"
   * says when, which is the thing you can act on.
   */
  detail?: React.ReactNode
  /**
   * Plain context in the shell below the panel — "Every day at 03:00 UTC".
   *
   * <p>The same strip {@link Change} uses, because it is the same kind of thing:
   * what the figure above means, rather than the figure itself. A card passing
   * both draws the change, which is the more specific of the two.
   *
   * <p>Reserved for the <em>standing</em> fact — the schedule, the threshold,
   * the running total. What changes tonight belongs in {@link detail}.
   */
  footer?: React.ReactNode
  /**
   * Drawn in a disc at the left of the footer, opposite the text.
   *
   * <p>The shape {@link Change} already had: a mark at one edge, words at the
   * other. Pinning each to its own end stops them competing for the middle and
   * lines the discs up down a column of cards.
   */
  footerIcon?: React.ComponentType<{ className?: string }>
}) {
  const rising = (change?.percent ?? 0) >= 0
  const Arrow = rising ? ArrowBigUpDash : ArrowBigDownDash

  return (
    <div
      // Barely there. The tinted surface is a hairline frame around the panel,
      // not a gutter between two separate cards — anything wider and the two
      // read as siblings rather than one nested in the other.
      // rounded-lg, down from rounded-2xl. The softer corner read as a tile
      // floating over the page; these sit in a column beside a table and belong
      // to the same instrument panel. Still a step rounder than the table's own
      // cards, so the two surfaces stay distinguishable rather than merging.
      className={cn("flex flex-col rounded-lg border bg-muted/40 p-0.5", className)}
    >
      {/* grow, not flex-1. Both fill a card that has been stretched — by a grid
          row telling it to, as the Backups column does — but flex-1 also sets
          the basis to zero, and in a card left at its natural height that
          collapses the panel to nothing. grow only ever adds. */}
      {/* px-3 py-2.5, down from px-4 py-3.5. Four of these stacked in one column
          pay every vertical measurement four times, and the eight pixels a card
          gives up here are the difference between the set fitting on a laptop
          screen and the column needing a scrollbar of its own. */}
      <div className="flex grow flex-col rounded-md border bg-card px-3 py-2.5 shadow-sm">
        {/* Mono for both the label and the figure. It is what gives this row its
            instrument-panel feel: every digit occupies the same width, so the
            numbers hold their shape and the letter-spaced caps read as a readout
            rather than a sentence. */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <p className="truncate font-mono text-[0.7rem] font-medium tracking-wider text-muted-foreground uppercase">
              {label}
            </p>
            {hint ? <Hint>{hint}</Hint> : null}
          </div>

          {action}
        </div>

        {/* Pinned to the foot of the panel, with the heading left at the top.
            `mt-auto` eats whatever height the card was stretched to, so the
            figure sits on the same line across a column of cards however much
            each one has to say. On a card at its natural height it collects no
            space and this reads exactly as it did before — `pt-1` is what keeps
            a gap under the label in that case, since `mt-auto` would be zero. */}
        <div className="mt-auto pt-1">
          <div className="flex items-end justify-between gap-3">
            {/* items-center, not items-baseline. Sitting the unit on the
                figure's baseline drops it to the very bottom of a 20px number,
                where it reads as a footnote that slipped. Centred, it reads as
                part of the same phrase. */}
            <p className="flex min-w-0 items-center gap-1.5">
              {Icon ? (
                <Icon
                  className={cn("size-4 shrink-0", tone ?? "text-muted-foreground")}
                  aria-hidden
                />
              ) : null}
              {/* tabular-nums is belt and braces next to font-mono — it also
                  keeps the comma and currency glyphs on the same rhythm. */}
              <span
                className={cn(
                  "font-mono text-xl font-semibold tracking-tight tabular-nums",
                  tone
                )}
              >
                {value}
              </span>
              {unit ? (
                <span className="text-xs text-muted-foreground">{unit}</span>
              ) : null}
            </p>

            {sparkline ? <Sparkline values={sparkline} /> : null}
          </div>

          {/* Under the figure rather than beside it: a bar is the same quantity
              drawn a second way, so it belongs directly below what it repeats. */}
          {bar ? (
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full", bar.tone)}
                // Floored at 1% so a nearly-empty quota still shows a mark. A
                // track with nothing in it reads as a bar that failed to load.
                style={{ width: `${Math.min(Math.max(bar.percent, 1), 100)}%` }}
              />
            </div>
          ) : null}

          {/* Same slot as the bar, and that is the point: a card with neither
              left a hole under its figure that the cards beside it filled. */}
          {detail ? (
            <p className="mt-1.5 text-[0.7rem] text-muted-foreground">{detail}</p>
          ) : null}
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
      ) : footer ? (
        // The same two ends as the change row above — a mark at one edge, the
        // words at the other — so a column of cards lines up whether or not the
        // figures happen to have movement to report.
        <div
          className={cn(
            "flex items-center gap-2 px-2 py-1 text-xs",
            FooterIcon ? "justify-between" : "justify-end"
          )}
        >
          {FooterIcon ? (
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-foreground/10">
              {/* fill AND stroke, the same treatment the arrow above gets. On
                  stroke alone a line icon reads as a faint scratch on the disc;
                  filled, it is a solid shape punched clean out of it.

                  The colour is the sidebar's own surface, which is what makes it
                  a hole rather than a mark — and it survives the theme, because
                  that token flips with it: near-white on a light disc, near-black
                  on a dark one. */}
              <FooterIcon className="size-3.5 fill-sidebar text-sidebar" aria-hidden />
            </span>
          ) : null}

          {/* No truncate. The change row is two short fragments and a long one
              would mean something had gone wrong; this is a written phrase, and
              clipping "9.8 GB of 15 GB used" to "9.8 GB of 15 G…" loses the half
              that carries the meaning. It wraps instead, and the card grows. */}
          <p className="text-right text-muted-foreground">{footer}</p>
        </div>
      ) : null}
    </div>
  )
}

export { StatCard, Sparkline, type Change, type Bar }
