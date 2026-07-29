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
      className="text-[#ECECEC] hover:text-foreground"
    >
      <PanelLeft className="size-4" />
      {/* The icon is the button's only content, so without this it has no
          accessible name at all — and the name has to track the state. */}
      <span className="sr-only">{open ? "Close sidebar" : "Open sidebar"}</span>
    </Button>
  )
}

export { SidebarTrigger }
