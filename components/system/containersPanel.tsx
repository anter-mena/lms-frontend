import { Boxes } from "lucide-react"

import { Panel } from "@/components/system/panel"
import { Sparkline } from "@/components/system/sparkline"
import type { Sample } from "@/components/system/useSystemHealth"
import { Hint, HintedLabel } from "@/components/ui/hint"
import { bytes, count, duration, percent } from "@/lib/format"
import type { SystemHealth } from "@/lib/systemTypes"
import { cn } from "@/lib/utils"

/**
 * One card per container, with what it is costing the machine.
 *
 * <p>Read through a proxy that holds the Docker socket and republishes a
 * GET-only slice of the API. The backend never gets the socket itself: that is
 * root on the host with no password, and a web application holding it turns any
 * single bug in the application into the whole machine.
 *
 * <p>The two figures worth watching are not the graphs. <b>Restarts</b> climbing
 * means something is crashing and Docker is quietly putting it back — the page
 * would otherwise look perfectly healthy. <b>Health</b> is the container's own
 * check, which knows things uptime does not: Postgres can be up and refusing
 * connections.
 */

/** A label and a number, with an optional bar underneath. */
function Row({
  label,
  hint,
  value,
  detail,
  percent: bar,
  tone = "bg-foreground/70",
}: {
  label: string
  hint: React.ReactNode
  value: string
  detail?: string
  percent?: number
  tone?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-3">
        <HintedLabel label={label} className="text-xs text-muted-foreground">
          {hint}
        </HintedLabel>
        <span className="flex items-baseline gap-1.5">
          <span className="text-xs font-medium tabular-nums">{value}</span>
          {detail && (
            <span className="text-[0.65rem] text-muted-foreground tabular-nums">
              {detail}
            </span>
          )}
        </span>
      </div>

      {bar !== undefined && (
        <div className="h-1 overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full", tone)}
            style={{ width: `${Math.min(Math.max(bar, 0), 100)}%` }}
          />
        </div>
      )}
    </div>
  )
}

/**
 * The dot beside the name.
 *
 * <p>Health outranks state deliberately. A container reporting `unhealthy` is
 * still `running`, and colouring it green because Docker has not given up on it
 * yet is exactly the reading that lets a broken database sit unnoticed.
 */
function statusTone(state: string, health: string): { dot: string; text: string } {
  if (health === "unhealthy") return { dot: "bg-destructive", text: "text-destructive" }
  if (health === "starting") return { dot: "bg-warning", text: "text-warning" }
  if (state === "restarting") return { dot: "bg-warning", text: "text-warning" }
  if (state === "running") return { dot: "bg-success", text: "text-success" }
  return { dot: "bg-muted-foreground", text: "text-muted-foreground" }
}

function ContainerCard({
  container,
  history,
  hostMemory,
}: {
  container: SystemHealth["containers"]["items"][number]
  history: Sample[]
  hostMemory: number
}) {
  const tone = statusTone(container.state, container.health)
  const running = container.state === "running"

  // No limit was set on these, so Docker reports the machine's total as the
  // ceiling. Measuring against it is still the right comparison — it is the real
  // ceiling — but calling it a limit would suggest a cap that does not exist.
  const unlimited =
    hostMemory > 0 && Math.abs(container.memoryLimit - hostMemory) < hostMemory * 0.02

  const memoryPercent =
    container.memoryLimit > 0
      ? (container.memoryUsed / container.memoryLimit) * 100
      : 0

  return (
    <Panel
      title={container.name}
      className="min-h-0"
      action={
        <span
          className={cn("flex items-center gap-1.5 text-[0.7rem] font-medium", tone.text)}
        >
          <span className={cn("size-1.5 rounded-full", tone.dot)} aria-hidden />
          {container.health || container.state}
        </span>
      }
      bodyClassName="gap-2 p-3"
    >
      <p className="truncate font-mono text-[0.65rem] text-muted-foreground">
        {container.image}
      </p>

      {/* A stopped container consumes nothing, so the backend does not ask
          Docker about it. Drawing a 0% graph and "0 B of 0 B" would look like a
          measurement rather than the absence of one — Docker's own sentence says
          more, and says it accurately. */}
      {!running && (
        <p className="text-xs text-muted-foreground">{container.status}</p>
      )}

      {running && (
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline justify-between gap-3">
          <HintedLabel label="CPU" className="text-xs text-muted-foreground">
            Share of the whole machine, so 100% would mean every core.
          </HintedLabel>
          <span className="font-heading text-sm font-semibold tabular-nums">
            {percent(container.cpuPercent)}
          </span>
        </div>

        {/* A fixed height, deliberately. This used to grow to fill the card,
            which on a tall screen with three containers meant a graph roughly
            400px high — a wall of chart carrying about as much meaning as a
            fifth of it. Only the shape of the last five minutes is being read
            here, and a shape stays legible far smaller than a value would. */}
        <Sparkline
          className="h-10 sm:h-14"
          values={history.map((s) => s.containerCpu[container.name] ?? 0)}
          // A fixed 0–100 axis would flatten every one of these into a flat line
          // at the bottom: a container at 2% of a four-core box is doing real
          // work, and the shape of that work is the point of drawing it.
          max={Math.max(
            5,
            ...history.map((s) => s.containerCpu[container.name] ?? 0)
          )}
          tone="text-foreground"
        />
      </div>
      )}

      {running && (
        <Row
          label="Memory"
          hint={
            unlimited
              ? "No cap is set, so the ceiling is the machine's RAM."
              : "Against the cap set on this container."
          }
          value={bytes(container.memoryUsed)}
          detail={`of ${bytes(container.memoryLimit)}${unlimited ? " · no cap" : ""}`}
          percent={memoryPercent}
        />
      )}

      <div className="mt-auto flex flex-col gap-1.5 border-t pt-2.5">
        <Row
          label="Restarts"
          hint="Times Docker has restarted it. Climbing on its own means crashing."
          value={count(container.restarts)}
        />
        <Row
          label="Uptime"
          hint="Since this container last started, which a restart resets."
          value={duration(container.uptimeSeconds)}
        />
        <Row
          label="Network"
          hint="Total in and out since it started — a running total, not a rate."
          value={`${bytes(container.networkIn)} in`}
          detail={`${bytes(container.networkOut)} out`}
        />
      </div>
    </Panel>
  )
}

function ContainersPanel({
  health,
  history,
}: {
  health: SystemHealth
  history: Sample[]
}) {
  const { containers } = health

  // Optional for the same reason as in the polling hook: a backend that predates
  // this field sends nothing, and the "no source" panel below is exactly the
  // right thing to show for it.
  if (!containers?.available) {
    return (
      <Panel
        className="lg:h-full"
        title="Containers"
        hint={<>Read through a proxy, never the Docker socket itself.</>}
        action={
          <span className="flex items-center gap-1.5 text-[0.7rem] text-muted-foreground">
            <Boxes className="size-3.5" aria-hidden />
            not connected
          </span>
        }
        bodyClassName="items-center justify-center gap-2 p-8"
      >
        <p className="max-w-md text-center text-sm font-medium">
          No Docker endpoint is answering
        </p>
        <p className="max-w-md text-center text-sm text-muted-foreground">
          {containers?.detail} Container figures come from a read-only proxy that
          holds the Docker socket so the backend never has to. On the server it
          runs alongside the application; locally it needs starting with{" "}
          <span className="font-mono text-xs">
            docker compose up -d docker-socket-proxy
          </span>
          .
        </p>
      </Panel>
    )
  }

  const shown = containers.items.filter(isLive)
  const stopped = containers.items.length - shown.length

  return (
    <div
      // min-h-full and no scrollbar of its own: the tab panel above owns the
      // scrolling for every tab now, and two nested scroll regions on one screen
      // is a way to lose track of which one you are moving.
      className="flex flex-col gap-3 lg:min-h-full"
    >
      {/* The count belongs on the page rather than in the reader's head. Without
          it, cards quietly missing from a grid is indistinguishable from those
          containers never having existed. */}
      <p className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
        <Boxes className="size-3.5" aria-hidden />
        <span className="tabular-nums">
          {count(shown.length)} running
          {stopped > 0 && ` · ${count(stopped)} stopped`}
        </span>
        {stopped > 0 && (
          <Hint>
            Stopped containers get a count rather than a card — Docker keeps
            every one it has ever run. Anything crashing is restarting, not
            stopped, and stays on screen.
          </Hint>
        )}
      </p>

      {/* auto-fit rather than a fixed column count: this is the one tab whose
          contents are not known in advance, and it holds three containers today
          and however many the machine grows later.

          Rows size to their content, and deliberately do not stretch to fill the
          tab. This is the one tab where filling is wrong: the other three hold a
          fixed set of panels, so stretching them uses the space, while this one
          holds a list. Stretching a list of three short cards over the full
          height inflates each one to hide the fact that there are only three,
          which is information, not a gap to be papered over.

          Cards in the same row still match each other's height — grid stretches
          items within a row by default — so the result is even, just not tall.

          Nothing here caps its own height either, which is what lets the tab
          panel above scroll once the list outgrows the window. */}
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(20rem,100%),1fr))]">
        {shown.map((container) => (
          <ContainerCard
            key={container.id}
            container={container}
            history={history}
            hostMemory={health.server.memoryTotal}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * Whether this container is meant to be doing something right now.
 *
 * <p>The same rule as plain `docker ps`, and for the same reason: Docker keeps
 * every container it has ever run until something prunes them, so a machine
 * accumulates dozens of long-dead one-offs. On this laptop that is seven ancient
 * shells against four that matter, and burying the signal is how a page like
 * this stops being read.
 *
 * <p>Nothing is lost by it. A container that crashes under `restart:
 * unless-stopped` sits in `restarting`, which is included — being stopped is a
 * decision somebody made, while restarting is a thing going wrong. And the count
 * beside the cards means a missing one is still visible as a number.
 */
function isLive(container: SystemHealth["containers"]["items"][number]): boolean {
  return ["running", "restarting", "paused", "dead"].includes(container.state)
}

export { ContainersPanel }
