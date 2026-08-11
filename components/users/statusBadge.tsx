import { CircleCheck, CircleDot, CircleX, Shield, ShieldCheck } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * The small pills in the status and 2FA columns.
 *
 * <p>Icon as well as colour, deliberately. A column of green and amber dots is
 * unreadable to the ~8% of men with a colour vision deficiency, and these are
 * the cells someone scans a list for. The shape carries it too.
 *
 * <p>Not built on `components/ui/badge`: that one fills its background, which at
 * this density turns a table into a wall of colour blocks. These sit on the card
 * surface with only the text and icon coloured, so a full column of them still
 * reads as a table.
 */

/**
 * No fill. The border and background match the surface underneath, and the
 * colour lives entirely in the glyph and the word — which is enough to tell
 * three states apart without the row shouting.
 */
const PILL =
  "inline-flex items-center gap-1 rounded-full border bg-card px-1.5 py-0.5 text-[0.7rem] font-medium whitespace-nowrap"

/**
 * The theme's own colours, at full strength.
 *
 * <p>They were briefly toned down here, on the theory that a dozen stacked down
 * two columns would read as traffic lights. Dropping the filled backgrounds
 * turned out to be the whole fix — with the pills sitting on the card surface,
 * the saturated glyph and word carry without the row shouting.
 */
const TONE = {
  good: "text-success",
  waiting: "text-warning",
  bad: "text-destructive",
  neutral: "text-muted-foreground",
} as const

/** Mirrors the backend's UserStatus enum. */
const STATUS = {
  ACTIVE: { label: "Active", icon: CircleCheck, tone: TONE.good },
  PENDING_VERIFICATION: { label: "Pending", icon: CircleDot, tone: TONE.waiting },
  SUSPENDED: { label: "Suspended", icon: CircleX, tone: TONE.bad },
  // Not one of the three the UI is designed around, but the backend can still
  // send it — accounts are soft-deleted rather than removed. Kept so a real
  // deactivated user renders as a word rather than a raw enum name.
  DEACTIVATED: { label: "Deactivated", icon: CircleX, tone: TONE.neutral },
} as const

type UserStatus = keyof typeof STATUS

function StatusBadge({ status }: { status: string }) {
  // Anything added later shows as itself rather than vanishing, which is what a
  // lookup with no fallback would do.
  const config = STATUS[status as UserStatus] ?? {
    label: status,
    icon: CircleDot,
    tone: TONE.neutral,
  }
  const Icon = config.icon

  return (
    <span className={cn(PILL, config.tone)}>
      <Icon className="size-2.5 shrink-0" aria-hidden />
      {config.label}
    </span>
  )
}

/**
 * Whether the account has a second factor. On or off, nothing in between.
 *
 * <p>"Off" is amber rather than grey: two-factor is mandatory here, so an
 * account without it is not in a neutral state — it is one that can do nothing
 * at all until it enrols, and this list is where an administrator would notice.
 */
function TwoFactorBadge({ enabled }: { enabled: boolean }) {
  const Icon = enabled ? ShieldCheck : Shield

  return (
    <span className={cn(PILL, enabled ? TONE.good : TONE.waiting)}>
      <Icon className="size-2.5 shrink-0" aria-hidden />
      {enabled ? "On" : "Off"}
    </span>
  )
}

export { StatusBadge, TwoFactorBadge }
