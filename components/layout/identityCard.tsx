import { GalleryVerticalEnd } from "lucide-react"

import { LiquidGlassLayers } from "@/components/ui/liquidGlass"
import { Skeleton } from "@/components/ui/skeleton"
import { currentUser } from "@/lib/auth"

/**
 * Identity card at the top of the sidebar. The Liquid Glass treatment and its
 * caveats live in LiquidGlassLayers, which several other surfaces share.
 *
 * <p>An async Server Component, rendered into the client-side shell as a prop
 * from the layout. That keeps the session token on the server — the sidebar
 * itself is client-side for its open/closed state and could not be trusted with
 * it — while still showing the real person rather than the name that was
 * hardcoded here until now.
 */
async function IdentityCard() {
  const user = await currentUser()

  return (
    <Shell>
      <span className="text-xs text-muted-foreground">
        {user ? roleLabel(user.role) : "Signed out"}
      </span>
      {/* truncate: the sidebar is 280px and a work address will overrun it */}
      <span className="truncate text-sm font-medium">
        {user?.email ?? "—"}
      </span>
    </Shell>
  )
}

/**
 * What stands in while the card is loading.
 *
 * <p><b>The heights are the point.</b> Each bar sits inside a box matching the
 * line height of the text it replaces — `h-4` for the 12px role, `h-5` for the
 * 14px email — so the card is exactly as tall either way and nothing below it
 * shifts when the real values arrive. A skeleton that resizes on load is worse
 * than no skeleton: it draws the eye to a jump instead of covering one.
 */
function IdentityCardSkeleton() {
  return (
    <Shell>
      <span className="flex h-4 items-center">
        <Skeleton className="h-2.5 w-16 rounded-sm" />
      </span>
      <span className="flex h-5 items-center">
        <Skeleton className="h-3 w-36 rounded-sm" />
      </span>
    </Shell>
  )
}

/** The frame both states share, so they cannot drift apart. */
function Shell({ children }: { children: React.ReactNode }) {
  return (
    // flex-1 + min-w-0: shares the header row with the sidebar trigger and
    // gives the email something to truncate against.
    <div className="relative min-w-0 flex-1 overflow-hidden rounded-xl border border-white/50 shadow-sm">
      <LiquidGlassLayers />

      {/* relative so it paints above the layers. Sized to sit inside the header
          row: a 32px icon plus p-1.5 lands the card at ~45px. */}
      <div className="relative flex items-center gap-2 p-1.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/60 bg-white/60 shadow-sm">
          <GalleryVerticalEnd className="size-4" aria-hidden />
        </span>

        <div className="flex min-w-0 flex-col leading-tight">{children}</div>
      </div>
    </div>
  )
}

/** ADMIN -> Administrator. Anything unrecognised is shown as it came. */
function roleLabel(role: string) {
  return role === "ADMIN"
    ? "Administrator"
    : role.charAt(0) + role.slice(1).toLowerCase()
}

export { IdentityCard, IdentityCardSkeleton }
