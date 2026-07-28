import Link from "next/link"
import { Bell, GraduationCap, LifeBuoy } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

/**
 * Spans the full viewport width and sits above the sidebar, so the brand and
 * account controls stay in one place regardless of what the sidebar is doing.
 */
function Navbar() {
  return (
    <header className="sticky top-0 z-50 flex h-12 shrink-0 items-center gap-2 border-b bg-background px-3">
      <Link href="/dashboard" className="flex items-center gap-2">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <GraduationCap className="size-3.5" />
        </span>
        <span className="font-heading text-sm font-semibold tracking-tight">
          Lumen
        </span>
      </Link>

      <span className="truncate text-sm text-muted-foreground">
        sarah.amrani@lumen.com
      </span>

      <div className="ml-auto flex items-center gap-1">
        <Button variant="ghost" size="sm" render={<Link href="/support" />}>
          <LifeBuoy data-icon="inline-start" />
          Support
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="Notifications">
          <Bell />
        </Button>
        <Link
          href="/profile"
          aria-label="Account"
          className="ml-1 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Avatar size="sm">
            <AvatarFallback>SA</AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  )
}

export { Navbar }
