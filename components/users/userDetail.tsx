"use client"

import { Fragment } from "react"
import {
  CalendarDays,
  Check,
  FileDown,
  FilePen,
  FilePlus,
  KeyRound,
  LogIn,
  Mail,
  MailCheck,
  Minus,
  Phone,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react"

import { initialsOf } from "@/lib/initials"
import { UserQuickActions } from "@/components/users/userQuickActions"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { TruncatedText } from "@/components/ui/truncatedText"
import { useAccess } from "@/components/access/accessProvider"
import type { UserDetail as UserAccount } from "@/lib/userTypes"
import { THIN_SCROLLBAR } from "@/lib/scrollbar"
import { cn } from "@/lib/utils"

/**
 * One account, in full.
 *
 * <p>Two columns. The left is who this is — the facts that identify the person
 * and never change while you are reading. The right is what the account
 * <em>does</em>: its permissions, and what has happened to it. That split is the
 * whole idea behind the layout: the identity stays put as a reference while the
 * side you are actually working in fills the rest of the screen.
 *
 * <p>⚠️ <b>Nothing here is real yet.</b> `GET /api/users/{id}` does not exist —
 * the backend only lists everyone — so the page is fed a placeholder. Worse,
 * `UserResponse` does not carry four of the fields this screen shows: the entity
 * stores `createdAt`, `lastLoginAt`, `emailVerifiedAt` and `mfaConfirmedAt`, and
 * none of them are exposed. Building this for real means adding the endpoint and
 * widening that record.
 */

/**
 * One thing this account did.
 *
 * <p>⚠️ <b>There is no audit table.</b> Nothing in the schema records an action
 * against the person who took it — the closest the database gets is
 * `users.last_login_at`, a single timestamp that each sign-in overwrites. So this
 * type describes a log the system cannot produce yet, and the page is fed
 * invented rows.
 *
 * <p>Building it for real is a table, not an endpoint: actor, action, subject,
 * timestamp, written on every state-changing request. Recorded as #21 on the bug
 * list.
 */
type ActivityEntry = {
  /** What they did, in the past tense: "Signed in", "Exported". */
  action: string
  /** What they did it to. Left out for actions with no object, like signing in. */
  subject?: string
  /** ISO 8601. */
  at: string
  /** Picks the glyph. Adding a kind here and nowhere else falls back to a dot. */
  kind: "signIn" | "create" | "update" | "delete" | "export" | "security"
}

/**
 * A glyph per kind of action, so a long log can be skimmed by shape.
 *
 * <p>Deleting is the one worth spotting from across the room, so it is also the
 * only one that carries colour.
 */
const ACTIVITY_ICON = {
  signIn: { icon: LogIn, tone: "text-muted-foreground" },
  create: { icon: FilePlus, tone: "text-muted-foreground" },
  update: { icon: FilePen, tone: "text-muted-foreground" },
  delete: { icon: Trash2, tone: "text-destructive" },
  export: { icon: FileDown, tone: "text-muted-foreground" },
  security: { icon: ShieldCheck, tone: "text-muted-foreground" },
} as const

/**
 * The backend's `UserStatus` enum in words, and the colour that goes with it.
 *
 * <p>The pill is gone but the colour is not. Those are two separate jobs: the
 * badge's shape was there to pick one row out of twelve in a table, which this
 * page has no need of — but green-for-active and red-for-suspended is how the
 * state is read at a glance, and it costs nothing on a bare word.
 *
 * <p>Tones match `statusBadge.tsx` exactly, so the same account does not look
 * amber in the table and grey here. Anything unrecognised falls through to the
 * raw name rather than vanishing.
 */
const STATUS_TEXT: Record<string, { label: string; tone: string }> = {
  ACTIVE: { label: "Active", tone: "text-success" },
  PENDING_VERIFICATION: {
    label: "Pending verification",
    tone: "text-warning",
  },
  SUSPENDED: { label: "Suspended", tone: "text-destructive" },
  DEACTIVATED: { label: "Deactivated", tone: "text-muted-foreground" },
}

/**
 * Day-month-year with the month as a word.
 *
 * <p>Fixed to `en-GB` rather than left to the visitor's locale: this renders on
 * the server, and a component that formats differently in Rabat and in New York
 * produces markup the browser then disagrees with. Spelling the month out also
 * removes the 05/06 ambiguity that a numeric format leaves behind.
 */
const DAY = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
})

const DAY_TIME = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})

function formatDay(value: string | null) {
  return value ? DAY.format(new Date(value)) : null
}

function formatDayTime(value: string | null) {
  return value ? DAY_TIME.format(new Date(value)) : null
}

/**
 * One labelled fact in the left column.
 *
 * <p>Icon, label, value on a single line. The label carries the muted colour and
 * the value the weight, so a column of these reads as a list of answers rather
 * than a list of questions.
 */
function Fact({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
      <span className="shrink-0 text-muted-foreground">{label}:</span>
      <span className="min-w-0 truncate font-medium">{children}</span>
    </div>
  )
}

/** A titled group of facts, divided from the one above it. */
function FactGroup({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2 border-t pt-3 first:border-t-0 first:pt-0">
      <h2 className="text-sm font-semibold">{title}</h2>
      <div className="flex flex-col gap-1.5">{children}</div>
    </div>
  )
}

/** Stands in for a value the API does not send yet, or the account never had. */
function Unknown({ children = "Not recorded" }: { children?: string }) {
  return <span className="font-normal text-muted-foreground">{children}</span>
}

/** A titled block in the right-hand column. */
function Panel({
  title,
  action,
  className,
  children,
}: {
  title: string
  action?: React.ReactNode
  /** For the panel that fills the leftover height rather than its content. */
  className?: string
  children: React.ReactNode
}) {
  return (
    <section className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-base font-semibold tracking-tight">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function UserDetail({
  user,
  activity,
}: {
  user: UserAccount
  /**
   * ⚠️ Always absent today. Nothing records what an account did — see
   * {@link ActivityEntry} — so the panel says so rather than showing an empty
   * list, which would read as "this person has done nothing".
   */
  activity?: ActivityEntry[]
}) {
  const access = useAccess()
  const { actionColumns: ACTION_COLUMNS, groups: RESOURCE_GROUPS } = access

  const held = new Set(user.permissions)
  const status = STATUS_TEXT[user.status] ?? {
    label: user.status,
    tone: "text-muted-foreground",
  }

  return (
    // One column until lg, where the divider and the side-by-side split start to
    // make sense. Below that a 280px column beside a table is two cramped
    // columns instead of one readable one.
    <div className="flex min-h-0 flex-1 flex-col gap-8 lg:flex-row lg:gap-0">
      <aside
        className={cn(
          // min-h-0 + auto is a safety net, not a feature: on a normal window
          // this column fits and shows no bar at all. On a short one it scrolls
          // rather than having its last button clipped off the bottom.
          "flex w-full shrink-0 flex-col gap-3 lg:w-70 lg:min-h-0 lg:overflow-y-auto lg:border-r lg:pr-6",
          THIN_SCROLLBAR,
        )}
      >
        <div className="flex items-center gap-3">
          <Avatar className="size-12 rounded-xl after:rounded-xl">
            <AvatarFallback className="rounded-xl text-sm font-medium">
              {initialsOf(user.firstName, user.lastName)}
            </AvatarFallback>
          </Avatar>

          <div className="flex min-w-0 flex-col">
            <p className="truncate font-heading text-base font-semibold tracking-tight">
              {user.firstName} {user.lastName}
            </p>
            {/* The id, in the same padded form the table uses, so the row you
                clicked and the page you land on say the same thing. */}
            <p className="font-mono text-xs text-muted-foreground">
              #{String(user.id).padStart(4, "0")}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <FactGroup title="Contact">
            {/* The one value here long enough to lose its end in a 280px
                column, and the one where the missing part is what tells two
                people apart. */}
            <Fact icon={Mail} label="Email">
              <TruncatedText>{user.email}</TruncatedText>
            </Fact>
            <Fact icon={Phone} label="Phone">
              {user.phone ?? <Unknown>Not given</Unknown>}
            </Fact>
          </FactGroup>

          <FactGroup title="Access">
            <Fact icon={UserRound} label="Role">
              {user.role}
            </Fact>
            {/* Words, not the table's badges. A badge earns its shape in a
                column of twelve rows, where it is picked out at a glance from
                among the others; sitting alone against a label it is a pill
                around a word that was already legible. The colour stays — that
                part was never the pill's doing. */}
            <Fact icon={ShieldCheck} label="Status">
              <span className={status.tone}>{status.label}</span>
            </Fact>
            {/* Off is amber rather than grey, as it is in the table: two-factor
                is mandatory here, so an account without it is not resting in a
                neutral state — it can do nothing at all until it enrols. */}
            <Fact icon={KeyRound} label="Two-factor">
              <span
                className={user.mfaEnabled ? "text-success" : "text-warning"}
              >
                {user.mfaEnabled ? "On" : "Off"}
              </span>
            </Fact>
          </FactGroup>

          <FactGroup title="Account">
            <Fact icon={CalendarDays} label="Created">
              {formatDay(user.createdAt) ?? <Unknown />}
            </Fact>
            <Fact icon={MailCheck} label="Email verified">
              {formatDay(user.emailVerifiedAt) ?? (
                <Unknown>Not verified</Unknown>
              )}
            </Fact>
            <Fact icon={LogIn} label="Last sign-in">
              {formatDayTime(user.lastLoginAt) ?? <Unknown>Never</Unknown>}
            </Fact>
          </FactGroup>

          {/* Under the facts, not above them. You read who this is and then
              decide to do something about it, and an action offered before the
              status it depends on is one taken without looking. */}
          <FactGroup title="Quick actions">
            <UserQuickActions user={user} />
          </FactGroup>
        </div>
      </aside>

      {/* min-w-0 so the permission table can scroll inside this column rather
          than widening it and pushing the whole page sideways. */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-6 lg:pl-6">
        {/* 1.2 of 3. Permissions is the shorter list today at three resources,
            but it grows a row per module added and the log grows a row per
            thing anybody does — so the split is by share of the height rather
            than by content, and neither can crowd the other out later. */}
        <Panel title="Permissions" className="min-h-0 flex-[1.2]">
          {/* A matrix, not a list. Twelve permissions written out as sentences
              is a wall of text nobody audits; a grid of resources against
              actions can be read down a column — everyone who can delete — as
              well as across. It is the same shape as the picker on the add
              screen, which is what makes the two comparable. */}
          <div
            className={cn(
              // Both axes: it can outgrow its share downwards as modules are
              // added, and sideways whenever the window is narrow.
              "min-h-0 flex-1 overflow-auto pr-2",
              THIN_SCROLLBAR,
            )}
          >
            <table className="w-full min-w-[32rem] border-collapse text-sm">
              {/* The header stays put while the resources scroll under it —
                  a column of ticks with no heading in sight is unreadable, and
                  this is exactly the table somebody scrolls while checking one
                  action across every module.

                  bg-background, not transparent: a sticky row with no fill of
                  its own lets the rows slide visibly through it. */}
              <thead className="sticky top-0 z-10 bg-background">
                <tr className="border-b">
                  <th className="py-2 pr-4 text-left font-mono text-[0.7rem] font-medium tracking-wider text-muted-foreground uppercase">
                    Module
                  </th>
                  {ACTION_COLUMNS.map((action) => (
                    <th
                      key={action}
                      className="px-2 py-2 text-center font-mono text-[0.7rem] font-medium tracking-wider text-muted-foreground uppercase"
                    >
                      {action}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {/* Grouped as the sidebar groups them, so a module is found
                    where somebody expects to find it rather than in an
                    alphabetical list of twenty-two strings. */}
                {RESOURCE_GROUPS.map((group) => (
                  <Fragment key={group.key}>
                    <tr className="border-b bg-muted/40">
                      <td
                        colSpan={ACTION_COLUMNS.length + 1}
                        className="py-1.5 font-mono text-[0.65rem] font-medium tracking-wider text-muted-foreground uppercase"
                      >
                        {group.label}
                      </td>
                    </tr>

                    {group.modules.map((resource) => (
                      <tr
                        key={resource.key}
                        className="border-b last:border-b-0"
                      >
                        <td className="py-2.5 pr-4 pl-3">
                          <span className="font-medium">{resource.label}</span>
                        </td>

                        {ACTION_COLUMNS.map((action) => {
                          const exists = resource.actions.includes(action)
                          const granted =
                            exists && held.has(`${resource.key}:${action}`)

                          return (
                            <td
                              key={action}
                              className="px-2 py-2.5 text-center"
                            >
                              {/* Three states, three marks. A blank cell for an
                                  action a module does not have would look like
                                  a permission somebody forgot to grant. */}
                              {!exists ? (
                                <span
                                  className="text-muted-foreground/40"
                                  title="Not applicable"
                                >
                                  ·
                                </span>
                              ) : (
                                <span
                                  className={cn(
                                    "inline-flex",
                                    granted
                                      ? "text-success"
                                      : "text-muted-foreground/50",
                                  )}
                                >
                                  {granted ? (
                                    <Check className="size-4" aria-hidden />
                                  ) : (
                                    <Minus className="size-4" aria-hidden />
                                  )}
                                  <span className="sr-only">
                                    {granted ? "Granted" : "Not granted"}
                                  </span>
                                </span>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* 1.8 of 3 — the larger share, because a log is read by scanning
            several entries at once while the matrix is read one cell at a
            time. */}
        <Panel title="Activity" className="min-h-0 flex-[1.8]">
          {/* What this person did, not what their record contains. The two
              panels that used to sit here restated the left column — created,
              verified, last sign-in, all already three inches to the left — so
              the page said everything twice and nothing about the account's
              actual use. */}
          {!activity ? (
            /* Not "nothing happened" — "nothing is recorded". The difference
               matters: one is a fact about this person, the other is a gap in
               the system, and showing an empty list would state the first while
               meaning the second. */
            <p className="rounded-md border border-dashed bg-muted/30 px-3 py-6 text-center text-sm text-muted-foreground">
              This system does not keep an activity log yet, so there is nothing
              to show — for anybody.
            </p>
          ) : activity.length === 0 ? (
            <p className="rounded-md border border-dashed bg-muted/30 px-3 py-6 text-center text-sm text-muted-foreground">
              Nothing recorded for this account yet.
            </p>
          ) : (
            // pr-2 keeps the text off the bar rather than sliding under it as
            // it appears.
            <ul
              className={cn(
                "flex min-h-0 flex-1 flex-col overflow-y-auto pr-2",
                THIN_SCROLLBAR,
              )}
            >
              {activity.map((entry, index) => (
                <LogEntry key={index} entry={entry} />
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  )
}

/** One line of the log: what they did, to what, and when. */
function LogEntry({ entry }: { entry: ActivityEntry }) {
  const { icon: Icon, tone } = ACTIVITY_ICON[entry.kind]

  return (
    <li className="flex items-start gap-3 border-b py-3 first:pt-0 last:border-b-0 last:pb-0">
      <span
        className={cn(
          "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border bg-card",
          tone,
        )}
      >
        <Icon className="size-3.5" aria-hidden />
      </span>

      <div className="flex min-w-0 flex-col gap-0.5">
        {/* The verb carries the weight and the object stays muted — a column of
            these is scanned for what happened, and the what-to only matters
            once something has caught your eye. */}
        <p className="truncate text-sm">
          <span className="font-medium">{entry.action}</span>
          {entry.subject && (
            <span className="text-muted-foreground"> {entry.subject}</span>
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatDayTime(entry.at)}
        </p>
      </div>
    </li>
  )
}

export { UserDetail, type ActivityEntry }
