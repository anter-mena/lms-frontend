/**
 * The shapes the backend sends, and the handful of constants both sides need.
 *
 * <p><b>Deliberately not marked `server-only`.</b> Its sibling `lib/users.ts` is,
 * because it reads the session cookie to make requests — and the table is a
 * Client Component that needs the page sizes and the row type. Importing a
 * server-only module from the browser is a build error, and TypeScript cannot
 * warn about it: `server-only` is a runtime guard, so `tsc` was perfectly happy
 * with the version that failed to render.
 *
 * <p>So the rule is: types and constants here, anything that talks to the network
 * next door.
 */

/** A row in the list. Mirrors the backend's UserSummaryResponse. */
export type UserRow = {
  id: number
  firstName: string
  lastName: string
  email: string
  phone: string | null
  role: string
  status: string
  mfaEnabled: boolean
  /** ISO 8601. When the account was created — the list's default sort. */
  createdAt: string | null
}

/** One account in full. Mirrors the backend's UserResponse. */
export type UserDetail = UserRow & {
  permissions: string[]
  createdAt: string | null
  lastLoginAt: string | null
  emailVerifiedAt: string | null
  mfaConfirmedAt: string | null
}

/** Mirrors the backend's PageResponse. */
export type Page<T> = {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

/** What the URL can carry, in the shape the filter panel and table write it. */
export type UserQuery = {
  search?: string
  role?: string
  /** The panel's own vocabulary: "on", "off", or absent for either. */
  mfa?: string
  status?: string
  page?: string
  size?: string
  sort?: string
}

/**
 * The page sizes the table offers.
 *
 * <p>Capped low on purpose. The table lives in a fixed-height panel — the page
 * itself does not scroll — so a page size larger than the panel holds does not
 * show more of anything, it just puts scrolling inside scrolling and makes the
 * page numbers meaningless.
 */
export const PAGE_SIZES = [5, 10, 15] as const

/** The middle option: a full page on a laptop without reaching the cap. */
export const DEFAULT_PAGE_SIZE = 10

/** A sidebar section and the modules under it. Mirrors PermissionCatalogueResponse. */
export type PermissionGroup = {
  key: string
  label: string
  modules: PermissionModule[]
}

export type PermissionModule = {
  key: string
  label: string
  description: string | null
  /**
   * These permissions can only come from being an administrator. Never offer
   * them for a member — the API refuses to grant them individually.
   */
  adminOnly: boolean
  /** Read first, then the rest. */
  actions: string[]
}

export type Role = {
  name: string
  description: string | null
  permissions: string[]
}
