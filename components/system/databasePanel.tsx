import { Donut } from "@/components/system/donut"
import { Panel } from "@/components/system/panel"
import { StatRow } from "@/components/system/statRow"
import { TablesCard } from "@/components/system/tablesCard"
import { bytes, count, duration, percent } from "@/lib/format"
import type { SystemHealth } from "@/lib/systemTypes"

/**
 * The PostgreSQL layer, from its own statistics views.
 *
 * <p>All live. `pg_stat_database`, `pg_stat_activity`, `pg_database_size` and
 * `pg_stat_user_tables` between them cover everything here except slow queries,
 * which needs the `pg_stat_statements` extension — and the card says so rather
 * than reporting a zero it did not measure.
 */
function DatabasePanel({ health }: { health: SystemHealth }) {
  const { database, server } = health

  const shareOfDisk =
    server.diskTotal > 0 ? (database.onDiskBytes / server.diskTotal) * 100 : 0

  return (
    // min-h-full rather than h-full, so a short window scrolls instead of
    // clipping — see the PANEL note in systemOverview. The tables card inside
    // keeps its own scrollbar; the browser gives it the wheel first and only
    // chains out here once it reaches the end.
    <div className="grid gap-4 lg:min-h-full lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <div className="flex flex-col gap-4 lg:min-h-0">
        <Panel title="Storage" bodyClassName="gap-3">
          <StatRow
            label="Data"
            hint="What your tables and indexes occupy."
            value={bytes(database.sizeBytes)}
          />
          <StatRow
            label="On disk"
            hint="The whole Postgres directory. This is the number that fills a disk."
            value={bytes(database.onDiskBytes)}
          />
          <StatRow
            label="Write-ahead log"
            hint="Changes are written here before the tables. Growing without stopping is trouble."
            value={bytes(database.walBytes)}
          />
          <StatRow
            label="Share of disk"
            hint="Postgres against the whole machine."
            value={percent(shareOfDisk, 2)}
            detail={`of ${bytes(server.diskTotal)}`}
            percent={shareOfDisk}
          />
        </Panel>

        <Panel
          title="Cache hit ratio"
          hint={
            <>
              <span className="font-mono">hits ÷ (hits + reads)</span>. Below
              about 99% means it is reading disk often enough to slow things
              down.
            </>
          }
          className="lg:flex-1"
          bodyClassName="items-center justify-center gap-3"
        >
          <div className="size-32">
            <Donut
              percent={database.cacheHitRatio}
              label={percent(database.cacheHitRatio, 1)}
              sublabel="from memory"
            />
          </div>

          <p className="text-center text-[0.7rem] text-muted-foreground">
            Below 99% is usually a missing index, not too little memory
          </p>
        </Panel>
      </div>

      <div className="flex flex-col gap-4 lg:min-h-0">
        <Panel title="Activity" bodyClassName="gap-3">
          <StatRow
            // Deliberately not "active": the Backend tab uses that word for the
            // connections currently running a query, and this counts the idle
            // ones too. Two meanings of one word across two tabs is how a pool
            // sitting at its limit gets read as healthy.
            label="Open connections"
            hint="Every connection to this database, busy or idle. Hitting the limit causes errors, not slowness."
            value={count(database.activeConnections)}
            detail={`of ${database.maxConnections}`}
            percent={
              database.maxConnections > 0
                ? (database.activeConnections / database.maxConnections) * 100
                : 0
            }
          />
          <StatRow
            label="Running queries"
            hint="Actually executing right now, rather than sitting idle."
            value={count(database.runningQueries)}
          />
          <StatRow
            label="Slow queries"
            hint="Queries over a second. Needs the pg_stat_statements extension."
            value={database.slowQueriesAvailable ? "0" : "—"}
            detail={database.slowQueriesAvailable ? undefined : "not enabled"}
          />
          <StatRow
            label="Uptime"
            hint="Since Postgres started. Longer than the backend's is healthy."
            value={duration(database.uptimeSeconds)}
          />
        </Panel>

        <TablesCard tables={database.tables} />
      </div>
    </div>
  )
}

export { DatabasePanel }
