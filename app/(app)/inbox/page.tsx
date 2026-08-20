import type { Metadata } from "next"
import { cookies } from "next/headers"

import { PermissionRefused } from "@/components/access/permissionRefused"
import { InboxShell } from "@/components/inbox/inboxShell"
import { MailDisplay } from "@/components/inbox/mailDisplay"
import { MailList } from "@/components/inbox/mailList"
import { requireUser } from "@/lib/auth"
import { PANES_COOKIE, parsePaneLayout } from "@/lib/inboxLayout"
import { getInbox } from "@/lib/mail"
import type { MailAbilities, MailQuery } from "@/lib/mailTypes"

export const metadata: Metadata = {
  title: "Inbox",
}

/** What it takes to open this screen at all. */
const READ = "INBOX:READ"

/**
 * Messages. Nothing in it yet — the room, before the furniture.
 *
 * <p><b>Not administrators only</b>, and that is the point of it existing now.
 * Management is a whole area middleware turns members away from before anything
 * renders; this is an ordinary module, so anybody may be given it one permission
 * at a time and anybody may be refused it. It is the first screen in the
 * application where that distinction is real rather than described.
 *
 * <p>The gate is `INBOX:READ`, read from the token the backend signed. Two
 * things are worth being clear about:
 *
 * <ul>
 *   <li><b>An administrator holds it automatically</b> — not by a check for the
 *       role here, but because `V4__inbox_module.sql` grants every permission to
 *       ADMIN. If that ever stops being true, this screen should refuse them,
 *       and it will.</li>
 *   <li><b>This is not the security boundary.</b> Nothing is behind it yet; when
 *       something is, the endpoint serving it has to demand the permission for
 *       itself. A page that guards data the API hands out freely is a curtain,
 *       not a lock.</li>
 * </ul>
 *
 * <p>The other four permissions — send, delete, archive, star — exist in the
 * database and are grantable today. Nothing reads them yet, because there is
 * nothing to send or star. They are checked at the point each control is built,
 * not here.
 *
 * <p><b>Built in pieces.</b> The split came first, then the reading pane. The
 * list is still a placeholder, which is why the reading pane opens the newest
 * message rather than one that was chosen — there is nothing yet to choose with.
 */
export default async function InboxPage({
  searchParams,
}: {
  /** The open message, the filter and the search. All three write here. */
  searchParams: Promise<MailQuery>
}) {
  const user = await requireUser()

  if (!user.permissions.includes(READ)) {
    return <PermissionRefused module="the inbox" permission={READ} />
  }

  /**
   * What this account may do to a message.
   *
   * <p>Read off the token the backend signed, one permission at a time. An
   * administrator holds all four because `V4__inbox_module.sql` grants ADMIN
   * every permission — not because of a check for the role here. If that ever
   * stops being true, the controls follow it without anything being edited.
   */
  const can: MailAbilities = {
    send: user.permissions.includes("INBOX:SEND"),
    delete: user.permissions.includes("INBOX:DELETE"),
    archive: user.permissions.includes("INBOX:ARCHIVE"),
    star: user.permissions.includes("INBOX:STAR"),
  }

  /**
   * Where this browser last left the divider.
   *
   * <p>Read on the server so the panes are rendered at the right widths in the
   * first HTML. The previous version kept this in `localStorage`, which the
   * server cannot see — so every reload painted the default split and then
   * corrected itself, visibly.
   */
  const layout = parsePaneLayout((await cookies()).get(PANES_COOKIE)?.value)

  const query = await searchParams
  const { mails, selected, accounts, account, folders, folderId, brands } =
    await getInbox(query)

  // Decided once, on the server, and passed down. Every row shows an age, and a
  // component that reads the clock itself renders one answer here and a
  // different one after hydration — which React reports as a mismatch.
  const now = new Date()

  return (
    // h-full + overflow-hidden: the page takes exactly the room the shell gives
    // it and never more, so nothing here scrolls except the panes, which manage
    // their own. Without the height cap the panel group has nothing to be
    // shorter than and simply grows until the page scrolls instead.
    //
    // No padding, unlike every other page in the app. A mail client is a set of
    // columns that meet the edges of the window — the navbar above and the footer
    // below are the frame, and insetting the panes inside a second frame turns
    // two full-height columns into a picture of two columns. It also costs the
    // list real width, which is the pane with the least to spare.
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <InboxShell
        defaultLayout={layout}
        list={
          // Keyed on the query so the search box is re-seeded from the URL when
          // the Back button changes it — without this a stale word sits in a
          // field that is no longer filtering anything. The user list solved the
          // same problem the same way.
          <MailList
            key={`${query.filter ?? ""}|${query.q ?? ""}|${query.brand ?? ""}`}
            mails={mails}
            selectedId={selected?.id ?? null}
            query={query}
            brands={brands}
            accounts={accounts}
            accountId={account.id}
            folders={folders}
            folderId={folderId}
            canStar={can.star}
            now={now}
          />
        }
        reading={<MailDisplay mail={selected} can={can} />}
      />
    </div>
  )
}
