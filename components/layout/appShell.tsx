"use client"

import { useState } from "react"

import { AppNavbar } from "@/components/layout/appNavbar"
import { AppSidebar } from "@/components/layout/appSidebar"
import { SidebarTrigger } from "@/components/layout/sidebarTrigger"

/**
 * Shell for the whole signed-in app — every route under `(app)`, not just the
 * dashboard.
 *
 * It owns one thing: whether the sidebar is open. The sidebar and navbar are
 * separate components; this only holds the state they both need and decides
 * which of them the trigger belongs to.
 *
 * Client-side for that state. The layout rendering it stays a Server Component,
 * so `children` are still server-rendered and pass straight through.
 */
function AppShell({
  children,
  identity,
  avatar,
}: {
  children: React.ReactNode
  /** Rendered on the server by the layout — see the note there. */
  identity?: React.ReactNode
  avatar?: React.ReactNode
}) {
  const [open, setOpen] = useState(true)

  return (
    // h-svh, not min-h-svh: the window is now exactly one screen and never
    // grows, so the page as a whole cannot scroll. Navbar, sidebar and footer
    // stay put, and whatever needs to scroll does it inside the content row
    // below. overflow-hidden is what enforces that rather than merely asking.
    <div className="flex h-svh overflow-hidden">
      <AppSidebar open={open} onToggle={() => setOpen(false)} identity={identity} />

      {/* No background of its own — the page shows through, which is one less
          colour to keep in sync if the page background ever changes. */}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* The way back in, handed to the navbar so it sits in the row rather
            than floating over the breadcrumb. */}
        <AppNavbar
          avatar={avatar}
          leading={
            !open ? (
              <SidebarTrigger open={false} onToggle={() => setOpen(true)} />
            ) : null
          }
        />

        {/* The scrolling region, and the only one. `min-h-0` is doing real work:
            a flex child defaults to min-height:auto, which lets it grow past its
            parent instead of scrolling inside it — without this the overflow
            rule above simply clips the bottom off long pages.
            A page that wants to own its own scrolling (the user table) sets
            `h-full overflow-hidden` on itself and manages it from there. */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
          {children}
        </div>

        {/* Outside the scrolling region, so it is pinned to the bottom of the
            window rather than sitting at the end of the content. `shrink-0`
            keeps it from being squeezed away when the content is tall.

            The year is hardcoded to match the auth footer. Computing it in this
            client component would differ between the server render and the
            browser at a new year's midnight, which is a hydration error nobody
            would ever reproduce. */}
        <footer className="shrink-0 border-t px-6 py-1.5 text-right text-[0.7rem] text-muted-foreground">
          © 2026 Norden Capital
        </footer>
      </main>
    </div>
  )
}

export { AppShell }
