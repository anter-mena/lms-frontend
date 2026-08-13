import { HintedLabel } from "@/components/ui/hint"
import { cn } from "@/lib/utils"

/**
 * One measurement: what it is, what it reads, and how close to its limit.
 *
 * <p>The bar is optional because half of these have no ceiling to be measured
 * against. A cache hit ratio is out of 100 and a database size is out of nothing
 * in particular — drawing a bar for the second would invent a limit that does not
 * exist, which is worse than showing no bar at all.
 */
function StatRow({
  label,
  hint,
  value,
  detail,
  /** 0–100. Omit where there is no meaningful ceiling. */
  percent,
  tone = "bg-foreground/70",
}: {
  label: string
  hint: React.ReactNode
  value: string
  /** The right-hand context — "of 100", "7 day average". */
  detail?: string
  percent?: number
  tone?: string
}) {
  return (
    <div className="flex flex-col gap-1.5 border-b pb-3 last:border-b-0 last:pb-0">
      <div className="flex items-baseline justify-between gap-3">
        <HintedLabel label={label} className="text-sm text-muted-foreground">
          {hint}
        </HintedLabel>

        <span className="flex items-baseline gap-2">
          <span className="text-sm font-medium tabular-nums">{value}</span>
          {detail && (
            <span className="text-[0.7rem] text-muted-foreground tabular-nums">
              {detail}
            </span>
          )}
        </span>
      </div>

      {percent !== undefined && (
        <div className="h-1 overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full", tone)}
            style={{ width: `${Math.min(Math.max(percent, 0), 100)}%` }}
          />
        </div>
      )}
    </div>
  )
}

export { StatRow }
