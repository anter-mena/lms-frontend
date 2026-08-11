import { Suspense } from "react"

import {
  IdentityCard,
  IdentityCardSkeleton,
} from "@/components/layout/identityCard"
import { AppShell } from "@/components/layout/appShell"
import { UserAvatar, UserAvatarSkeleton } from "@/components/layout/userAvatar"

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
export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AppShell
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
