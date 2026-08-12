/**
 * First letter of each name, for an avatar.
 *
 * <p>Its own file, and that is not fussiness. It used to live in
 * `components/layout/userAvatar.tsx`, which is a Server Component that reads the
 * session — so the moment a Client Component imported this one function, the
 * whole server-only chain came with it and the production build failed. Nothing
 * here touches the session, so nothing here needs to be server-only.
 *
 * <p>Falls back to the first two letters of whichever name exists, so a
 * single-word name still produces something rather than a lonely letter floating
 * in a 32px square.
 */
export function initialsOf(firstName: string, lastName: string): string {
  const first = firstName?.trim() ?? ""
  const last = lastName?.trim() ?? ""

  if (first && last) return (first[0] + last[0]).toUpperCase()
  return (first || last).slice(0, 2).toUpperCase() || "?"
}
