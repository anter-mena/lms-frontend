import { cn } from "@/lib/utils"

/**
 * A filled line chart, drawn by hand rather than by a charting library.
 *
 * <p>It is about thirty lines of path arithmetic against the several hundred
 * kilobytes a chart library adds to the bundle — and this page needs one shape,
 * not a plotting grammar. If the day comes that somebody wants axes, tooltips and
 * zooming, that is the day to reach for a library.
 *
 * <p><b>The SVG is taken out of the flow</b>, absolutely positioned inside a
 * wrapper that owns the size. That is not decoration: an in-flow SVG whose height
 * cannot be resolved falls back to its viewBox ratio — 100 by 40 — so at a
 * thousand pixels wide it drew itself four hundred tall and pushed the card out
 * with it. Out of flow it contributes nothing to sizing, so the wrapper can be
 * given a fixed height or told to fill, and neither can run away.
 *
 * <p>`preserveAspectRatio="none"` lets the chart stretch to whatever width the
 * card is, which is what makes it fluid. The cost is that the stroke would
 * stretch with it and go blurry — `vector-effect="non-scaling-stroke"` is what
 * keeps the line one pixel wide at any width.
 */

/** Fixed height in the viewBox. Width is always 100 and the SVG stretches. */
const H = 40

function toPath(values: number[], max: number): { line: string; area: string } {
  if (values.length === 0) return { line: "", area: "" }

  const step = 100 / Math.max(values.length - 1, 1)
  const y = (v: number) => H - (Math.min(v, max) / max) * H

  const points = values.map((v, i) => `${(i * step).toFixed(2)},${y(v).toFixed(2)}`)

  return {
    line: `M ${points.join(" L ")}`,
    // Closed back along the bottom edge, which is what makes it a filled area
    // rather than a line with a stray diagonal underneath it.
    area: `M 0,${H} L ${points.join(" L ")} L 100,${H} Z`,
  }
}

function Sparkline({
  values,
  max = 100,
  tone = "text-foreground",
  className,
}: {
  values: number[]
  /** The top of the scale. Fixing it stops the shape rescaling every tick. */
  max?: number
  /** A text colour class — the line takes it, the fill takes it at low opacity. */
  tone?: string
  /** Sizing goes here: a fixed height, or `flex-1` to fill a column. */
  className?: string
}) {
  const { line, area } = toPath(values, max)
  const id = `fade-${tone.replace(/[^a-z]/gi, "")}`

  return (
    <div className={cn("relative", tone, className)}>
      <svg
        viewBox={`0 0 100 ${H}`}
        preserveAspectRatio="none"
        className="absolute inset-0 size-full"
        aria-hidden
      >
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path d={area} fill={`url(#${id})`} />
        <path
          d={line}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  )
}

export { Sparkline }
