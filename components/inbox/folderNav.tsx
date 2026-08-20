"use client"

import { useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  AlertCircle,
  Archive,
  ArchiveX,
  ChevronLeft,
  ChevronRight,
  File,
  Inbox,
  MessageSquare,
  Send,
  ShoppingCart,
  Trash2,
  Users,
  type LucideIcon,
} from "lucide-react"

import { NewMark } from "@/components/layout/newMark"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { count } from "@/lib/format"
import { THIN_SCROLLBAR } from "@/lib/scrollbar"
import type { MailFolder } from "@/lib/mailTypes"
import { cn } from "@/lib/utils"

/**
 * The folders, along the navbar instead of down a sidebar.
 *
 * <p>There is no mail sidebar: this application already has one, and a second
 * column of destinations beside the first is two menus competing to be the place
 * you look. Laying the same list along the top costs the labels their vertical
 * rhythm and buys back the width the reading pane wanted.
 *
 * <p><b>Names are never drawn.</b> Six labels do not fit across a pane that is
 * four hundred and seventy pixels at its narrowest, and a nav that wraps to two
 * rows is a sidebar lying down. Every folder is an icon; its name and its count
 * live in the tooltip and in the button's own label.
 *
 * <p><b>Collapsing hides the other five.</b> Open, the row is six icons.
 * Collapsed, it is the folder you are in and the arrow to get the rest back —
 * the state that matters on a narrow pane, because the one folder worth showing
 * is the one being read.
 */

/**
 * Icon names arrive as strings and are resolved here.
 *
 * <p>The folders come from the data layer, and a component is not something that
 * survives being sent from a server to a browser — it has to be looked up on the
 * side that draws it. Same reason the sidebar's own nav keeps its icons in
 * TypeScript rather than in the database.
 */
const ICONS: Record<string, LucideIcon> = {
  inbox: Inbox,
  file: File,
  send: Send,
  "archive-x": ArchiveX,
  trash: Trash2,
  archive: Archive,
  users: Users,
  "alert-circle": AlertCircle,
  "message-square": MessageSquare,
  "shopping-cart": ShoppingCart,
}

function FolderNav({
  folders,
  selectedId,
}: {
  folders: MailFolder[]
  selectedId: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  /**
   * Collapsed shows the current folder alone.
   *
   * <p>Not remembered between visits, deliberately — unlike the pane divider,
   * which is a considered preference. Arriving with every folder visible is the
   * honest default: a nav that starts collapsed hides the fact that there are
   * ten more.
   */
  const [collapsed, setCollapsed] = useState(false)

  function open(id: string) {
    const next = new URLSearchParams(params.toString())
    next.set("folder", id)
    // The open message lives in a folder; carrying it into a different one
    // would show a message the list does not contain.
    next.delete("mail")

    router.push(`${pathname}?${next.toString()}`, { scroll: false })
  }

  // The rule between mail being dealt with and mail finished with.
  const system = folders.filter((folder) => folder.group === "working")
  const categories = folders.filter((folder) => folder.group === "aside")
  const current = folders.find((folder) => folder.id === selectedId)

  return (
    <div className="flex min-w-0 items-center gap-1 py-1">
      {collapsed
        ? // Just where you are. Everything else is one click away, and on a pane
          // this narrow the alternative is a row that scrolls sideways — which
          // hides folders just as thoroughly while pretending not to.
          current && (
            <FolderButton
              folder={current}
              selected
              onOpen={() => open(current.id)}
            />
          )
        : (
          <div
            className={cn(
              // ⚠️ py-1 is not spacing, it is headroom. The unread marks sit at
              // `-top-0.5`, outside their button — and setting overflow on one
              // axis makes the other clip too, so the row was shaving the top off
              // every dot it was drawing. The same CSS rule that cropped the
              // hovered squares on the backups calendar.
              "flex min-w-0 items-center gap-0.5 overflow-x-auto py-1",
              THIN_SCROLLBAR
            )}
          >
            {system.map((folder) => (
              <FolderButton
                key={folder.id}
                folder={folder}
                selected={folder.id === selectedId}
                onOpen={() => open(folder.id)}
              />
            ))}

            <Separator
              orientation="vertical"
              className="mx-1 data-vertical:h-5 data-vertical:self-center"
            />

            {categories.map((folder) => (
              <FolderButton
                key={folder.id}
                folder={folder}
                selected={folder.id === selectedId}
                onOpen={() => open(folder.id)}
              />
            ))}
          </div>
        )}

      <Button
        variant="ghost"
        size="icon-sm"
        className="size-8 shrink-0"
        onClick={() => setCollapsed((open) => !open)}
        aria-label={collapsed ? "Show all folders" : "Show only this folder"}
        aria-expanded={!collapsed}
      >
        {collapsed ? <ChevronRight /> : <ChevronLeft />}
      </Button>
    </div>
  )
}

function FolderButton({
  folder,
  selected,
  onOpen,
}: {
  folder: MailFolder
  selected: boolean
  onOpen: () => void
}) {
  const Icon = ICONS[folder.icon] ?? Inbox
  const hasNew = folder.unread > 0

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            onClick={onOpen}
            aria-current={selected ? "page" : undefined}
            // The label the icon does not carry. A tooltip is not a label — it
            // opens on hover, which is nothing at all to a screen reader or to
            // anybody on a touchscreen.
            aria-label={
              hasNew
                ? `${folder.label}, ${count(folder.unread)} unread`
                : folder.label
            }
            className={cn(
              "relative flex size-8 shrink-0 items-center justify-center rounded-md transition-colors",
              selected
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          />
        }
      >
        <Icon className="size-4 shrink-0" />

        {/* The count has nowhere to go without a label, so the mark takes its
            place — the same pulsing dot the navbar's inbox button uses. Two
            places saying "there is something new" should not say it two
            different ways. */}
        {hasNew && <NewMark className="-top-0.5 -right-0.5" />}
      </TooltipTrigger>

      <TooltipContent>
        {folder.label}
        {hasNew && ` · ${count(folder.unread)} unread`}
      </TooltipContent>
    </Tooltip>
  )
}

export { FolderNav }
