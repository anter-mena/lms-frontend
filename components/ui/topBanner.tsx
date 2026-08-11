"use client"

import { useState } from "react"
import { Info, X } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * A notice about the page as a whole, pinned to the top of the window.
 *
 * <p>Two shapes, one element:
 *
 * <ul>
 *   <li><b>Mobile</b> — a quiet panel in the flow of the column, which is where
 *       a narrow screen has room for it.</li>
 *   <li><b>Desktop</b> — a full-width bar across the top of the window. It is
 *       {@code fixed}, so it leaves the flex flow and the parent's gap stops
 *       counting it: everything below sits in exactly the same place whether the
 *       message is there or not. A notice should never move the field somebody
 *       was about to type into.</li>
 * </ul>
 *
 * <p>The close button sits <em>beside</em> the text rather than out at the far
 * edge. On a wide screen the two would otherwise be a foot apart, and a control
 * that far from what it acts on reads as belonging to the page rather than to
 * the message.
 *
 * <p>Client-side only because of that button — dismissing is a local decision
 * that never needs to reach the server. There is nothing to remember either:
 * both callers show this because of a state the page is currently in, so the
 * next arrival in that state should get it again.
 *
 * <p>⚠️ Inside the signed-in shell this lands on top of the navbar, which is
 * {@code sticky top-0 z-10}. That is the price of a banner that spans the whole
 * window rather than the content column.
 */
function TopBanner({ message }: { message: string }) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div
      role="status"
      // Stated rather than left to the implicit role default, which screen
      // readers have historically disagreed about.
      aria-live="polite"
      className={cn(
        "flex items-start gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground",
        // The bar. Inverted rather than tinted: this palette is monochrome, so
        // primary/primary-foreground is what "prominent" means here.
        "md:fixed md:inset-x-0 md:top-0 md:z-50 md:justify-center md:rounded-none md:border-0",
        "md:bg-primary md:px-4 md:py-2.5 md:text-primary-foreground md:shadow-sm",
        "animate-in fade-in-0 slide-in-from-top-2 duration-300"
      )}
    >
      {/* Grouped so the whole thing centres as one unit on the bar, which is
          what keeps the close button next to the words. */}
      <div className="flex items-start gap-2 md:items-center">
        <Info className="mt-0.5 size-4 shrink-0 md:mt-0" aria-hidden />
        <span>{message}</span>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss this message"
          className={cn(
            "ml-1 shrink-0 rounded-sm opacity-70 transition-opacity outline-none",
            "hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring/50",
            "md:ml-2"
          )}
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}

export { TopBanner }
