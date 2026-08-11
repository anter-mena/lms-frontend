import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { currentUser } from "@/lib/auth"

/**
 * The initials in the navbar, for whoever is actually signed in.
 *
 * <p>An async Server Component handed into the client-side navbar as a prop, for
 * the same reason as the identity card: the session token never has to reach the
 * browser for the name to appear.
 */
async function UserAvatar() {
  const user = await currentUser()

  return (
    // Squared off rather than a circle. rounded has to be overridden in three
    // places — the component hardcodes rounded-full on the root, on its ::after
    // ring, and on the fallback.
    <Avatar className="rounded-lg after:rounded-lg">
      <AvatarFallback className="rounded-lg text-xs font-medium">
        {user ? initialsOf(user.firstName, user.lastName) : "—"}
      </AvatarFallback>
    </Avatar>
  )
}

/**
 * Exactly the avatar's own size, so the navbar row cannot reflow when the
 * initials arrive. `size-8` is what `Avatar` resolves to; changing one without
 * the other reintroduces the shift this exists to prevent.
 */
function UserAvatarSkeleton() {
  return <Skeleton className="size-8 shrink-0 rounded-lg" />
}

/**
 * First letter of each name. Falls back to the first two of whichever exists,
 * so a single-word name still produces something rather than a lonely letter
 * floating in a 32px square.
 */
function initialsOf(firstName: string, lastName: string) {
  const first = firstName?.trim() ?? ""
  const last = lastName?.trim() ?? ""

  if (first && last) return (first[0] + last[0]).toUpperCase()
  return (first || last).slice(0, 2).toUpperCase() || "?"
}

export { UserAvatar, UserAvatarSkeleton, initialsOf }
