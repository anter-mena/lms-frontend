import type { Metadata } from "next"

import { requireUser } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Dashboard",
}

export default async function DashboardPage() {
  // First statement, and the only thing standing between a signed-out visitor
  // and this page — there is no middleware in this app.
  //
  // It returns the signed-in user too (firstName, role, permissions), so
  // whatever gets built here can take it from this same call rather than
  // fetching again. Nothing else is here yet: the body is waiting to be
  // rebuilt.
  await requireUser()

  return <div className="flex flex-1 flex-col gap-6 p-6" />
}
