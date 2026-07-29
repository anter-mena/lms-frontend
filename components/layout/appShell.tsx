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
function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(true)

  return (
    <div className="flex min-h-svh">
      <AppSidebar open={open} onToggle={() => setOpen(false)} />

      {/* No background of its own — the page shows through, which is one less
          colour to keep in sync if the page background ever changes. */}
      <main className="flex min-w-0 flex-1 flex-col">
        {/* The way back in, handed to the navbar so it sits in the row rather
            than floating over the breadcrumb. */}
        <AppNavbar
          leading={
            !open ? (
              <SidebarTrigger open={false} onToggle={() => setOpen(true)} />
            ) : null
          }
        />
        {children}
      </main>
    </div>
  )
}

export { AppShell }
