/**
 * The shape of `GET /api/system/health`.
 *
 * <p>Client-safe on purpose — the polling hook is a Client Component, and its
 * sibling `lib/system.ts` reads the session cookie, so importing that one from
 * the browser is a build error. Same split as `userTypes` and `users`.
 *
 * <p>Sizes are bytes and durations are seconds unless a field says otherwise.
 * Formatting is the screen's job: the API should not decide whether 8641559 reads
 * as "8.6 MB" or "8.2 MiB".
 */

export type SystemHealth = {
  server: {
    os: string
    cores: number
    /** 0–100 across all cores. Zero on the first reading — see the service. */
    cpuPercent: number
    memoryTotal: number
    /** Genuinely free. Excludes the file cache, which Linux counts as used. */
    memoryAvailable: number
    diskTotal: number
    diskFree: number
    load1: number
    load5: number
    load15: number
    processes: number
    /** Since the machine booted, not since the app started. */
    uptimeSeconds: number
    /** Cumulative bytes. A rate is the difference between two readings. */
    networkIn: number
    networkOut: number
    /**
     * Whether the two counters above are the machine's or only this container's.
     *
     * <p>`/proc/net` is namespaced, so it takes a mount to read the host's. False
     * means the mount is missing and the figures are the application's own
     * traffic — which is a real number answering a much smaller question, so the
     * screen says which one it is showing.
     */
    networkIsHost: boolean
  }
  containers: {
    available: boolean
    /** Why not, when `available` is false. */
    detail: string | null
    /** Empty when unavailable — which is not the claim "nothing is running". */
    items: {
      id: string
      name: string
      image: string
      /** running · exited · restarting · paused */
      state: string
      /** Docker's own phrasing — "Up 2 weeks (healthy)". */
      status: string
      /** healthy · unhealthy · starting, or empty where none is configured. */
      health: string
      restarts: number
      /** Since this container started. A restart resets it. */
      uptimeSeconds: number
      /** 0–100 against the whole machine, as `docker stats` reports it. */
      cpuPercent: number
      memoryUsed: number
      /** The machine's total where no limit is set, which is the case here. */
      memoryLimit: number
      /** Cumulative since the container started. */
      networkIn: number
      networkOut: number
    }[]
  }
  backend: {
    uptimeSeconds: number
    heapUsed: number
    heapMax: number
    processCpuPercent: number
    totalRequests: number
    /** Averaged over the process's life, not a live rate. */
    requestsPerMinute: number
    errors5xx: number
    errors4xx: number
    error5xxRate: number
    p95Millis: number
    p99Millis: number
    pool: {
      active: number
      idle: number
      max: number
      pending: number
      waitMillis: number
    }
  }
  database: {
    sizeBytes: number
    onDiskBytes: number
    walBytes: number
    activeConnections: number
    runningQueries: number
    maxConnections: number
    /** 0–100. */
    cacheHitRatio: number
    uptimeSeconds: number
    /** Whether pg_stat_statements is installed. False means the field is unknown, not zero. */
    slowQueriesAvailable: boolean
    tables: { name: string; rows: number; bytes: number }[]
  }
}
