import { NextResponse } from "next/server"

import { getSystemHealth } from "@/lib/system"

/**
 * What the page polls.
 *
 * <p>A Route Handler rather than the browser calling the backend directly, for
 * the usual reason: the token is in an httpOnly cookie, so only the server can
 * attach it. This forwards, nothing more.
 *
 * <p>`no-store` on the way out as well as in. A metrics response that any layer
 * decides to cache is a metrics response that stops moving, which is the one
 * thing it must never do.
 */
export const runtime = "nodejs"

export async function GET() {
  const result = await getSystemHealth()

  if (!result.ok) {
    return NextResponse.json(
      { message: result.error.message },
      { status: result.error.status, headers: { "Cache-Control": "no-store" } }
    )
  }

  return NextResponse.json(result.data, {
    headers: { "Cache-Control": "no-store" },
  })
}
