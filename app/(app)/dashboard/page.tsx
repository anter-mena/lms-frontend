import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { apiFetch } from "@/lib/api"

export const metadata: Metadata = {
  title: "Dashboard",
}

/** Mirrors the backend's /api/users/me response. */
type UserResponse = {
  id: number
  firstName: string
  lastName: string
  email: string
  role: string
  status: string
  mfaEnabled: boolean
  permissions: string[]
}

export default async function DashboardPage() {
  // The page body is empty and waiting to be rebuilt, but this call stays.
  // There is no middleware in this app, so the 401/403 check below is the only
  // thing stopping /dashboard rendering for a signed-out visitor — and whatever
  // gets built here will need the user anyway.
  //
  // Server-side on purpose: the access token lives in an httpOnly cookie the
  // browser cannot read, so the call has to be made here rather than in a
  // client component.
  const result = await apiFetch<UserResponse>("/api/users/me", {
    authenticated: true,
  })

  // No token, or one the backend rejected. Either way there is no session.
  if (!result.ok && (result.error.status === 401 || result.error.status === 403)) {
    redirect("/login")
  }

  if (!result.ok) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-destructive">{result.error.message}</p>
      </div>
    )
  }

  // `result.data` holds the signed-in user — firstName, role, permissions and
  // the rest — ready for whatever goes here next.
  return <div className="flex flex-1 flex-col gap-6 p-6" />
}
