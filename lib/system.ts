import "server-only"

import { apiFetch, type ApiResult } from "@/lib/api"
import type { SystemHealth } from "@/lib/systemTypes"

/**
 * Reading the system health figures.
 *
 * <p>Server-side because the access token lives in an httpOnly cookie the browser
 * cannot read. The page fetches once for the first paint; the polling that keeps
 * it live goes through a Route Handler, which can reach the same cookie.
 */
export async function getSystemHealth(): Promise<ApiResult<SystemHealth>> {
  return apiFetch<SystemHealth>("/api/system/health", { authenticated: true })
}

export type { SystemHealth }
