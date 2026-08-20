"use client"

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import {
  PANES_COOKIE,
  PANES_COOKIE_MAX_AGE,
  type PaneLayout,
} from "@/lib/inboxLayout"

/**
 * The two halves of the inbox: the messages on the left, the open one on the
 * right.
 *
 * <p>Two panes rather than the three the reference design has. The third is a
 * folder rail — Inbox, Drafts, Sent, Junk — and this application already has a
 * sidebar doing that job a few pixels to the left. A second column of
 * destinations beside the first is two menus competing to be the place you look.
 *
 * <p><b>The divider is draggable and remembers where it was put.</b> How wide
 * the list should be is a matter of taste that changes by the hour — scanning a
 * long list wants width, reading one message wants the opposite — so it is not a
 * decision to make once on somebody's behalf.
 */

/**
 * Where the split sits before anybody moves it.
 *
 * <p>The list gets the larger share of the two-thirds it used to give away. A
 * message is prose and prose does not want a wide column — past about seventy
 * characters a line, the eye loses its place coming back — so the reading pane
 * stops benefiting from extra width long before the list does. The list keeps
 * spending it: a subject that fits is a subject nobody has to open to identify.
 *
 * <p>Deliberately not the reference design's proportions. shadcn's Mail ships
 * `[20, 32, 48]` across three panes, which without its nav rail renormalises to
 * 40 : 60 — close to this, and tried. This is the one that was kept.
 */
const DEFAULT = { list: 42, reading: 58 }

/**
 * How far the divider may travel, in pixels.
 *
 * <p><b>Two numbers, not four — and that is the whole point.</b> With exactly two
 * panes filling the width, a maximum on one <em>is</em> the minimum on the other:
 * they are the same edge of the same divider. Writing all four would be two facts
 * stated twice, and the day somebody adjusts one of the pair without the other,
 * the two rules contradict and the library resolves it by whichever clamp runs
 * last. So each pane declares only its floor, and each floor is the other's
 * ceiling by arithmetic rather than by agreement.
 *
 * <p><b>Measured, not guessed.</b> Both numbers come from dragging the divider to
 * the narrowest each pane was still worth reading at, on a 1920 window where the
 * panes have 1638px between them, and reading the positions off the result.
 *
 * <p><b>Pixels, not percentages.</b> A list needs a real width to stay readable —
 * a sender, a date and a subject — and 30% of a laptop is not the same thing as
 * 30% of a monitor. The reference design uses 30% here and gets away with it
 * because it is a desktop demo; that same floor is 488px on a 1920 screen and
 * 219px on a 1024 one, and only the first still shows a subject line.
 *
 * <p>⚠️ <b>Together these need 1000px, so this screen needs a window of about
 * 1295px before both can be honoured.</b> Below that the group is asked for more
 * room than it has and the library gives way somewhere — the floors stop being
 * floors, quietly, with nothing on screen to say so. At 1280 it is fifteen pixels
 * short; at 1024, two hundred and seventy.
 *
 * <p>Collapsing the sidebar buys back its 280px and moves the threshold to about
 * 1015px, so a narrow window is workable rather than broken. That is a real
 * mitigation and not an accident, but it is also not something anybody is told —
 * if this screen has to work at 1280, these numbers are what to revisit first.
 */
const MIN = { list: "470px", reading: "530px" }

/** Identifies this group to the layout engine. */
const LAYOUT_ID = "inbox:panes"

/**
 * Written here, read by the page on the server.
 *
 * <p>Plain `document.cookie`. Next forbids cookie writes during a <em>render</em>
 * — that is a rule about the server, and it is why signing in needed a Server
 * Action. It says nothing about the browser, and dragging a divider is about as
 * client-side as an interaction gets.
 *
 * <p>This replaced `localStorage`, which could not be read while the page was
 * rendering on the server: the first HTML always carried the default split and
 * the saved one was applied a moment later, which is exactly the jump the panes
 * made on every reload. A cookie travels with the request, so the server renders
 * the right widths and there is nothing left to correct.
 *
 * <p>`SameSite=Lax` because this is a preference, not a credential. No `Secure`
 * flag: development is plain HTTP and a secure cookie there is simply never
 * stored — the same trap `lib/session.ts` documents for the session cookie.
 */
function remember(layout: PaneLayout) {
  document.cookie = [
    `${PANES_COOKIE}=${encodeURIComponent(JSON.stringify(layout))}`,
    "Path=/",
    `Max-Age=${PANES_COOKIE_MAX_AGE}`,
    "SameSite=Lax",
  ].join("; ")
}

function InboxShell({
  list,
  reading,
  defaultLayout,
}: {
  /** The message list. */
  list: React.ReactNode
  /** Whatever is open, or the empty state when nothing is. */
  reading: React.ReactNode
  /**
   * Where the divider was left, read from the cookie by the page.
   *
   * <p>Undefined on a first visit, which falls back to {@link DEFAULT}. It
   * arrives as a prop rather than being looked up here, and that is the whole
   * fix: a value fetched in the browser is a value that arrives after the first
   * paint, and a layout that arrives after the first paint is a layout you watch
   * being applied.
   */
  defaultLayout?: PaneLayout
}) {
  return (
    <ResizablePanelGroup
      id={LAYOUT_ID}
      orientation="horizontal"
      defaultLayout={defaultLayout}
      // Only what somebody actually dragged. A window resize fires this too, so
      // without the check, plugging a laptop into a monitor would quietly
      // overwrite a split that had been set deliberately.
      onLayoutChanged={(layout, meta) => {
        if (meta.isUserInteraction) remember(layout)
      }}
      className="min-h-0 flex-1"
    >
      {/* No maxSize: the reading pane's floor already is this pane's ceiling. */}
      <ResizablePanel id="list" defaultSize={DEFAULT.list} minSize={MIN.list}>
        {/* min-h-0 so whatever goes in here scrolls inside the pane rather than
            growing it — the same chain the log and the tables use. */}
        <div className="flex h-full min-h-0 flex-col">{list}</div>
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel
        id="reading"
        defaultSize={DEFAULT.reading}
        minSize={MIN.reading}
      >
        <div className="flex h-full min-h-0 flex-col">{reading}</div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}

export { InboxShell }
