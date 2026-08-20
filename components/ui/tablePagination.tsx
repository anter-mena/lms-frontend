"use client"

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { pageNumbers } from "@/lib/pagination"
import { cn } from "@/lib/utils"

/**
 * The page controls, for every table that has them.
 *
 * <p>One component rather than one per table. `pageNumbers` was already shared;
 * the buttons around it were not, so the user list and the backup log each held
 * their own copy of the same markup — identical the day they were written and
 * one edit away from drifting. Adding the jump-to-end buttons to both was the
 * moment that stopped being theoretical.
 *
 * <p>Client-side because these are buttons. What a click <em>means</em> is the
 * caller's business: both tables write the page into the address bar and let the
 * server answer, but nothing here assumes that.
 */
function TablePagination({
  page,
  totalPages,
  onPage,
  className,
}: {
  /** 1-based. */
  page: number
  totalPages: number
  onPage: (page: number) => void
  className?: string
}) {
  const first = page <= 1
  const last = page >= totalPages

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {/* Double chevrons for the ends, single for a step. The pairing is the
          only thing telling them apart at this size — four arrows in a row are
          otherwise four identical smudges — so the shapes have to carry it. */}
      <Button
        variant="outline"
        size="icon-xs"
        className="rounded-md bg-card"
        disabled={first}
        onClick={() => onPage(1)}
        aria-label="First page"
      >
        <ChevronsLeft />
      </Button>

      <Button
        variant="outline"
        size="icon-xs"
        className="rounded-md bg-card"
        disabled={first}
        onClick={() => onPage(page - 1)}
        aria-label="Previous page"
      >
        <ChevronLeft />
      </Button>

      {pageNumbers(page, totalPages).map((entry, i) =>
        entry === "gap" ? (
          // Not a button: there is no single page it would take you to.
          <span key={`gap-${i}`} className="px-0.5 text-muted-foreground">
            …
          </span>
        ) : (
          <Button
            key={entry}
            variant={entry === page ? "default" : "outline"}
            size="icon-xs"
            className={cn("rounded-md tabular-nums", entry !== page && "bg-card")}
            onClick={() => onPage(entry)}
            aria-label={`Page ${entry}`}
            aria-current={entry === page ? "page" : undefined}
          >
            {entry}
          </Button>
        )
      )}

      <Button
        variant="outline"
        size="icon-xs"
        className="rounded-md bg-card"
        disabled={last}
        onClick={() => onPage(page + 1)}
        aria-label="Next page"
      >
        <ChevronRight />
      </Button>

      <Button
        variant="outline"
        size="icon-xs"
        className="rounded-md bg-card"
        disabled={last}
        onClick={() => onPage(totalPages)}
        aria-label="Last page"
      >
        <ChevronsRight />
      </Button>
    </div>
  )
}

export { TablePagination }
