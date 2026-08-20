import type { Mail, MailAccount, MailFolder } from "@/lib/mailTypes"

/**
 * Invented messages, so the screen can be designed before the backend exists.
 *
 * <p>⚠️ <b>This is not a mailbox and the page says so.</b> Every message here is
 * made up. It exists to answer "does this layout work" — a reading pane with no
 * message in it tells you nothing about whether the reading pane is right.
 *
 * <p>Deliberately not random, for the same two reasons `backupSample` is not: it
 * is generated on the server and handed to components as props, so anything
 * non-deterministic would render one thing on the server and another in the
 * browser and React would flag the mismatch. And a design preview wants a
 * <em>range</em> — a long message and a short one, a subject that fits and one
 * that does not, some read and some not — because the point is to check that all
 * of them survive the same layout.
 *
 * <p>Delete this file the day the API is real. It should leave no trace in the
 * components, which is why they take a `Mail` and know nothing about where it
 * came from.
 */

/**
 * Fixed timestamps, not offsets from today.
 *
 * <p>`backupSample` counts backwards from the current date because a backup page
 * is about recency — "last night" has to actually be last night. Mail is not:
 * these are dated moments, and dates that quietly slide forward every day are
 * dates nobody can point at when comparing two screenshots a week apart.
 */
const MAILS: Mail[] = [
  {
    id: "wsmith-meeting",
    name: "William Smith",
    email: "williamsmith@example.com",
    subject: "Meeting Tomorrow",
    receivedAt: "2026-08-19T09:00:00Z",
    body: `Hi, let's have a meeting tomorrow to discuss the project. I've been reviewing the project details and have some ideas I'd like to share. It's crucial that we align on our next steps to ensure the project's success.

Please come prepared with any questions or insights you may have. Looking forward to our meeting!

Best regards, William`,
    read: true,
    starred: true,
    labels: ["meeting", "work", "important"],
  },
  {
    id: "asmith-update",
    name: "Alice Smith",
    email: "alicesmith@example.com",
    subject: "Re: Project Update",
    receivedAt: "2026-08-18T14:32:00Z",
    body: `Thank you for the project update. It looks great! I've gone through the report, and the progress is impressive. The team has done a fantastic job, and I appreciate the hard work everyone has put in.

I have a few minor suggestions that I'll include in the attached document.

Let's discuss these during our next meeting. Keep up the excellent work!`,
    read: true,
    starred: false,
    labels: ["work", "important"],
  },
  {
    id: "bjohnson-weekend",
    name: "Bob Johnson",
    email: "bobjohnson@example.com",
    subject: "Weekend Plans",
    receivedAt: "2026-08-16T11:05:00Z",
    body: `Any plans for the weekend? I was thinking of going hiking in the nearby mountains. It's been a while since we had some outdoor fun.

If you're interested, let me know, and we can plan the details. It'll be a great way to unwind and enjoy nature.`,
    read: true,
    starred: false,
    labels: ["personal"],
  },
  {
    /** Unread, and short. Both states have to survive the same layout. */
    id: "edavis-budget",
    name: "Emily Davis",
    email: "emilydavis@example.com",
    subject: "Re: Question about Budget",
    receivedAt: "2026-08-15T08:47:00Z",
    body: `I have a question about the budget for the upcoming project. It seems like there's a discrepancy in the allocation of resources.

Could you clarify before Thursday?`,
    read: false,
    starred: true,
    labels: ["work", "budget"],
  },
  {
    /**
     * The short one, and the reason it is here: the list reserves two lines for
     * every preview whether or not the text fills them. A message with a single
     * sentence is the only thing that proves the reservation is working — every
     * other sample overflows two lines and would look identical without it.
     */
    id: "rkhan-approved",
    name: "Rania Khan",
    email: "raniakhan@example.com",
    subject: "Approved",
    receivedAt: "2026-08-14T18:05:00Z",
    body: "Approved — go ahead.",
    read: true,
    starred: false,
    labels: ["work"],
  },
  {
    /**
     * The long one, and the reason it is here: a reading pane that looks fine
     * on three paragraphs is not yet known to look fine on eight.
     */
    id: "mwilson-announcement",
    name: "Michael Wilson",
    email: "michaelwilson@example.com",
    subject: "Important Announcement",
    receivedAt: "2026-08-14T16:20:00Z",
    body: `I have an important announcement to make during our team meeting. It pertains to a strategic shift in our approach to the upcoming product launch, and it will affect how each of us plans the next quarter.

The short version is that we are moving the launch back by three weeks. That is not a decision anybody enjoyed making, and it was made for one reason: the reliability work we started in June is not finished, and shipping on top of it would mean shipping something we would spend the following quarter apologising for.

What this changes for each team:

Engineering keeps the current sprint and gains one more. Nothing already committed is being cut — the extra time goes to the outstanding reliability items and to the test coverage we have been deferring since March.

Design has three additional weeks on the onboarding flow, which was the piece most obviously rushed in the last review.

Marketing is the team this costs the most, because the campaign was already booked around the original date. We will go through the rebooking together on Thursday rather than by email.

I know a delay is never welcome news, particularly this late. I would rather explain a three-week slip once than explain a bad launch every week for a quarter.

Please bring your questions to the meeting. I would rather answer them in the room than have them discussed in six separate conversations afterwards.`,
    read: false,
    starred: false,
    labels: ["meeting", "work", "important"],
  },
]

/**
 * The mailboxes on offer.
 *
 * <p>Three, on two brands, on purpose: with one brand each, the filter beside
 * the search would be indistinguishable from the account switcher and neither
 * would prove anything.
 */
const ACCOUNTS: MailAccount[] = [
  {
    id: "norden-admin",
    label: "Norden Capital",
    email: "admin@nordencapital.com",
    brand: "Norden Capital",
    // A business domain on Google Workspace, which is the common case and the
    // reason the provider is stored rather than read off the address.
    provider: "gmail",
  },
  {
    id: "norden-support",
    label: "Norden Support",
    email: "support@nordencapital.com",
    brand: "Norden Capital",
    provider: "proton",
  },
  {
    id: "atlas-hello",
    label: "Atlas Studio",
    email: "hello@atlasstudio.com",
    brand: "Atlas Studio",
    // Deliberately one the marks do not cover, so the envelope fallback is on
    // screen rather than only in theory.
    provider: "fastmail",
  },
]

/**
 * The folders, and how much is waiting in each.
 *
 * <p>Two groups: mail being dealt with, then mail finished with. The counts are
 * invented and deliberately uneven — a nav where every number is a tidy two
 * digits never shows what a three-digit one does to the layout.
 */
const FOLDERS: MailFolder[] = [
  { id: "inbox", label: "Inbox", icon: "inbox", unread: 128, group: "working" },
  { id: "drafts", label: "Drafts", icon: "file", unread: 9, group: "working" },
  { id: "sent", label: "Sent", icon: "send", unread: 0, group: "working" },
  // The rule falls here: everything above is mail being dealt with, everything
  // below is mail finished with.
  { id: "junk", label: "Junk", icon: "archive-x", unread: 23, group: "aside" },
  { id: "trash", label: "Trash", icon: "trash", unread: 0, group: "aside" },
  { id: "archive", label: "Archive", icon: "archive", unread: 0, group: "aside" },
]

/** Every mailbox. */
export function sampleAccounts(): MailAccount[] {
  return ACCOUNTS
}

/** Every folder, system ones first. */
export function sampleFolders(): MailFolder[] {
  return FOLDERS
}

/** Every message, newest first — the order a mailbox is read in. */
export function sampleMails(): Mail[] {
  return [...MAILS].sort(
    (a, b) =>
      new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
  )
}

/** One message by id, or the newest when nothing is chosen. */
export function sampleMail(id?: string): Mail | null {
  const all = sampleMails()
  if (!id) return all[0] ?? null

  return all.find((mail) => mail.id === id) ?? null
}
