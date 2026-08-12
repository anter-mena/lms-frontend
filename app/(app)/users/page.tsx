import type { Metadata } from "next"
import { forbidden } from "next/navigation"
import { ShieldAlert } from "lucide-react"

import { PageHeader } from "@/components/layout/pageHeader"
import { UsersFilter } from "@/components/users/usersFilter"
import { UsersTable } from "@/components/users/usersTable"
import { requireUser } from "@/lib/auth"
import { listUsers, type UserQuery } from "@/lib/users"

export const metadata: Metadata = {
  title: "User management",
}

/**
 * Everyone with an account, and what may be done to them.
 *
 * <p>Fetched here rather than in the table, so the token stays on the server and
 * the list is in the first paint instead of arriving after one.
 *
 * <p><b>Everything the list does happens in the database.</b> Search, filters,
 * sorting and paging all travel as query parameters and come back as one page.
 * The alternative — fetching every account and narrowing it in the browser — was
 * what this did while the data was invented, and it stops working at the size
 * where any of it starts to matter.
 *
 * <p>Reading the list needs `USER:READ`, which only an administrator holds — it
 * belongs to Management, and that module is marked admin-only in the database, so
 * it cannot be granted to a member individually either. A member who reaches this
 * address gets a real 403 rather than an empty table that looks like the company
 * has nobody in it.
 */
export default async function UsersPage({
  searchParams,
}: {
  // Every knob the table and filter panel own. They write here and read from
  // here, which is what lets two components that never meet stay in step.
  searchParams: Promise<UserQuery>
}) {
  await requireUser()

  const query = await searchParams
  const result = await listUsers(query)

  // A real 403, not a page that renders normally and apologises in the middle.
  //
  // The distinction matters: this is not "the list is empty" or "something went
  // wrong", it is "this screen is not yours". Next's own interrupt renders
  // `app/forbidden.tsx` and returns the status to match, so the address bar, the
  // browser history and anything reading the response all agree with the sentence
  // on screen.
  //
  // Only 403. A backend that is down is an outage, not a refusal, and telling
  // somebody they lack permission when the server is simply unreachable sends
  // them to ask an administrator for something that would not help.
  if (!result.ok && result.error.status === 403) {
    forbidden()
  }

  return (
    // h-full + overflow-hidden: this page takes exactly the room the shell gives
    // it and never more, so nothing here scrolls except the table, which manages
    // its own. Without the height cap the table has nothing to be shorter than
    // and simply grows until the page scrolls again.
    // pb-3 rather than a uniform p-6: the footer sits directly under this, and a
    // full 24px above a border that is itself only a few pixels from the bottom
    // of the window left the two looking unrelated.
    <div className="flex h-full flex-col gap-6 overflow-hidden p-6 pb-3">
      {/* No back chevron: this is where /users/new and /users/[id] go back to. */}
      <PageHeader
        title="User management"
        description="Accounts, roles, and access."
        actions={<UsersFilter />}
      />

      {result.ok ? (
        // Keyed on the query, so the search box is re-seeded from the URL when
        // the Back button changes it. Without this a stale word sits in a field
        // that is no longer filtering anything.
        <UsersTable
          key={JSON.stringify(query)}
          page={result.data}
          query={query}
        />
      ) : (
        /* Everything except a refusal, which was handled above. In practice that
           means the backend is unreachable or broke — an outage, and worth
           showing here rather than throwing the whole page away, because the
           header and the sidebar around it still work. */
        <div className="flex flex-1 items-start justify-center">
          <div className="flex max-w-md flex-col items-center gap-2 rounded-md border bg-card p-8 text-center">
            <ShieldAlert className="size-5 text-warning" aria-hidden />
            <p className="text-sm font-medium">Cannot show the user list</p>
            <p className="text-sm text-muted-foreground">{result.error.message}</p>
          </div>
        </div>
      )}
    </div>
  )
}
