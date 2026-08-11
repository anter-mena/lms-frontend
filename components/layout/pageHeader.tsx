import Link from "next/link"
import { ChevronLeft } from "lucide-react"

import { Button } from "@/components/ui/button"

/**
 * The title block every screen in the app opens with.
 *
 * <p>One component rather than the same eight lines on each page. It exists
 * because the back button on the add-user screen was resized three times, and
 * each of those was a change to one page that the page next door quietly did not
 * get. Now there is one place to change.
 *
 * <p>The actions sit in the same row as the title rather than under it. That row
 * is otherwise empty to the right, and a Create button on its own line pushes the
 * content it belongs to a whole row further down the screen.
 */
function PageHeader({
  title,
  description,
  backHref,
  backLabel,
  actions,
}: {
  title: string
  /** Sits under the title. A node rather than a string so a page can set it in
   *  mono, or say something with a link in it. */
  description?: React.ReactNode
  /** Where the chevron goes. Omitted on top-level screens, which have no "up". */
  backHref?: string
  /** Named for screen readers, since the button itself is only a chevron. */
  backLabel?: string
  /** Buttons for the far right of the title row. */
  actions?: React.ReactNode
}) {
  return (
    // shrink-0 because one caller puts this above a table that scrolls on its
    // own: without it the flex parent takes the header's height first.
    <div className="flex shrink-0 flex-wrap items-start justify-between gap-3">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          {backHref && (
            // A chevron, not an arrow: it points back to where you came from,
            // which is a shorter journey than an arrow implies. And beside the
            // title rather than on its own line above it — a labelled "Back to
            // users" link was a second heading competing with the real one.
            //
            // Below the smallest preset, so the box is set by hand. `after`
            // stretches the clickable area back out past the border on every
            // side — the square you see is 20px, the square you can hit is
            // 32px, which is what keeps a control this small from being fiddly
            // to actually click.
            <Button
              variant="outline"
              size="icon-xs"
              className="relative size-5 rounded-md bg-card after:absolute after:-inset-1.5 [&_svg]:size-3"
              aria-label={backLabel ?? "Go back"}
              render={<Link href={backHref} />}
            >
              <ChevronLeft />
            </Button>
          )}

          <h1 className="font-heading text-lg font-semibold tracking-tight">
            {title}
          </h1>
        </div>

        {description && (
          <div className="text-xs text-muted-foreground">{description}</div>
        )}
      </div>

      {actions}
    </div>
  )
}

export { PageHeader }
