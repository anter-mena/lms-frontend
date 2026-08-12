import "server-only"

import { apiFetch, type ApiResult } from "@/lib/api"
import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZES,
  type Page,
  type PermissionGroup,
  type Role,
  type UserDetail,
  type UserQuery,
  type UserRow,
} from "@/lib/userTypes"

/**
 * Reading user accounts from the backend.
 *
 * <p>A typed layer over {@link apiFetch} so the field names live in one place. It
 * exists because they are easy to get subtly wrong: the API wants
 * {@code mfaEnabled=true}, the URL the filter panel writes says {@code mfa=on},
 * and nothing but a runtime 400 would ever have told us they disagreed.
 *
 * <p>Reads only. Anything that changes an account is a Server Action in
 * {@code app/(app)/users/actions.ts}, because those need to revalidate the pages
 * that display what they changed.
 *
 * <p>The shapes live in {@code lib/userTypes.ts} rather than here — this module
 * reads the session cookie, so it can never be imported by a Client Component,
 * and the table is one.
 */

/**
 * Turns what is in the address bar into what the API expects.
 *
 * <p>The two do not match, deliberately. A URL is read by people — `?mfa=on` is
 * something you can send a colleague — while the API wants an unambiguous
 * boolean. Translating in one function is what keeps that difference from
 * leaking into every component.
 *
 * <p>Everything is clamped here rather than trusted: a hand-edited `?page=-4` or
 * `?size=9999` should produce a sensible page, not an error and not an enormous
 * response.
 */
function toQueryString(query: UserQuery): string {
  const params = new URLSearchParams()

  if (query.search?.trim()) params.set("search", query.search.trim())
  if (query.role) params.set("role", query.role)
  if (query.status) params.set("status", query.status)

  // "any" and anything unrecognised mean no filter at all.
  if (query.mfa === "on") params.set("mfaEnabled", "true")
  else if (query.mfa === "off") params.set("mfaEnabled", "false")

  // The URL counts pages from 1, because that is what the buttons show. The API
  // counts from 0. Off-by-one bugs here are invisible until page 2.
  const page = Number(query.page)
  params.set("page", Number.isFinite(page) && page > 1 ? String(page - 1) : "0")

  const size = Number(query.size)
  params.set(
    "size",
    PAGE_SIZES.includes(size as (typeof PAGE_SIZES)[number])
      ? String(size)
      : String(DEFAULT_PAGE_SIZE)
  )

  if (query.sort) params.set("sort", query.sort)

  return params.toString()
}

/** One page of accounts. Needs USER:READ, so a member gets a 403 back. */
export async function listUsers(query: UserQuery): Promise<ApiResult<Page<UserRow>>> {
  return apiFetch<Page<UserRow>>(`/api/users?${toQueryString(query)}`, {
    authenticated: true,
  })
}

/** One account in full, permissions and timestamps included. */
export async function getUser(id: string | number): Promise<ApiResult<UserDetail>> {
  return apiFetch<UserDetail>(`/api/users/${id}`, { authenticated: true })
}

/**
 * The permission model itself.
 *
 * <p>This is what replaced `lib/permissions.ts`. That file described the modules,
 * their labels, their order and their actions by hand, because nothing exposed
 * any of it — so adding a module meant editing a migration and a TypeScript file
 * and hoping the two agreed.
 */
export async function getPermissionCatalogue(): Promise<
  ApiResult<{ groups: PermissionGroup[] }>
> {
  return apiFetch<{ groups: PermissionGroup[] }>("/api/permissions", {
    authenticated: true,
  })
}

export async function getRoles(): Promise<ApiResult<Role[]>> {
  return apiFetch<Role[]>("/api/roles", { authenticated: true })
}

export type { Page, PermissionGroup, Role, UserDetail, UserQuery, UserRow }
