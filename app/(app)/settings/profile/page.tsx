import type { Metadata } from "next"

import { requireUser } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Profile",
}

export default async function ProfilePage() {
  // This page rendered for anyone at all until now. The `(app)` layout cannot
  // do this on its behalf: a layout is not re-rendered when you navigate
  // between the routes inside it, so a check there would cover the first page
  // landed on and nothing after it.
  const user = await requireUser()

  return (
    // Same top-left column as the other settings pages. Centring this one made
    // the heading jump halfway down the screen when moving between sections.
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Profile
        </h1>
        <p className="text-sm text-muted-foreground">
          Signed in as {user.email}.
        </p>
      </div>
    </div>
  )
}
