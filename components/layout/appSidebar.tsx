"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { ChevronDown, LogOut } from "lucide-react"

import { logout } from "@/app/(app)/actions"
import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { LiquidGlassLayers } from "@/components/ui/liquidGlass"
import { IdentityCard } from "@/components/layout/identityCard"
import {
  isNavItemActive,
  navSections,
  settingsSection,
} from "@/components/layout/navItems"
import { SidebarTrigger } from "@/components/layout/sidebarTrigger"

/**
 * The sidebar for the whole signed-in app, not just the dashboard.
 *
 * Width comes off the reference: a 2157px-wide capture at 1.5x DPI, so a
 * ~1440px window, with the sidebar 420px of it — 280px in CSS pixels, hence
 * w-70. That is 19.4% of the width, matching the ratio measured off the image.
 *
 * It stays mounted and animates its width rather than unmounting: an element
 * removed from the DOM cannot transition, which is why toggling it used to
 * snap. `inert` keeps the clipped-but-present controls out of the tab order and
 * the accessibility tree while it is closed.
 */
/** Shared by plain links and collapsible triggers so the two stay identical. */
const ROW =
  "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors"
// fill-current overrides lucide's own fill="none" — a CSS rule outranks an SVG
// presentation attribute, so there is no need to pass fill through as a prop.
//
// Scoped to the direct first child, not `[&_svg]`: a descendant selector also
// catches the ChevronDown ending a collapsible trigger, and that icon is a
// stroked "v" — filling it renders a solid wedge instead of an arrow. The
// leading icon is the first element in both a plain link and a trigger.
const ROW_ACTIVE =
  "bg-white font-medium text-foreground shadow-sm [&>svg:first-child]:fill-current"
const ROW_IDLE = "text-muted-foreground hover:text-foreground"

/**
 * Thin, square, chrome-less scrollbar.
 *
 * Deliberately the ::-webkit-* pseudo-elements rather than the standard
 * `scrollbar-width` / `scrollbar-color`: those cannot square off the thumb or
 * drop the buttons, and worse, setting either one makes Chrome ignore the
 * webkit rules entirely. So it is one approach or the other, not both — this
 * one buys exact control in Chromium and Safari, and Firefox keeps its default
 * scrollbar.
 */
const SCROLLBAR = [
  "[&::-webkit-scrollbar]:w-1",
  "[&::-webkit-scrollbar-track]:bg-transparent",
  "[&::-webkit-scrollbar-thumb]:rounded-none",
  "[&::-webkit-scrollbar-thumb]:bg-[#D6D5D2]",
  "[&::-webkit-scrollbar-button]:hidden",
].join(" ")

function AppSidebar({
  open,
  onToggle,
}: {
  open: boolean
  onToggle: () => void
}) {
  const pathname = usePathname()

  return (
    <aside
      inert={!open}
      className={cn(
        // sticky + h-svh + self-start pins it to the viewport instead of
        // scrolling with the page. self-start matters: without it the flex
        // parent stretches the aside to the full content height and there is
        // nothing left for sticky to do.
        "sticky top-0 h-svh shrink-0 self-start overflow-hidden bg-[#F3F2F0] transition-[width] duration-300 ease-in-out motion-reduce:transition-none",
        open ? "w-70 border-r border-[#E8E8E5]" : "w-0"
      )}
    >
      {/* Fixed width so the contents are clipped rather than reflowed as the
          aside narrows — laying them out again every frame is what makes this
          kind of animation look broken. */}
      <div className="flex h-full w-70 flex-col">
        {/* items-start, not items-center: the card and the trigger are
            different heights, so centring them left their top edges on
            different lines. pt-3.5 is not arbitrary either — the navbar centres
            the same 28px trigger in its 56px row, putting it 14px down, so
            matching that keeps the trigger from jumping when the sidebar
            opens or closes. */}
        <div className="flex items-start gap-2 px-6 pt-3.5">
          <IdentityCard />
          <SidebarTrigger open onToggle={onToggle} />
        </div>

        {/* Scrolls on its own once the nav outgrows the viewport, so the
            identity card above it stays put. */}
        <nav
          className={cn(
            "flex flex-1 flex-col gap-3 overflow-y-auto px-6 py-4",
            SCROLLBAR
          )}
        >
          {navSections.map((section, index) => (
            <div
              key={section.title}
              className={cn(
                "flex flex-col",
                // The divider stays inside the nav's padding rather than being
                // pulled out with a negative margin, so it stops well short of
                // the sidebar edges. At px-6 that is 24px in each side, and the
                // footer dividers match via mx-6.
                index > 0 && "border-t border-[#E8E8E5] pt-3"
              )}
            >
              <p className="px-2.5 pb-1 text-xs font-medium text-foreground">
                {section.title}
              </p>

              {/* pl-2 sets the items in from the section title rather than
                  flush with it. On the wrapper, not the rows, so collapsible
                  sub-trees shift with their parent. */}
              <div className="flex flex-col gap-0 pl-2">
                {section.items.map((item) => {
                const active = isNavItemActive(item.href, pathname)
                const itemClass = cn(ROW, active ? ROW_ACTIVE : ROW_IDLE)

                if (!item.items) {
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={itemClass}
                    >
                      <item.icon className="size-4 shrink-0" />
                      {item.title}
                    </Link>
                  )
                }

                return (
                  // defaultOpen when a child route is active, so landing on
                  // /assignments/pending does not show a collapsed parent with
                  // nothing visibly selected.
                  <Collapsible key={item.href} defaultOpen={active}>
                    <CollapsibleTrigger className={cn(itemClass, "group")}>
                      <item.icon className="size-4 shrink-0" />
                      {item.title}
                      {/* aria-expanded, not data-open: Base UI's trigger
                          exposes its state through aria-expanded only.
                          Tailwind compiles `data-open` to [data-state=open],
                          a Radix convention that never matches here — the
                          chevron would silently never turn. */}
                      <ChevronDown className="ml-auto size-3.5 shrink-0 transition-transform group-aria-expanded:rotate-180" />
                    </CollapsibleTrigger>

                    {/* Base UI hands the panel its measured height as
                        --collapsible-panel-height and flags the in/out frames
                        with data-starting-style / data-ending-style, so
                        animating height between 0 and that variable is all the
                        smoothing needs. overflow-hidden stops the rows
                        spilling out mid-transition. */}
                    <CollapsibleContent className="h-[var(--collapsible-panel-height)] overflow-hidden transition-[height] duration-200 ease-out data-[ending-style]:h-0 data-[starting-style]:h-0 motion-reduce:transition-none">
                      {/* The tree. The spine is drawn per-row rather than as a
                          border-l on the list: the last row only draws its top
                          half, so the line stops at the final tick instead of
                          running past it. */}
                      <ul className="ml-4 flex flex-col py-1">
                        {item.items.map((sub) => {
                          const subActive = isNavItemActive(sub.href, pathname)

                          return (
                            <li
                              key={sub.href}
                              className="relative before:absolute before:top-0 before:left-0 before:h-full before:w-px before:bg-[#E2E1DE] last:before:h-1/2"
                            >
                              <Link
                                href={sub.href}
                                aria-current={subActive ? "page" : undefined}
                                className={cn(
                                  "relative flex items-center py-1.5 pl-5 text-sm transition-colors",
                                  // the tick joining this row to the spine
                                  "before:absolute before:top-1/2 before:left-0 before:h-px before:w-3 before:bg-[#E2E1DE]",
                                  subActive
                                    ? "font-medium text-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                                )}
                              >
                                {sub.title}
                              </Link>
                            </li>
                          )
                        })}
                      </ul>
                    </CollapsibleContent>
                  </Collapsible>
                )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Outside the nav, so it stays pinned to the bottom however long the
            menu above grows. The border sits on this element rather than an
            inner one so it reaches both edges without the -mx-3 trick. */}
        <div className="mx-6 border-t border-[#E8E8E5] py-4">
          <p className="px-2.5 pb-1 text-xs font-medium text-foreground">
            {settingsSection.title}
          </p>

          <div className="flex flex-col gap-0 pl-2">
            {settingsSection.items.map((item) => {
              const active = isNavItemActive(item.href, pathname)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(ROW, active ? ROW_ACTIVE : ROW_IDLE)}
                >
                  <item.icon className="size-4 shrink-0" />
                  {item.title}
                </Link>
              )
            })}
          </div>
        </div>

        {/* Log out sits in its own block, divided off from Settings — it ends
            the session rather than navigating, so it does not belong in a list
            of links. */}
        <div className="mx-6 border-t border-[#E8E8E5] py-3">
          <div className="pl-2">
            <AlertDialog>
              {/* Not ROW_IDLE: this one goes destructive on hover rather than
                  to foreground, since it ends the session. */}
              <AlertDialogTrigger
                render={
                  <button
                    type="button"
                    className={cn(
                      ROW,
                      "text-muted-foreground hover:text-destructive"
                    )}
                  />
                }
              >
                <LogOut className="size-4 shrink-0" />
                Log out
              </AlertDialogTrigger>

              {/* size="sm" does two jobs: it pins the popup to max-w-xs at
                  every breakpoint instead of widening to max-w-sm, and it keeps
                  the header centred and stacked — the default size switches to
                  icon-beside-text from sm up. */}
              <AlertDialogContent size="sm">
                {/* flex overrides the header's own grid, which would otherwise
                    put the media on its own row. Icon and title share a
                    centred row, description sits under both. */}
                <AlertDialogHeader className="flex flex-col items-center gap-1.5 text-center">
                  <div className="flex items-center gap-2">
                    <AlertDialogMedia className="relative size-8 overflow-hidden bg-destructive/10 text-destructive">
                      <LiquidGlassLayers />
                      {/* Sized explicitly, which also opts out of the media
                          slot's own size-6 default for bare svgs. relative so
                          it paints above the glass layers. */}
                      <LogOut className="relative size-4" />
                    </AlertDialogMedia>
                    <AlertDialogTitle>Log out?</AlertDialogTitle>
                  </div>
                  <AlertDialogDescription>
                    You&apos;ll be signed out on this device and sent back to
                    the sign-in screen.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  {/* A form, not an onClick: the session cookie is httpOnly,
                      so only the server can clear it. `contents` makes the
                      button the footer grid's direct child — a wrapping form
                      would take the cell and leave the button its natural
                      width, so the two would not match. */}
                  <form action={logout} className="contents">
                    <AlertDialogAction type="submit" variant="destructive">
                      Log out
                    </AlertDialogAction>
                  </form>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </aside>
  )
}

export { AppSidebar }
