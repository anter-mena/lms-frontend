import { AppShell } from "@/components/layout/appShell"

/**
 * Shell for signed-in pages. The markup and the sidebar's open/closed state
 * live in AppShell, which has to be a Client Component; keeping this
 * layout on the server means `children` are still server-rendered.
 *
 * Worth knowing when building here: nothing in this layout guards the route.
 * Each page under it does its own auth check, because a layout cannot read the
 * request and is not re-rendered on navigation.
 */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AppShell>{children}</AppShell>
}
