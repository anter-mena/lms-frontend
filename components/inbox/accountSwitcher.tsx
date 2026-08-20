"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { ProviderIcon } from "@/components/inbox/providerIcon"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { MailAccount } from "@/lib/mailTypes"

/**
 * Which mailbox you are looking at.
 *
 * <p>Lives in the top navbar rather than inside the inbox, because it answers a
 * question about the whole screen — every message in the list and the one open
 * beside it belong to whatever this says. A control that reframes both panes
 * belongs above both panes.
 *
 * <p><b>One at a time, not several.</b> The reference design shows a tick beside
 * every address, which reads as a set you can pick from rather than a set you
 * can combine. Combining them is a different feature — a unified inbox — and it
 * changes what every row means, because a message would then need to say which
 * mailbox it arrived at. Worth building deliberately if it is wanted, not by
 * making a switcher quietly multi-select.
 *
 * <p>The choice goes in the address bar with everything else on this screen, so
 * a mailbox can be linked to and the Back button returns to the last one.
 */
function AccountSwitcher({
  accounts,
  selectedId,
}: {
  accounts: MailAccount[]
  selectedId: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  // Base UI's Select can hand back null — clearing the value is a state it
  // supports even though nothing here offers it. Ignoring that case leaves the
  // mailbox as it was, which is the only sensible answer to "no mailbox".
  function choose(id: string | null) {
    if (!id) return

    const next = new URLSearchParams(params.toString())
    next.set("account", id)

    // A message id belongs to the mailbox it came from, so carrying it across
    // would open a message the new list does not contain. Same reasoning as the
    // list's filter and search.
    next.delete("mail")

    router.push(`${pathname}?${next.toString()}`, { scroll: false })
  }

  return (
    <Select value={selectedId} onValueChange={choose}>
      {/* ⚠️ A plain `h-8`, and the reason is worth writing down because three
          attempts at this height did nothing.

          SelectTrigger declares its height as `data-[size=default]:h-8`, so the
          obvious fix was to match that variant. It was the wrong diagnosis:
          <b>neither that class nor any override of it exists in the compiled
          CSS</b> — Tailwind never emitted the variant at all, so the trigger has
          been sized by its `py-2` padding the entire time. Every "make it
          taller" edit was competing with a rule that was not there.

          A plain height class does generate, so this is the one that decides it.
          Set to the same 32px as the folder buttons beside it, since they are one
          row of controls and should read as one scale.

          A set width, not `w-full`. Height was the point — filling the row was
          not, and it left the folder nav squeezed against the edge. Addresses
          truncate rather than the control growing to fit the longest one. */}
      <SelectTrigger className="h-8 w-52 shrink-0 bg-card" aria-label="Mailbox">
        {/* ⚠️ A function, not a bare `<SelectValue />`. Left to itself the
            component prints the raw value — the trigger read "norden-admin",
            an id meant for the address bar and never for a person. The children
            of the chosen item are not what it displays; this is. */}
        <SelectValue>
          {(value: string | null) => {
            const account = accounts.find((entry) => entry.id === value)
            if (!account) return "Choose a mailbox"

            return (
              <span className="flex min-w-0 items-center gap-2">
                <ProviderIcon provider={account.provider} />
                <span className="truncate">{account.email}</span>
              </span>
            )
          }}
        </SelectValue>
      </SelectTrigger>

      {/* ⚠️ `alignItemWithTrigger={false}` is what removes the scrollbar. Left
          on — it is the default — Base UI positions the popup so the chosen item
          sits over the trigger, which means constraining its height and letting
          it scroll internally. With three mailboxes that produced a scrollbar
          over a list that fits twice over. Off, it opens as an ordinary dropdown
          and only scrolls if it genuinely cannot fit. */}
      <SelectContent align="start" alignItemWithTrigger={false}>
        {accounts.map((account) => (
          <SelectItem key={account.id} value={account.id}>
            <span className="flex items-center gap-2">
              <ProviderIcon provider={account.provider} />
              {/* The address, not the label. Two mailboxes can belong to the
                  same brand — "Norden Capital" appears twice in the sample — so
                  the name alone cannot tell them apart, and the one thing that
                  always can is the address. */}
              <span className="truncate">{account.email}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export { AccountSwitcher }
