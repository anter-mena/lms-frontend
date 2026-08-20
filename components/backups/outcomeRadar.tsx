import { cn } from "@/lib/utils"

/**
 * The year's three outcomes, as a radar.
 *
 * <p>Sits beside the calendar rather than under it, and only on a screen wide
 * enough to have room going spare. The calendar answers <em>when</em> it went
 * wrong; this answers <em>how often</em>, which is the same question the counts
 * above the chart answer in words — the point of drawing it is that a shape is
 * read in one glance and three numbers are read one at a time.
 *
 * <p>⚠️ <b>Expect a sliver, not a shape.</b> A radar has a recognisable outline
 * when its axes hold comparable quantities. A healthy year is 95% on one axis
 * and two or three percent on the others, so the polygon collapses towards a
 * single spike. That is not a fault to fix: GitHub's own contribution radar does
 * exactly this at 87/13, and a year that produced a plump, even triangle here
 * would be a year in serious trouble.
 *
 * <p><b>The web behind it is what makes that legible.</b> Without rings and
 * spokes a spike is a stray line on an empty card, with nothing to say how far
 * out it reaches. Against a grid it is a reading — full on one axis, nothing on
 * the others — which is exactly what it means.
 *
 * <p>Plain SVG, rendered on the server. A charting library for this would weigh
 * more than the rest of the page.
 */

/** Shares are of the nights on record, not of the year — see {@link OutcomeRadar}. */
type Counts = {
  succeeded: number
  failed: number
  missed: number
}

/**
 * Drawn at this size and scaled to whatever room it is given.
 *
 * <p>The `viewBox` is the design and the element fills the column it is given,
 * so the drawing scales as one piece — the labels can never collide with the
 * shape the way they would if the type stayed put while the web grew around it.
 *
 * <p>Sized to render close to one-to-one in the 280px the layout reserves. A
 * much larger `viewBox` would be drawn at two-thirds scale in the same space and
 * every label with it, which is how a chart ends up with type nobody can read.
 */
const BOX = { width: 300, height: 225, cx: 150, cy: 100, radius: 68 }

/** How far past the outer ring the labels sit. */
const LABEL_GAP = 18

/** The rings, as shares of the full radius. */
const RINGS = [0.25, 0.5, 0.75, 1]

/**
 * Clockwise from the top.
 *
 * <p>Backed up leads because it is the one that is nearly always the long arm,
 * and an outline that always points the same way is one you can read without
 * checking the labels — the shape becomes the reading, which is the only reason
 * to draw a radar rather than print the numbers.
 */
const AXES = [
  { key: "succeeded", label: "Backed up", angle: -90, tone: "fill-foreground" },
  { key: "failed", label: "Failed", angle: 30, tone: "fill-destructive" },
  { key: "missed", label: "Nothing ran", angle: 150, tone: "fill-muted-foreground" },
] as const

function pointAt(angle: number, distance: number) {
  const radians = (angle * Math.PI) / 180
  return {
    x: BOX.cx + Math.cos(radians) * distance,
    y: BOX.cy + Math.sin(radians) * distance,
  }
}

/** The polygon through every axis at one distance — a ring of the web. */
function ringAt(share: number): string {
  return AXES.map((axis) => {
    const point = pointAt(axis.angle, BOX.radius * share)
    return `${point.x},${point.y}`
  }).join(" ")
}

/**
 * Where a label sits, and which way it reads from there.
 *
 * <p>Anchoring matters more than it looks: a label at the left vertex has to
 * grow leftwards or it runs back over the chart, and the one at the top has to
 * be centred or it hangs off one side of its own axis.
 */
function anchorFor(angle: number): "start" | "middle" | "end" {
  const x = Math.cos((angle * Math.PI) / 180)
  if (Math.abs(x) < 0.2) return "middle"
  return x > 0 ? "start" : "end"
}

function OutcomeRadar({
  counts,
  className,
}: {
  counts: Counts
  className?: string
}) {
  /**
   * Nights on record, which is not the same as nights in the year.
   *
   * <p>Dividing by 365 in August would report a 60% success rate for a year
   * that has not failed once — the missing 40% being days that have not
   * happened. Only nights with an outcome are counted, so the figures mean "of
   * what we know about".
   */
  const recorded = counts.succeeded + counts.failed + counts.missed

  const shares = AXES.map((axis) => ({
    ...axis,
    percent: recorded > 0 ? (counts[axis.key] / recorded) * 100 : 0,
  }))

  const points = shares.map((share) =>
    pointAt(share.angle, (share.percent / 100) * BOX.radius)
  )

  return (
    <svg
      viewBox={`0 0 ${BOX.width} ${BOX.height}`}
      className={cn("h-auto w-full", className)}
      role="img"
      aria-label={shares
        .map((share) => `${share.label}: ${share.percent.toFixed(1)}%`)
        .join(", ")}
    >
      {/* The web: rings first, then spokes, so the spokes cross them cleanly. */}
      {RINGS.map((share) => (
        <polygon
          key={share}
          points={ringAt(share)}
          className={cn(
            "fill-none stroke-border",
            // The outer ring carries the edge of the chart and the inner three
            // are only a scale, so they are drawn back a step. All four at one
            // weight reads as a web with no boundary.
            share === 1 ? "opacity-100" : "opacity-50"
          )}
          strokeWidth={1}
        />
      ))}

      {AXES.map((axis) => {
        const end = pointAt(axis.angle, BOX.radius)
        return (
          <line
            key={axis.key}
            x1={BOX.cx}
            y1={BOX.cy}
            x2={end.x}
            y2={end.y}
            className="stroke-border"
            strokeWidth={1}
          />
        )
      })}

      {recorded > 0 && (
        <polygon
          points={points.map((point) => `${point.x},${point.y}`).join(" ")}
          className="fill-foreground/10 stroke-foreground"
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      )}

      {shares.map((share, index) => {
        const end = pointAt(share.angle, BOX.radius + LABEL_GAP)
        const anchor = anchorFor(share.angle)

        return (
          <g key={share.key}>
            {/* No dot on an axis at zero. It would sit exactly on the centre,
                where it reads as the middle of the chart rather than as a
                reading of nought. */}
            {share.percent > 0 && (
              <circle
                cx={points[index].x}
                cy={points[index].y}
                r={3.5}
                className={cn(share.tone, "stroke-background")}
                strokeWidth={1.5}
              />
            )}

            <text
              x={end.x}
              y={end.y}
              textAnchor={anchor}
              className={cn("font-mono text-[12px] font-semibold", share.tone)}
            >
              {share.percent > 0 && share.percent < 0.1
                ? "<0.1%"
                : `${share.percent.toFixed(1)}%`}
            </text>

            <text
              x={end.x}
              y={end.y + 13}
              textAnchor={anchor}
              className="fill-muted-foreground font-mono text-[9.5px] tracking-wider uppercase"
            >
              {share.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export { OutcomeRadar }
