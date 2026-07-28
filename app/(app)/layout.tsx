import { Navbar } from "@/components/layout/navbar"
import { NavPanel } from "@/components/layout/nav-panel"
import { NavRail } from "@/components/layout/nav-rail"

/**
 * App shell: full-width navbar on top, then an icon rail, a contextual nav
 * panel, and the content area side by side beneath it.
 */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-svh flex-col">
      <Navbar />
      <div className="flex flex-1">
        <NavRail />
        <NavPanel />
        <main className="flex min-w-0 flex-1 flex-col">{children}</main>
      </div>
    </div>
  )
}
