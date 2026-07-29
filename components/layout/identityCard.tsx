import { GalleryVerticalEnd } from "lucide-react"

import { LiquidGlassLayers } from "@/components/ui/liquidGlass"

/**
 * Identity card at the top of the sidebar. The Liquid Glass treatment and its
 * caveats live in LiquidGlassLayers, which several other surfaces share.
 */
function IdentityCard() {
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

        <div className="flex min-w-0 flex-col leading-tight">
          <span className="text-xs text-muted-foreground">Administrator</span>
          {/* truncate: the sidebar is 280px and a work address will overrun it */}
          <span className="truncate text-sm font-medium">
            sarah.amrani@nordencapital.com
          </span>
        </div>
      </div>
    </div>
  )
}

export { IdentityCard }
