"use client"

import { useEffect, useRef, useState } from "react"

import type { SystemHealth } from "@/lib/systemTypes"

/**
 * Keeps the page live, and keeps a short history of what it has seen.
 *
 * <p><b>Nothing is stored.</b> The history is an array in memory that never
 * leaves the tab — open the page and the graphs start empty and fill; refresh and
 * they start again. That is the Task Manager model, and it is what makes this
 * cheap: no table, no retention policy, no cleanup job.
 *
 * <p>The cost is real and worth knowing: this can tell you the machine is
 * struggling <em>now</em>, and can never tell you what happened at three in the
 * morning. Answering that needs storage, and storage is a decision that can be
 * made later without changing any of this.
 *
 * <p><b>Rates are computed here, not sent.</b> Network bytes and request totals
 * are cumulative counters — "3.6 million bytes since boot". A rate only exists as
 * the difference between two readings, so it can only be worked out by whoever is
 * taking them.
 */

/** How many readings the graphs draw. At 5s each, this is five minutes. */
const HISTORY = 60

/**
 * Between polls.
 *
 * <p>Five seconds rather than one. Each poll reads `/proc`, queries Postgres and
 * walks the meter registry — cheap, but not free, and a graph that moves every
 * second is not five times more informative than one that moves every five.
 */
const INTERVAL_MS = 5000

export type Sample = {
  cpu: number
  memory: number
  heap: number
  latency: number
  /** Bytes per second, derived from the counters. */
  networkIn: number
  networkOut: number
  requestsPerMinute: number
  /**
   * Per-container CPU, keyed by name.
   *
   * <p>A map rather than an array because containers come and go — a deploy
   * replaces one mid-window, and an array would silently shift every later
   * reading onto the wrong container's graph.
   */
  containerCpu: Record<string, number>
}

export type SystemHealthState = {
  /** The most recent reading, or null before the first arrives. */
  current: SystemHealth | null
  /** Oldest first. Empty until two readings exist for the rates to be real. */
  history: Sample[]
  /** Set when a poll fails. The last good reading stays on screen beneath it. */
  error: string | null
  /** True only before the very first reading. */
  loading: boolean
}

export function useSystemHealth(initial: SystemHealth | null): SystemHealthState {
  const [current, setCurrent] = useState<SystemHealth | null>(initial)
  const [history, setHistory] = useState<Sample[]>([])
  const [error, setError] = useState<string | null>(null)

  /**
   * The previous reading, for turning cumulative counters into rates.
   *
   * <p>A ref rather than state: it feeds the next calculation and nothing renders
   * from it, so writing it must not cause a render of its own.
   *
   * <p>Deliberately not seeded from the server's snapshot. Those counters were
   * read whenever the page was rendered, which may be seconds before this code
   * runs — dividing by the wrong elapsed time would make the first rate wrong,
   * and a wrong first point on a graph is worse than a missing one. The first
   * client poll sets the baseline instead.
   */
  const previous = useRef<{ health: SystemHealth; at: number } | null>(null)

  useEffect(() => {
    let cancelled = false

    async function poll() {
      try {
        const response = await fetch("/api/system/health", { cache: "no-store" })

        if (!response.ok) {
          const body = await response.json().catch(() => ({}))
          throw new Error(body.message ?? `Request failed (${response.status})`)
        }

        const health: SystemHealth = await response.json()
        if (cancelled) return

        const now = Date.now()
        const last = previous.current
        const seconds = last ? Math.max((now - last.at) / 1000, 0.001) : 0

        setCurrent(health)
        setError(null)

        // A rate needs two readings. The first poll after mounting has nothing to
        // subtract from, so it contributes no point rather than a fabricated one.
        if (last && seconds > 0) {
          const sample: Sample = {
            cpu: health.server.cpuPercent,
            memory: memoryPercent(health),
            heap: heapPercent(health),
            latency: health.backend.p95Millis,
            networkIn: Math.max(
              0,
              (health.server.networkIn - last.health.server.networkIn) / seconds
            ),
            networkOut: Math.max(
              0,
              (health.server.networkOut - last.health.server.networkOut) / seconds
            ),
            requestsPerMinute: Math.max(
              0,
              ((health.backend.totalRequests - last.health.backend.totalRequests) /
                seconds) *
                60
            ),
            // Already a percentage when it arrives — the backend works it out
            // from Docker's cumulative nanosecond counters, the same way this
            // hook works out the rates above.
            //
            // Guarded despite the type saying it is always there: for the few
            // minutes between deploying this and deploying the backend that
            // sends it, the field genuinely is absent, and reading `.items` off
            // undefined would take down the whole page rather than one tab.
            containerCpu: Object.fromEntries(
              (health.containers?.items ?? []).map((c) => [c.name, c.cpuPercent])
            ),
          }

          setHistory((h) => [...h, sample].slice(-HISTORY))
        }

        previous.current = { health, at: now }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not reach the server.")
        }
      }
    }

    poll()
    const timer = setInterval(poll, INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [])

  return { current, history, error, loading: current === null }
}

/** Used, as a share of total — the reading that excludes the file cache. */
function memoryPercent(health: SystemHealth): number {
  const { memoryTotal, memoryAvailable } = health.server
  if (memoryTotal <= 0) return 0
  return ((memoryTotal - memoryAvailable) / memoryTotal) * 100
}

function heapPercent(health: SystemHealth): number {
  const { heapUsed, heapMax } = health.backend
  if (heapMax <= 0) return 0
  return (heapUsed / heapMax) * 100
}
