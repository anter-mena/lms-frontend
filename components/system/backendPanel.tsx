import { Panel } from "@/components/system/panel"
import { Sparkline } from "@/components/system/sparkline"
import { StatRow } from "@/components/system/statRow"
import type { Sample } from "@/components/system/useSystemHealth"
import { bytes, count, duration, percent } from "@/lib/format"
import type { SystemHealth } from "@/lib/systemTypes"

/**
 * The Spring Boot application layer, from Micrometer.
 *
 * <p>Every figure here is live. The heap and latency graphs draw the rolling
 * window the page has collected since it was opened — nothing is stored, so they
 * start empty and fill.
 */
function BackendPanel({
  health,
  history,
}: {
  health: SystemHealth
  history: Sample[]
}) {
  const { backend } = health
  const heapPercent =
    backend.heapMax > 0 ? (backend.heapUsed / backend.heapMax) * 100 : 0

  return (
    <div className="grid gap-4 lg:h-full lg:grid-cols-2 lg:grid-rows-[minmax(0,1fr)_auto]">
      <Panel
        title="JVM heap"
        hint={
          <>
            Sawing up and down as garbage collection runs is healthy. Climbing
            and never falling back is a leak.
          </>
        }
        bodyClassName="gap-3 p-3"
      >
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-heading text-lg font-semibold tracking-tight tabular-nums">
            {bytes(backend.heapUsed)}
          </span>
          <span className="text-xs text-muted-foreground tabular-nums">
            of {bytes(backend.heapMax)} · {percent(heapPercent)}
          </span>
        </div>

        <Sparkline
          className="h-16 lg:h-auto lg:min-h-16 lg:flex-1"
          values={history.map((s) => s.heap)}
          tone="text-foreground"
        />
      </Panel>

      <Panel
        title="Response time"
        hint={
          <>
            95% of requests finished faster than this. An average would hide the
            slow tail, which is the part people feel.
          </>
        }
        bodyClassName="gap-3 p-3"
      >
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-heading text-lg font-semibold tracking-tight tabular-nums">
            {backend.p95Millis.toFixed(0)} ms
          </span>
          <span className="text-xs text-muted-foreground tabular-nums">
            p99 {backend.p99Millis.toFixed(0)} ms
          </span>
        </div>

        {/* Scaled to the worst reading in the window rather than a fixed
            ceiling: latency has no natural maximum, and a 0-to-1000ms axis
            would flatten every real change into a straight line. */}
        <Sparkline
          className="h-16 lg:h-auto lg:min-h-16 lg:flex-1"
          values={history.map((s) => s.latency)}
          max={Math.max(50, ...history.map((s) => s.latency))}
          tone="text-foreground"
        />
      </Panel>

      <Panel title="Traffic and errors" bodyClassName="gap-3">
        <StatRow
          label="Requests per minute"
          hint="Throughput. Falling to zero matters as much as spiking."
          value={
            history.length > 0
              ? count(history[history.length - 1].requestsPerMinute)
              : "—"
          }
          detail={`${count(backend.totalRequests)} since restart`}
        />
        <StatRow
          label="5xx error rate"
          hint="The backend broke. Unlike 4xx, which is it refusing correctly."
          value={percent(backend.error5xxRate, 2)}
          detail={`${count(backend.errors5xx)} of ${count(backend.totalRequests)}`}
          percent={backend.error5xxRate}
          tone="bg-destructive/70"
        />
        <StatRow
          label="4xx refusals"
          hint="Refused on purpose — not signed in, no permission, not found."
          value={count(backend.errors4xx)}
          detail={
            backend.totalRequests > 0
              ? percent((backend.errors4xx / backend.totalRequests) * 100, 1)
              : undefined
          }
          percent={
            backend.totalRequests > 0
              ? (backend.errors4xx / backend.totalRequests) * 100
              : 0
          }
          tone="bg-warning/70"
        />
        <StatRow
          label="Uptime"
          hint="Since the container last started — usually just when you deployed."
          value={duration(backend.uptimeSeconds)}
        />
      </Panel>

      <Panel title="Database connections" bodyClassName="gap-3">
        <StatRow
          label="Active connections"
          hint="Running a query. Pinned at the maximum means requests are queueing."
          value={count(backend.pool.active)}
          detail={`of ${backend.pool.max}`}
          percent={
            backend.pool.max > 0
              ? (backend.pool.active / backend.pool.max) * 100
              : 0
          }
        />
        <StatRow
          label="Idle connections"
          hint="Open and ready. Reusing one is far cheaper than reconnecting."
          value={count(backend.pool.idle)}
          detail={`of ${backend.pool.max}`}
          percent={
            backend.pool.max > 0 ? (backend.pool.idle / backend.pool.max) * 100 : 0
          }
          tone="bg-muted-foreground/40"
        />
        <StatRow
          label="Threads waiting"
          hint="Blocked waiting for a free connection. Above zero is a problem."
          value={count(backend.pool.pending)}
        />
        <StatRow
          label="Connection wait time"
          hint="Wait to borrow a connection. Rises before anything visibly breaks."
          value={`${backend.pool.waitMillis.toFixed(1)} ms`}
        />
      </Panel>
    </div>
  )
}

export { BackendPanel }
