"use client"

import {
  Boxes,
  CircleAlert,
  Cpu,
  Gauge,
  HardDrive,
  MemoryStick,
  Server,
} from "lucide-react"

import { BackendPanel } from "@/components/system/backendPanel"
import { DatabasePanel } from "@/components/system/databasePanel"
import { Donut } from "@/components/system/donut"
import { Panel } from "@/components/system/panel"
import { Sparkline } from "@/components/system/sparkline"
import {
  useSystemHealth,
  type Sample,
} from "@/components/system/useSystemHealth"
import { HintedLabel } from "@/components/ui/hint"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { bitsPerSecond, bytes, duration, percent } from "@/lib/format"
import { THIN_SCROLLBAR } from "@/lib/scrollbar"
import type { SystemHealth } from "@/lib/systemTypes"
import { cn } from "@/lib/utils"

/**
 * The system health overview.
 *
 * <p><b>Four tabs, one per layer.</b> Server, containers, backend and database
 * fail in different ways and are fixed by different actions, and a single page
 * holding all four is a wall nobody reads.
 *
 * <p><b>Live.</b> The page re-reads `/api/system/health` every five seconds and
 * keeps a rolling window in memory. Nothing is stored, so the graphs start empty
 * when the page opens and fill as it watches — the Task Manager model. It can say
 * the machine is struggling now; it can never say what happened at three in the
 * morning. That needs storage, and storage can be added later without changing
 * any of this.
 *
 * <p>No STOP button, unlike the control panel this was adapted from: stopping the
 * server from a page the server is serving kills the thing you clicked in, and
 * leaves nothing running to start it again.
 */

/**
 * From lg, every tab fills the page exactly and nothing here scrolls.
 *
 * <p>`overflow-hidden`, not `auto`: whichever panel inside a tab is meant to
 * scroll can only do so if nothing above it will scroll first. A scrollable
 * ancestor takes the wheel and the inner region never receives it.
 *
 * <p>Below lg none of that applies — the columns collapse into one, the content
 * is taller than any phone, and the page scrolls instead.
 */
const PANEL = cn("min-h-0 lg:flex-1 lg:overflow-hidden", THIN_SCROLLBAR)

/** One labelled fact in the Server panel. */
function Fact({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  hint: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-3.5 shrink-0" aria-hidden />
        <HintedLabel label={label}>{hint}</HintedLabel>
      </span>
      <span className="truncate font-medium tabular-nums">{value}</span>
    </div>
  )
}

/**
 * A graph with its current reading, and the range it is drawn against.
 *
 * <p>The scale sits on the right rather than a full axis. A gridded chart at this
 * size spends more pixels on the frame than on the data, and the only two numbers
 * anybody reads off it are the current value and the ceiling.
 */
function Usage({
  title,
  hint,
  series,
  current,
  detail,
  floor,
  ceiling,
}: {
  title: string
  hint: React.ReactNode
  series: number[]
  current: string
  detail?: string
  floor: string
  ceiling: string
}) {
  return (
    <Panel title={title} hint={hint} bodyClassName="gap-3 p-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-heading text-lg font-semibold tracking-tight tabular-nums">
          {current}
        </span>
        {detail && (
          <span className="text-xs text-muted-foreground tabular-nums">
            {detail}
          </span>
        )}
      </div>

      <div className="flex flex-1 items-stretch gap-2">
        <Sparkline
          className="h-16 flex-1"
          values={series}
          tone="text-foreground"
        />

        {/* The two ends of the scale, so the shape means something. Without them
            a flat line at 5% and one at 95% look identical. */}
        <div className="flex w-8 shrink-0 flex-col justify-between text-[0.65rem] text-muted-foreground tabular-nums">
          <span>{ceiling}</span>
          <span>{floor}</span>
        </div>
      </div>
    </Panel>
  )
}

function ServerPanel({
  health,
  history,
}: {
  health: SystemHealth
  history: Sample[]
}) {
  const { server } = health

  const memoryUsed = server.memoryTotal - server.memoryAvailable
  const memoryPercent =
    server.memoryTotal > 0 ? (memoryUsed / server.memoryTotal) * 100 : 0

  const diskUsed = server.diskTotal - server.diskFree
  const diskPercent =
    server.diskTotal > 0 ? (diskUsed / server.diskTotal) * 100 : 0

  const latest = history.at(-1)

  return (
    // The left holds what the machine *is* — specifications and how full its disk
    // is, neither of which moves minute to minute. The right holds what it is
    // *doing*, which is what you came to watch.
    <div className="grid gap-4 lg:h-full lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <div className="flex flex-col gap-4">
        <Panel
          title="Server"
          hint={<>Fixed specifications, not live readings.</>}
          action={
            <span className="flex items-center gap-1.5 text-[0.7rem] font-medium text-success">
              <span className="size-1.5 rounded-full bg-success" aria-hidden />
              Online
            </span>
          }
          bodyClassName="gap-2.5"
        >
          <Fact
            icon={Server}
            label="OS"
            value={server.os}
            hint="The distribution on the machine, not inside the containers."
          />
          <Fact
            icon={Cpu}
            label="CPU"
            value={`${server.cores} cores`}
            hint="Cores available. Average Load above this number means work is queueing."
          />
          <Fact
            icon={MemoryStick}
            label="Memory"
            value={bytes(server.memoryTotal)}
            hint="Total RAM, shared by the system and both containers."
          />
          <Fact
            icon={HardDrive}
            label="Storage"
            value={bytes(server.diskTotal)}
            hint="The whole disk. Docker volumes have no quota of their own."
          />
          <Fact
            icon={Gauge}
            label="Load"
            value={`${server.load1.toFixed(2)} · ${server.load5.toFixed(2)} · ${server.load15.toFixed(2)}`}
            hint="Tasks waiting for a core over 1, 5 and 15 minutes. Above the core count means queueing."
          />

          <div className="mt-1 flex flex-col gap-1 border-t pt-3 text-xs text-muted-foreground">
            <span className="flex items-center justify-between gap-2">
              <HintedLabel label="Host up">
                Since the machine last booted.
              </HintedLabel>
              <span className="font-medium text-foreground">
                {duration(server.uptimeSeconds)}
              </span>
            </span>
            <span className="flex items-center justify-between gap-2">
              <HintedLabel label="Processes">
                Everything running on the machine, not just this application.
              </HintedLabel>
              <span className="font-medium text-foreground tabular-nums">
                {server.processes}
              </span>
            </span>
          </div>
        </Panel>

        <Panel
          title="Disk"
          hint={
            <>
              The whole machine. Docker volumes have no quota, so this is the
              only real ceiling.
            </>
          }
          className="lg:flex-1"
          bodyClassName="items-center justify-center gap-3"
        >
          <div className="size-32">
            <Donut
              percent={diskPercent}
              label={percent(diskPercent)}
              sublabel={`${bytes(diskUsed)} / ${bytes(server.diskTotal)}`}
            />
          </div>
          <p className="text-center text-[0.7rem] text-muted-foreground">
            {bytes(server.diskFree)} free
          </p>
        </Panel>
      </div>

      <div className="flex flex-col gap-4">
        {/* Side by side, because CPU and memory are read together — one being
            high while the other is not is the whole diagnosis. */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Usage
            title="CPU usage"
            hint={
              <>
                Non-idle share across all cores, from{" "}
                <span className="font-mono">/proc/stat</span>.
              </>
            }
            series={history.map((s) => s.cpu)}
            current={percent(server.cpuPercent)}
            detail={`load ${server.load1.toFixed(2)} / ${server.cores} cores`}
            floor="0%"
            ceiling="100%"
          />
          <Usage
            title="RAM usage"
            hint={
              <>
                <span className="font-mono">(Total − Available) ÷ Total</span>.
                Excludes the file cache, which Linux counts as used.
              </>
            }
            series={history.map((s) => s.memory)}
            current={percent(memoryPercent)}
            detail={`${bytes(memoryUsed)} / ${bytes(server.memoryTotal)}`}
            floor="0%"
            ceiling="100%"
          />
        </div>

        <Panel
          title="Bandwidth"
          hint={
            <>
              Rate from <span className="font-mono">/proc/net/dev</span>. ⚠️ That
              file is namespaced, so this is the container&rsquo;s traffic, not
              the machine&rsquo;s.
            </>
          }
          className="lg:flex-1"
          bodyClassName="gap-2 p-3"
        >
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Download</span>
            <span className="font-medium tabular-nums">
              {latest ? bitsPerSecond(latest.networkIn) : "—"}
            </span>
          </div>
          {/* Scaled to the window's own peak. Network has no natural ceiling, and
              a fixed one would flatten everything real into a straight line. */}
          <Sparkline
            className="min-h-14 flex-1"
            values={history.map((s) => s.networkIn)}
            max={Math.max(1, ...history.map((s) => s.networkIn))}
            tone="text-foreground"
          />

          <div className="flex items-center justify-between border-t pt-2 text-xs">
            <span className="text-muted-foreground">Upload</span>
            <span className="font-medium tabular-nums">
              {latest ? bitsPerSecond(latest.networkOut) : "—"}
            </span>
          </div>
          {/* Mirrored, so upload reads upward from the baseline. Two lines the
              same way up on one axis would need a legend to tell apart. */}
          <Sparkline
            className="min-h-14 flex-1 scale-y-[-1]"
            values={history.map((s) => s.networkOut)}
            max={Math.max(1, ...history.map((s) => s.networkOut))}
            tone="text-muted-foreground"
          />
        </Panel>
      </div>
    </div>
  )
}

/**
 * ⚠️ <b>The one layer with nothing behind it.</b>
 *
 * <p>Container status, restart counts and per-container resources all come from
 * Docker, which means either the socket — effectively root on the host — or a
 * read-only proxy in front of it. That is a decision worth making deliberately
 * rather than sliding into, so this tab says what it needs instead of showing
 * invented numbers that look like measurements.
 */
function ContainersPanel() {
  return (
    <Panel
      className="lg:h-full"
      title="Containers"
      hint={
        <>Needs Docker access, which the backend deliberately does not have.</>
      }
      action={
        <span className="flex items-center gap-1.5 text-[0.7rem] text-muted-foreground">
          <Boxes className="size-3.5" aria-hidden />
          not connected
        </span>
      }
      bodyClassName="items-center justify-center gap-2 p-8"
    >
      <p className="max-w-md text-center text-sm font-medium">
        This tab has no data source yet
      </p>
      <p className="max-w-md text-center text-sm text-muted-foreground">
        Container status, restart counts and per-container CPU and memory come
        from Docker. Reading them means mounting the Docker socket — which grants
        the backend root on the host — or putting a read-only proxy in front of
        it. The second is the safe shape, and it is a deliberate decision rather
        than a default.
      </p>
    </Panel>
  )
}

function SystemOverview({ initial }: { initial: SystemHealth | null }) {
  const { current, history, error, loading } = useSystemHealth(initial)

  if (loading) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">Reading the server…</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      {/* The last good reading stays on screen underneath. A blank page during a
          blip is less useful than stale numbers clearly marked as stale. */}
      {error && (
        <div
          role="status"
          aria-live="polite"
          className="flex shrink-0 items-start gap-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm"
        >
          <CircleAlert
            className="mt-0.5 size-4 shrink-0 text-warning"
            aria-hidden
          />
          <p>
            <span className="font-medium">Not updating.</span>{" "}
            <span className="text-muted-foreground">
              {error} The figures below are from the last successful reading.
            </span>
          </p>
        </div>
      )}

      {/* The layer names are the tab labels, because that is how a problem is
          described out loud — "the database is slow", not "section two". */}
      <Tabs defaultValue="server" className="flex min-h-0 flex-1 flex-col gap-4">
        <TabsList>
          <TabsTrigger value="server">Server</TabsTrigger>
          <TabsTrigger value="containers">Containers</TabsTrigger>
          <TabsTrigger value="backend">Backend</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
        </TabsList>

        <TabsContent value="server" className={PANEL}>
          {current && <ServerPanel health={current} history={history} />}
        </TabsContent>
        <TabsContent value="containers" className={PANEL}>
          <ContainersPanel />
        </TabsContent>
        <TabsContent value="backend" className={PANEL}>
          {current && <BackendPanel health={current} history={history} />}
        </TabsContent>
        <TabsContent value="database" className={PANEL}>
          {current && <DatabasePanel health={current} />}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export { SystemOverview }
