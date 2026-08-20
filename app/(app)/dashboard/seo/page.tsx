import type { Metadata } from "next"

import { PermissionRefused } from "@/components/access/permissionRefused"
import { requireUser } from "@/lib/auth"

export const metadata: Metadata = {
  title: "SEO overview",
}

/** What it takes to open this screen at all. */
const READ = "SEO_OVERVIEW:READ"

/**
 * How the site is doing in search. Nothing in it yet — the room, before the
 * furniture.
 *
 * <p>It had four invented metric cards, built when this and `/customers` were a
 * matched pair proving the permission model worked: the development member holds
 * `CUSTOMER:READ` and not `SEO_OVERVIEW:READ`, so one screen rendered and the
 * other refused with nothing about the token differing between them. That test
 * has served its purpose, and the numbers were made up.
 *
 * <p><b>Both guards were already in place before this was emptied</b>, and
 * neither was touched:
 *
 * <ul>
 *   <li><b>Backend.</b> `GET /api/overview/seo` carries
 *       `@PreAuthorize("hasAuthority('SEO_OVERVIEW:READ')")`, checked against the
 *       database on every request rather than read from the token.</li>
 *   <li><b>Permissions.</b> `SEO_OVERVIEW` is a module in the database with READ
 *       and EXPORT, in the Overview group, grantable to anybody — so it already
 *       appears in the permission screens without a line of TypeScript
 *       describing it.</li>
 * </ul>
 *
 * <p>⚠️ <b>The check below is now the only one running, and it is the weaker
 * one.</b> With nothing being fetched there is no request for the backend to
 * refuse, so this reads the permission off the session instead. That is fine for
 * deciding what to draw and is not a boundary: the moment this page loads real
 * data, the endpoint serving it has to demand the permission for itself. A page
 * that guards data an API hands out freely is a curtain, not a lock.
 */
export default async function SeoOverviewPage() {
  const user = await requireUser()

  if (!user.permissions.includes(READ)) {
    return <PermissionRefused module="the SEO overview" permission={READ} />
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">
        SEO overview
      </h1>
      <p className="text-sm text-muted-foreground">Nothing here yet.</p>
    </div>
  )
}
