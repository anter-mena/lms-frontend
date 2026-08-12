import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { currentUser } from "@/lib/auth"
import { initialsOf } from "@/lib/initials"

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

export { UserAvatar, UserAvatarSkeleton }
