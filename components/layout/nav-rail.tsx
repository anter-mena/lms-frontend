"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import {
  accountSection,
  findActiveSection,
  navSections,
  type NavSection,
} from "@/components/layout/nav-items"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

function RailLink({
  section,
  active,
}: {
  section: NavSection
  active: boolean
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Link
            href={section.href}
            aria-label={section.title}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex size-9 items-center justify-center rounded-lg transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
            )}
          />
        }
      >
        <section.icon className="size-4.5" />
      </TooltipTrigger>
      {/* The label only exists on hover, so the tooltip is the accessible name's
          visible counterpart — not decoration. */}
      <TooltipContent side="right">{section.title}</TooltipContent>
    </Tooltip>
  )
}

/** Primary navigation: icon-only, one entry per top-level section. */
function NavRail() {
  const pathname = usePathname()
  const activeSection = findActiveSection(pathname)

  return (
    <aside className="sticky top-12 hidden h-[calc(100svh-3rem)] w-14 shrink-0 flex-col items-center gap-1 border-r bg-sidebar py-3 lg:flex">
      <TooltipProvider>
        {navSections.map((section) => (
          <RailLink
            key={section.href}
            section={section}
            active={section.title === activeSection.title}
          />
        ))}

        <div className="mt-auto">
          <RailLink
            section={accountSection}
            active={accountSection.title === activeSection.title}
          />
        </div>
      </TooltipProvider>
    </aside>
  )
}

export { NavRail }
