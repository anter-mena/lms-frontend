import { Suspense } from "react"

import {
  IdentityCard,
  IdentityCardSkeleton,
} from "@/components/layout/identityCard"
import { AppShell } from "@/components/layout/appShell"
import { UserAvatar, UserAvatarSkeleton } from "@/components/layout/userAvatar"
import { currentUser } from "@/lib/auth"

/**
 * Shell for signed-in pages. The markup and the sidebar's open/closed state
 * live in AppShell, which has to be a Client Component; keeping this
 * layout on the server means `children` are still server-rendered.
 *
 * Worth knowing when building here: nothing in this layout guards the route.
 * Each page under it does its own auth check, because a layout cannot read the
 * request and is not re-rendered on navigation.
 *
 * The identity card and avatar are passed in as props rather than imported by
 * the shell. They read the session, which only the server may do — handing them
 * down as already-rendered elements is what lets a client-side shell display
 * them without the token ever reaching the browser.
 *
 * Each is wrapped in its own Suspense boundary so the sidebar and navbar paint
 * immediately and fill in when the user resolves, instead of the whole shell
 * waiting on one API call.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Awaited here rather than suspended like the two below, because it decides
  // which menu to build — and a sidebar that grows a section after it has
  // painted is worse than one that waits a moment for the right shape.
  //
  // It costs nothing extra: `currentUser` shares the same per-request cache the
  // identity card and avatar already use, so this is one call between the three.
  const user = await currentUser()

  return (
    <AppShell
      isAdmin={user?.role === "ADMIN"}
      // Read from the token rather than from the role. An administrator holds
      // it because the migration grants ADMIN everything, not because of a check
      // for the word here — so if that ever changes, the button follows.
      canOpenInbox={user?.permissions.includes("INBOX:READ") ?? false}
      identity={
        <Suspense fallback={<IdentityCardSkeleton />}>
          <IdentityCard />
        </Suspense>
      }
      avatar={
        <Suspense fallback={<UserAvatarSkeleton />}>
          <UserAvatar />
        </Suspense>
      }
    >
      {children}
    </AppShell>
  )
}
