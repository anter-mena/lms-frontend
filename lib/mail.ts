import "server-only"

import {
  sampleAccounts,
  sampleFolders,
  sampleMails,
} from "@/lib/mailSample"
import type {
  Mail,
  MailAccount,
  MailFolder,
  MailQuery,
} from "@/lib/mailTypes"

/**
 * Where the Inbox gets its messages.
 *
 * <p>The same job `lib/backups.ts` does for the Backups screen and `lib/users.ts`
 * for the user list: one place the page asks, so the page never knows whether
 * the answer came from a backend, a file or — as today — an invented sample.
 * When the API arrives, the body of {@link getInbox} becomes an `apiFetch` call
 * and nothing on the screen changes.
 *
 * <p>Async already, for that reason. A synchronous function here would mean the
 * page's `await` appears on the day the backend does, and a change that touches
 * the page as well as this file is a change that can break the page.
 *
 * <p><b>Filtering and searching happen here, not in the list.</b> Narrowing in
 * the browser means every message has to be sent before any of them can be
 * hidden — fine at five, wrong at five thousand, and the wrong shape to hand a
 * backend later. The same split the user list already uses.
 */

/** Sender, subject and body. The three places a half-remembered message hides. */
function matches(mail: Mail, needle: string): boolean {
  const haystack = [mail.name, mail.email, mail.subject, mail.body]
    .join(" ")
    .toLowerCase()

  return haystack.includes(needle)
}

/**
 * The list, and whichever message is open.
 *
 * @param query what the address bar says — the filter, the search, the selection.
 *
 * ⚠️ Every message is invented. See `lib/mailSample.ts`.
 */
export async function getInbox(query: MailQuery): Promise<{
  mails: Mail[]
  selected: Mail | null
  accounts: MailAccount[]
  account: MailAccount
  folders: MailFolder[]
  folderId: string
  /** Every brand with a mailbox, for the filter beside the search. */
  brands: string[]
}> {
  const accounts = sampleAccounts()
  const folders = sampleFolders()

  // An unknown id in the URL falls back to the first mailbox rather than
  // drawing an empty screen. Somebody editing the address bar is the least of
  // it — a bookmark to a mailbox that has since been disconnected does the same.
  const account =
    accounts.find((entry) => entry.id === query.account) ?? accounts[0]

  const folderId = folders.some((folder) => folder.id === query.folder)
    ? query.folder!
    : "inbox"

  const brands = [...new Set(accounts.map((entry) => entry.brand))].sort()

  const needle = query.q?.trim().toLowerCase() ?? ""

  // ⚠️ The brand and the folder narrow nothing yet. Every sample message belongs
  // to no mailbox in particular, because a `Mail` has no account on it — and
  // inventing one would be inventing the relationship the backend has not
  // described. The controls are wired to the address bar and the list will
  // narrow the day a message knows where it arrived.
  const mails = sampleMails()
    .filter((mail) => (query.filter === "unread" ? !mail.read : true))
    .filter((mail) => (needle ? matches(mail, needle) : true))

  /**
   * The open message, and it has to come from the filtered list.
   *
   * <p>Reading a message and then switching to Unread should not leave that
   * message open beside a list it is no longer in — the reading pane would be
   * showing something the list says is not there. Falling back to the first of
   * whatever survived is the honest answer, and an empty result opens nothing.
   */
  const selected =
    mails.find((mail) => mail.id === query.mail) ?? mails[0] ?? null

  return { mails, selected, accounts, account, folders, folderId, brands }
}
