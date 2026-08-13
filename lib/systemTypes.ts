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
    /** ⚠️ Cumulative bytes, and this container's interface — not the host's. */
    networkIn: number
    networkOut: number
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
