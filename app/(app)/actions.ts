"use server"

import { redirect } from "next/navigation"

import { destroySession } from "@/lib/session"

/**
 * Clears the session cookie and sends the user back to sign-in.
 *
 * The cookie is httpOnly, so the browser cannot clear it itself — this has to
 * happen on the server. `destroySession` drops the half-way MFA cookie too, so
 * an interrupted login does not leave a stale challenge behind.
 */
export async function logout() {
  await destroySession()
  // Throws a framework control-flow exception; nothing after it runs.
  redirect("/login")
}
