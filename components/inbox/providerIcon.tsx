import { Mail } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Whose mail service a mailbox is on.
 *
 * <p>Not derived from the address, deliberately. A domain says nothing about who
 * hosts it: `admin@nordencapital.com` is as likely to be on Google Workspace as
 * anywhere else, and guessing from the suffix would put the wrong mark beside
 * most business mailboxes. The account carries it as a fact.
 *
 * <p>⚠️ <b>Outlook and Yahoo are missing, and not by choice.</b> Both were
 * removed from Simple Icons — the source these marks come from — under its
 * trademark policy, so there is no freely-licensed path to use. They fall back
 * to the plain envelope until somebody supplies the official assets, which is
 * a licensing question rather than a drawing one.
 */

/**
 * Paths from Simple Icons (CC0), with their brand colours.
 *
 * <p>Single-path marks on a 24×24 grid, so each is one element tinted by its own
 * fill. Kept as data rather than components: a record is cheaper to extend than
 * a switch, and the fallback below is then the only branch.
 */
const MARKS: Record<string, { color: string; path: string }> = {
  gmail: {
    color: "#EA4335",
    path: "M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z",
  },
  icloud: {
    color: "#3693F3",
    path: "M13.762 4.29a6.51 6.51 0 0 0-5.669 3.332 3.571 3.571 0 0 0-1.558-.36 3.571 3.571 0 0 0-3.516 3A4.918 4.918 0 0 0 0 14.796a4.918 4.918 0 0 0 4.92 4.914 4.93 4.93 0 0 0 .617-.045h14.42c2.305-.272 4.041-2.258 4.043-4.589v-.009a4.594 4.594 0 0 0-3.727-4.508 6.51 6.51 0 0 0-6.511-6.27z",
  },
  proton: {
    color: "#6D4AFF",
    path: "m15.24 8.998 3.656-3.073v15.81H2.482C1.11 21.735 0 20.609 0 19.223V6.944l7.58 6.38a2.186 2.186 0 0 0 2.871-.042l4.792-4.284h-.003zm-5.456 3.538 1.809-1.616a2.438 2.438 0 0 1-1.178-.533L.905 2.395A.552.552 0 0 0 0 2.826v2.811l8.226 6.923a1.186 1.186 0 0 0 1.558-.024zM23.871 2.463a.551.551 0 0 0-.776-.068l-3.199 2.688v16.653h1.623c1.371 0 2.481-1.127 2.481-2.513V2.824a.551.551 0 0 0-.129-.36z",
  },
}

function ProviderIcon({
  provider,
  className,
}: {
  provider: string
  className?: string
}) {
  const mark = MARKS[provider]

  // The envelope, for a provider with no mark of its own. It inherits the
  // surrounding colour rather than carrying one, which is what keeps it from
  // competing with the three that do.
  if (!mark) {
    return (
      <Mail className={cn("size-4 shrink-0 text-muted-foreground", className)} />
    )
  }

  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("size-4 shrink-0", className)}
      fill={mark.color}
      role="img"
      aria-hidden
    >
      <path d={mark.path} />
    </svg>
  )
}

export { ProviderIcon }
