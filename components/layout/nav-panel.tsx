"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Search } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  findActiveItemHref,
  findActiveSection,
} from "@/components/layout/nav-items"
import { Input } from "@/components/ui/input"

/**
 * Secondary navigation: always present, contents follow whichever section the
 * rail has active. Width never changes, so the content area never reflows.
 */
function NavPanel() {
  const pathname = usePathname()
  const section = findActiveSection(pathname)
  const activeHref = findActiveItemHref(section, pathname)

  return (
    <aside className="sticky top-12 hidden h-[calc(100svh-3rem)] w-56 shrink-0 flex-col gap-4 overflow-y-auto border-r bg-sidebar p-3 lg:flex">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Quick search..."
          className="h-8 bg-background pr-10 pl-7.5 text-sm"
        />
        <kbd className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 font-mono text-xs text-muted-foreground">
          ⌘K
        </kbd>
      </div>

      <div className="flex flex-col gap-1">
        <h2 className="px-2 pb-1 font-heading text-sm font-semibold tracking-tight">
          {section.title}
        </h2>

        <nav className="flex flex-col gap-0.5">
          {section.items.map((item) => {
            const active = item.href === activeHref
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-md px-2 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                )}
              >
                {item.title}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}

export { NavPanel }
