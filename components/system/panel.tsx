import { Hint } from "@/components/ui/hint"
import { cn } from "@/lib/utils"

/**
 * The nested card every block on this page sits in.
 *
 * <p>The same two-layer shape the rest of the app uses: a grey shell carrying the
 * heading, a white card holding the content. The reference design used flat white
 * cards with the title inside them — which reads fine on its own, and would read
 * as a foreign page dropped into this one.
 */
function Panel({
  title,
  hint,
  action,
  footer,
  className,
  bodyClassName,
  children,
}: {
  title: string
  /** What this panel measures and how. Rendered as an icon beside the title. */
  hint?: React.ReactNode
  /** Sits at the right of the heading row — a filter, a count, a link. */
  action?: React.ReactNode
  /**
   * A strip under the card, on the tinted shell rather than inside the panel.
   *
   * <p>For chrome that belongs to the content without being part of it — paging,
   * so far. On the shell deliberately, mirroring the heading row above: both
   * frame the card rather than sitting in it, and being outside the body keeps
   * them still while the content scrolls.
   */
  footer?: React.ReactNode
  className?: string
  bodyClassName?: string
  children: React.ReactNode
}) {
  return (
    <section
      // min-h-0 so a panel told to fill can also be told to shrink. A flex
      // child's minimum is its own content by default, so without it `flex-1`
      // only ever grows — and anything inside that wants to scroll never
      // receives a bounded height to scroll within.
      className={cn(
        "flex min-h-0 flex-col rounded-md border bg-muted/40 p-0.5",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3 px-3 py-2">
        <h2 className="flex items-center gap-1.5 font-mono text-[0.7rem] font-medium tracking-wider text-muted-foreground uppercase">
          {title}
          {hint && <Hint>{hint}</Hint>}
        </h2>
        {action}
      </div>

      <div
        className={cn(
          // overflow-hidden here is the other half: the scrolling region has to
          // sit inside something that clips, or the content pushes this card out
          // instead of moving within it. Same shape as the users table.
          "flex min-h-0 flex-1 flex-col overflow-hidden rounded-sm border bg-card p-4",
          bodyClassName
        )}
      >
        {children}
      </div>

      {footer}
    </section>
  )
}

export { Panel }
