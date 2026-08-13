import { Panel } from "@/components/system/panel"
import { bytes, count } from "@/lib/format"
import type { SystemHealth } from "@/lib/systemTypes"
import { THIN_SCROLLBAR } from "@/lib/scrollbar"
import { cn } from "@/lib/utils"

/**
 * A census of the database: what is in it, and what it weighs.
 *
 * <p>One statement against `pg_stat_user_tables` — row counts and
 * `pg_total_relation_size`, ordered biggest first.
 *
 * <p>Counts are estimates from the statistics collector, not `COUNT(*)`.
 * Postgres keeps no exact total, and asking for one on a large table means
 * reading the whole thing.
 *
 * <p>The useful reading is not any single row, it is which row is growing. At
 * eight megabytes the sizes are almost all index and page overhead; the moment
 * the disk figure starts moving, this is the card that says which table is
 * responsible.
 */

function TablesCard({ tables }: { tables: SystemHealth["database"]["tables"] }) {
  return (
    <Panel
      title="Tables"
      hint={
        <>
          Row counts and total size, from{" "}
          <span className="font-mono">pg_stat_user_tables</span>. Counts are
          estimates, not exact — Postgres does not keep a running total.
        </>
      }
      action={
        <span className="font-mono text-[0.7rem] text-muted-foreground tabular-nums">
          {tables.length} tables
        </span>
      }
      className="lg:min-h-0 lg:flex-1"
      bodyClassName="p-0"
    >
      {/* Scrolls inside the card rather than growing it. Nine tables fit today;
          a schema three times this size should not push the donut off the page. */}
      {/* Every row on a phone, where the page scrolls anyway. From lg it takes
          the height left over and scrolls inside itself. */}
      <div
        className={cn(
          "lg:min-h-0 lg:flex-1 lg:overflow-y-auto",
          THIN_SCROLLBAR
        )}
      >
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-card">
            <tr className="border-b">
              <th className="py-2 pl-4 text-left font-mono text-[0.65rem] font-medium tracking-wider text-muted-foreground uppercase">
                Table
              </th>
              <th className="px-3 py-2 text-right font-mono text-[0.65rem] font-medium tracking-wider text-muted-foreground uppercase">
                Rows
              </th>
              <th className="py-2 pr-4 text-right font-mono text-[0.65rem] font-medium tracking-wider text-muted-foreground uppercase">
                Size
              </th>
            </tr>
          </thead>

          <tbody>
            {tables.map((table) => (
              <tr key={table.name} className="border-b last:border-b-0">
                <td className="py-2 pl-4">
                  <span className="font-mono text-xs">{table.name}</span>
                </td>
                <td
                  className={cn(
                    "px-3 py-2 text-right text-xs tabular-nums",
                    // An empty table is worth noticing rather than reading as a
                    // zero among numbers — this one is empty because the feature
                    // behind it was never finished.
                    table.rows === 0 ? "text-muted-foreground/50" : "font-medium"
                  )}
                >
                  {count(table.rows)}
                </td>
                <td className="py-2 pr-4 text-right text-xs text-muted-foreground tabular-nums">
                  {bytes(table.bytes)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

export { TablesCard }
