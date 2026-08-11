"use client"

import { Fragment } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell, Inbox } from "lucide-react"

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
function AppNavbar({
  leading,
  avatar,
}: {
  leading?: React.ReactNode
  /** The signed-in user's initials, rendered on the server by the layout. */
  avatar?: React.ReactNode
}) {
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
        {/* Both buttons are deliberately identical — they are peers, and any
            divergence would read as one of them meaning something different. */}
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

        {/* ⚠️ The dot is hardcoded — there is no unread count yet. When one
            exists it should drive both the dot and the label, so the button
            announces "Inbox, unread messages" rather than leaving a screen
            reader with no idea the marker is there. */}
        {/* The dot lives outside the button, not in it. The button clips its
            children to draw the glass, so anything sitting on the corner was
            being cut in half — this wrapper gives it something to hang off
            instead. */}
        <div className="relative">
          <Button
            variant="outline"
            size="icon"
            className="relative overflow-hidden bg-card"
            aria-label="Inbox"
          >
            <LiquidGlassLayers />
            <Inbox className="relative" />
          </Button>

          <span
            aria-hidden
            className="absolute -top-0.5 -right-0.5 flex size-2"
          >
            {/* Two dots stacked: one expanding and fading outward, one solid on
                top. The animated ring alone would spend most of its cycle nearly
                invisible, so the marker would appear to blink out. */}
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-destructive opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-destructive ring-2 ring-background" />
          </span>
        </div>

        {avatar}
      </div>
    </header>
  )
}

export { AppNavbar }
