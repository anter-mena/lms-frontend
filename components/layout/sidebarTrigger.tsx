"use client"

import { PanelLeft } from "lucide-react"

import { Button } from "@/components/ui/button"

/**
 * Shared by the sidebar and the navbar — it moves between them as the sidebar
 * opens and closes, so it lives on its own rather than inside either.
 */
function SidebarTrigger({
  open,
  onToggle,
}: {
  open: boolean
  onToggle: () => void
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={onToggle}
      aria-expanded={open}
      // #ECECEC before — the sidebar's border colour, pasted into the text slot.
      // At that value the icon was near-invisible in both homes: barely off white
      // in the navbar, barely off #F3F2F0 in the sidebar. It looked like two
      // different colours because it was equally faint against two different
      // backgrounds, which is not the same as matching them.
      //
      // A token instead of a literal, so it stays legible on either surface and
      // moves with the theme rather than being pinned to one background.
      className="text-muted-foreground hover:text-foreground"
    >
      <PanelLeft className="size-4" />
      {/* The icon is the button's only content, so without this it has no
          accessible name at all — and the name has to track the state. */}
      <span className="sr-only">{open ? "Close sidebar" : "Open sidebar"}</span>
    </Button>
  )
}

export { SidebarTrigger }
