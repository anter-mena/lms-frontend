"use client"

import { Info } from "lucide-react"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

/**
 * What a field means, and how it is worked out.
 *
 * <p>Two shapes for two densities. {@link Hint} is a small icon beside a heading;
 * {@link HintedLabel} turns the label itself into the trigger, for lists where a
 * column of icons would be noisier than the numbers beside them.
 *
 * <p>Both are real buttons, not bare icons or spans. A tooltip that only opens on
 * hover cannot be reached by keyboard and does not exist on a phone — which
 * matters more here than usual, because the explanation is the entire point. A
 * definition nobody can open is a definition nobody has.
 */

/**
 * Prose, not a row of chips.
 *
 * <p>`TooltipContent` is `inline-flex items-center gap-1.5` by default — built
 * for a short label beside an icon or a keyboard shortcut. Under flex layout
 * every child becomes an item, and that includes each run of text either side of
 * an inline `<span>`: a sentence with one styled word in it gets laid out as
 * three columns, wrapping inside each. `block` puts it back to ordinary text
 * flow, which is what these are.
 */
const PROSE = "block max-w-[16rem] text-left leading-snug"

function Hint({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label="What is this?"
            className={cn(
              "text-muted-foreground transition-colors hover:text-foreground",
              "rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              className
            )}
          />
        }
      >
        <Info className="size-3.5" />
      </TooltipTrigger>
      <TooltipContent className={PROSE}>{children}</TooltipContent>
    </Tooltip>
  )
}

/**
 * The label is the trigger.
 *
 * <p>A dotted underline rather than an icon — the convention for "there is more
 * here" in running text, and it costs no horizontal space in a row that already
 * has a number fighting for the other end.
 */
function HintedLabel({
  label,
  children,
  className,
}: {
  label: React.ReactNode
  /** The explanation. */
  children: React.ReactNode
  className?: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            className={cn(
              "cursor-help decoration-dotted underline-offset-4 transition-colors",
              "underline hover:text-foreground",
              "rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              className
            )}
          />
        }
      >
        {label}
      </TooltipTrigger>
      <TooltipContent className={PROSE}>{children}</TooltipContent>
    </Tooltip>
  )
}

export { Hint, HintedLabel }
