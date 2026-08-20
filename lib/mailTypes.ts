/**
 * The shape the Inbox draws.
 *
 * <p>Client-safe on purpose, the same split as `userTypes`, `systemTypes` and
 * `backupTypes`: the components are shared between the server page and the
 * client pieces that handle selection, and a file that reads the session cookie
 * cannot be imported from the browser.
 *
 * <p>⚠️ Nothing produces this yet. It is written as the shape the API will
 * return so the screen can be built against it, and so the day the backend
 * arrives the only change is where the data comes from.
 */

/**
 * One message.
 *
 * <p>A single message rather than a thread, and that is a decision worth naming
 * before it hardens. The toolbar already says "thread" in three places — star,
 * mute, mark unread — because real mail groups replies together, and the moment
 * this has to show a conversation, `body` becomes a list of messages and every
 * component below changes shape.
 *
 * <p>Kept flat for now because nothing sends anything: a thread of one is
 * indistinguishable from a message, and building the harder shape first would be
 * building it blind.
 */
export type Mail = {
  id: string
  /** Who sent it. */
  name: string
  email: string
  subject: string
  /** ISO timestamp. */
  receivedAt: string
  /**
   * The message itself, as plain text.
   *
   * <p>Blank lines separate paragraphs. Not HTML, deliberately — mail is the
   * one place on the internet where arbitrary markup arrives from strangers, and
   * rendering it is a decision that needs sanitising, a content policy and a
   * reason. Text needs none of those.
   */
  body: string
  /** Whether it has been opened. Drives the unread mark in the list. */
  read: boolean
  /**
   * Flagged by the person reading it.
   *
   * <p>Theirs, not the sender's — unlike every other field here, which describes
   * the message as it arrived. Worth keeping straight, because it means the star
   * belongs to the mailbox rather than to the mail, and two people looking at a
   * shared mailbox will eventually disagree about it.
   */
  starred: boolean
  /** Free-form tags — "work", "important", "budget". */
  labels: string[]
}

/**
 * What may be done to a message, for the account looking at it.
 *
 * <p>One object rather than four props threaded separately, because every
 * control on the reading pane needs at least one of them and the set only grows.
 * Mirrors the `INBOX:*` permissions exactly; `READ` is absent because a person
 * without it never reaches this screen.
 */
export type MailAbilities = {
  send: boolean
  delete: boolean
  archive: boolean
  star: boolean
}

/**
 * One mailbox this person can look at.
 *
 * <p>`brand` is what the filter beside the search narrows by, and it is
 * deliberately not the same thing as the account: several addresses can belong
 * to one brand, and one address can receive for several. Keeping them apart is
 * what lets "show me everything for Norden" and "show me what arrived at
 * support@" be two different questions.
 */
export type MailAccount = {
  id: string
  /** The person or team the mailbox belongs to. */
  label: string
  email: string
  /** Which brand's mail arrives here. */
  brand: string
  /**
   * Who hosts the mailbox — "gmail", "icloud", "proton", or anything else for
   * the plain envelope. Stored rather than guessed from the address: a company
   * domain says nothing about whose servers it runs on.
   */
  provider: string
}

/**
 * A folder in the navigation, with what is waiting in it.
 *
 * <p>`unread` drives the mark beside the name. Zero means no mark at all rather
 * than a mark reading nought — a folder with nothing new should say nothing.
 */
export type MailFolder = {
  id: string
  label: string
  /** Lucide icon name, resolved by the nav so this stays serialisable. */
  icon: string
  unread: number
  /**
   * Which half of the nav the folder sits in.
   *
   * <p>`working` is mail you are dealing with — the inbox, what you have not
   * finished, what you have sent. `aside` is mail you have finished with, one
   * way or another. The nav draws a rule between the two, which is the only
   * reason this exists.
   *
   * <p>The category folders — Social, Updates, Promotions and the rest — were
   * here and are gone. They are a Gmail idea: automatic sorting into buckets
   * nobody asked for, and this inbox does no automatic sorting at all. Eleven
   * destinations in a pane this narrow was also most of why the nav needed to
   * collapse.
   */
  group: "working" | "aside"
}

/**
 * What the address bar carries, and the only state the inbox has.
 *
 * <p>The same choice as the backup log's sort and the user list's filters: in
 * the URL rather than in a component. It costs a round trip per click and buys
 * three things — an open message can be linked to, the Back button walks back
 * through what was read, and a reload lands where it left off rather than at
 * the top of the list.
 */
export type MailQuery = {
  /** Which message is open. Absent means the newest. */
  mail?: string
  /** "unread" narrows the list; anything else shows everything. */
  filter?: string
  /** Free-text search across sender, subject and body. */
  q?: string
  /** Which mailbox is open. Absent means the first one. */
  account?: string
  /** Narrows the list to one brand. Absent means all of them. */
  brand?: string
  /** Which folder is open. Absent means the inbox. */
  folder?: string
}

/** Nothing permitted. The safe answer when the set cannot be worked out. */
export const NO_ABILITIES: MailAbilities = {
  send: false,
  delete: false,
  archive: false,
  star: false,
}
