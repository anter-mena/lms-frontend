import type { Metadata } from "next"

import { PageHeader } from "@/components/layout/pageHeader"
import { SystemOverview } from "@/components/system/systemOverview"
import { requireUser } from "@/lib/auth"
import { getSystemHealth } from "@/lib/system"

export const metadata: Metadata = {
  title: "System health",
}

/**
 * How the platform and the machine under it are doing.
 *
 * <p>Administrators only, enforced the same way `/users` is: the route is listed
 * in middleware's `ADMIN_ONLY`, which is the last moment a real 403 can still be
 * returned — by the time a page runs, the layout has already started streaming a
 * 200. The sidebar hides the link too, but that is courtesy; the refusal is what
 * counts.
 *
 * <p>Three of the four tabs are live, from `GET /api/system/health`. Host CPU,
 * memory, load and disk turned out to need no infrastructure at all: Docker does
 * not put {@code /proc} in a namespace, so the container reads the machine's real
 * figures directly.
 *
 * <p>⚠️ <b>Containers is the exception</b> and says so on screen. Status, restart
 * counts and per-container resources come from Docker, which means the socket —
 * effectively root on the host — or a read-only proxy in front of it. Worth
 * deciding deliberately rather than by default.
 *
 * <p>Nothing is stored. The graphs are a rolling window held in the browser, like
 * Task Manager: they start empty when the page opens and fill as it watches. That
 * removes retention, cleanup and a table entirely, at the price of never being
 * able to answer "what happened at 3am". Disk growth is the one field that would
 * want history, because its slope matters more than its value.
 */
export default async function SystemHealthPage() {
  await requireUser()

  // Fetched once here so the first paint already has real figures rather than a
  // spinner that resolves a moment later. The polling that keeps it live takes
  // over from the browser — see useSystemHealth.
  //
  // A failure is not fatal: the client will try again in five seconds and show
  // the reason in the meantime. That matters most exactly when the backend is
  // unwell, which is when somebody opens this page.
  const result = await getSystemHealth()

  return (
    // Below lg the panels stack into one tall column that no screen holds, so the
    // page scrolls normally. From lg it is pinned and the only thing that moves
    // is the table — see PANEL in systemOverview.
    <div className="flex h-full min-h-0 flex-col gap-5 overflow-y-auto p-4 pb-3 sm:p-6 lg:overflow-hidden">
      <PageHeader
        title="System health"
        description="How the platform and the server under it are doing."
      />

      <SystemOverview initial={result.ok ? result.data : null} />
    </div>
  )
}
