"use client"

import { Fragment } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { LiquidGlassLayers } from "@/components/ui/liquidGlass"

/** "forgot-password" -> "forgot password". Capitalising is left to CSS. */
function labelFor(segment: string) {
  return segment.replace(/-/g, " ")
}

/**
 * Sits at the top of the content area, not across the sidebar — matching the
 * reference, where the sidebar runs full height beside it.
 *
 * `leading` is where the shell puts the sidebar trigger once the sidebar is
 * closed. It lives here rather than floating over the content so it cannot
 * overlap the breadcrumb.
 */
function AppNavbar({ leading }: { leading?: React.ReactNode }) {
  // Derived, not hardcoded: this navbar is part of the shell, so it renders on
  // /profile as well as /dashboard, and a fixed "Dashboard" crumb would lie.
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  return (
    // bg-background is load-bearing now it is sticky: without a background the
    // content would scroll visibly through it.
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b border-[#ECECEC] bg-background px-4">
      {leading}

      <Breadcrumb>
        <BreadcrumbList>
          {segments.map((segment, index) => {
            const isLast = index === segments.length - 1
            const href = `/${segments.slice(0, index + 1).join("/")}`

            return (
              <Fragment key={href}>
                {index > 0 ? <BreadcrumbSeparator /> : null}
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage className="capitalize">
                      {labelFor(segment)}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      className="capitalize"
                      render={<Link href={href} />}
                    >
                      {labelFor(segment)}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </Fragment>
            )
          })}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="relative overflow-hidden bg-card"
          aria-label="Notifications"
        >
          <LiquidGlassLayers />
          {/* relative so the icon paints above the glass layers */}
          <Bell className="relative" />
        </Button>

        {/* Squared off rather than a circle. rounded has to be overridden in
            three places — the component hardcodes rounded-full on the root, on
            its ::after ring, and on the fallback. */}
        <Avatar className="rounded-lg after:rounded-lg">
          <AvatarFallback className="rounded-lg">NC</AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}

export { AppNavbar }
