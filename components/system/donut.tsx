import { cn } from "@/lib/utils"

/**
 * One number as a ring.
 *
 * <p>Two arcs rather than a ring with something drawn on top of it: the filled
 * part, and a track that starts and stops short of it. That is what leaves a gap
 * between used and free — a full circle behind would simply show through.
 *
 * <p>Both ends are cut square. A rounded cap on a 4% arc turns it into a floating
 * lozenge that reads as a dot rather than as the start of a scale.
 */
function Donut({
  percent,
  label,
  sublabel,
  tone = "text-foreground",
  className,
}: {
  percent: number
  /** Big text in the middle. */
  label: string
  /** Smaller line under it. */
  sublabel?: string
  tone?: string
  className?: string
}) {
  const radius = 42
  const circumference = 2 * Math.PI * radius

  const share = Math.min(Math.max(percent, 0), 100) / 100
  const filled = share * circumference

  /**
   * The space left between the filled arc and the track, at both ends.
   *
   * <p>In path units, so it stays the same visual width whatever the percentage
   * is — a gap defined as a share of the arc would vanish at 4% and gape at 90%.
   */
  const gap = 4

  /**
   * The track stops short of the filled arc on both sides.
   *
   * <p>Drawn as a single dash rather than a full circle behind: a complete ring
   * underneath would show through the gap and there would be no gap. Clamped at
   * zero so a full 100% leaves no negative-length dash behind it.
   */
  const trackLength = Math.max(circumference - filled - gap * 2, 0)

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      {/* -rotate-90 so the arc starts at twelve o'clock. A circle's own angle
          zero is at three. */}
      <svg viewBox="0 0 100 100" className={cn("size-full -rotate-90", tone)}>
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          className="stroke-border"
          strokeWidth="8"
          strokeDasharray={`${trackLength} ${circumference - trackLength}`}
          // Negative offset moves the dash forward along the path, so the track
          // begins one gap after the filled arc ends.
          strokeDashoffset={-(filled + gap)}
        />

        {/* No strokeLinecap: the default butt end cuts the arc square, which is
            what makes the two ends read as a deliberate edge rather than a
            lozenge floating on the ring. */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeDasharray={`${filled} ${circumference - filled}`}
        />
      </svg>

      {/* Absolutely centred rather than inside the SVG: real text scales and
          wraps properly, where SVG <text> would shrink with the viewBox. */}
      <div className="absolute flex flex-col items-center">
        <span className="font-heading text-xl font-semibold tracking-tight">
          {label}
        </span>
        {sublabel && (
          <span className="text-[0.7rem] text-muted-foreground">{sublabel}</span>
        )}
      </div>
    </div>
  )
}

export { Donut }
