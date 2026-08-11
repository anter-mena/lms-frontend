"use client"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

/**
 * Text cut off by its column, with the whole of it a hover away.
 *
 * <p>For values that are long, unpredictable and worth reading exactly — an
 * email address in a 280px column being the case this was written for. Wrapping
 * it instead would push everything below it down by a line, and shortening it in
 * the data would lose the part that identifies the person.
 *
 * <p><b>Focusable on purpose.</b> A tooltip attached to a plain `span` only
 * exists for a mouse: it cannot be reached by keyboard and never appears for
 * anyone using a screen reader. `tabIndex={0}` puts it in the tab order, and the
 * trigger's own ARIA wiring does the rest.
 *
 * <p>The tooltip shows whether or not the text is actually clipped. Measuring
 * that means reading layout after paint on every resize, and the cost of being
 * wrong is a tooltip repeating a line already fully visible — which is a
 * smaller problem than the one it solves.
 */
function TruncatedText({
  children,
  className,
}: {
  children: string
  className?: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            tabIndex={0}
            className={cn(
              "min-w-0 truncate rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              className
            )}
          />
        }
      >
        {children}
      </TooltipTrigger>

      {/* break-all rather than the popup's own wrapping: an email has no spaces
          to break at, so it would otherwise sit on one line and run off the
          side of a narrow window. */}
      <TooltipContent className="break-all">{children}</TooltipContent>
    </Tooltip>
  )
}

export { TruncatedText }
