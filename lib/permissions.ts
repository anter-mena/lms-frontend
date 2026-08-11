/**
 * The permission grid: what there is to grant, and what each role starts with.
 *
 * <p><b>Shaped like the sidebar, on purpose.</b> Permissions are grouped into the
 * same sections and modules somebody navigates by, so "can they open Channels"
 * is answered by finding Channels in the same place they would look for it in the
 * menu. A permission screen organised differently from the app it governs makes
 * the reader translate between two maps, and they will get it wrong.
 *
 * <p>⚠️ <b>Nothing exposes this, so it is a copy.</b> There is no endpoint
 * listing permissions or roles, so the only way to draw the grid is to know it.
 * Add a module and this file must be edited by hand or the screen quietly offers
 * fewer boxes than the system has. The fix is `GET /api/permissions` and
 * `GET /api/roles`, at which point this file is deleted rather than maintained.
 *
 * <p>⚠️ <b>The database does not know these names.</b>
 * `V2__seed_roles_and_permissions.sql` seeds RECORD, USER and REPORT — the
 * domain-neutral placeholders written before the modules existed. These are the
 * real ones, and reconciling the two is a migration that has to happen before any
 * of this is wired up.
 */

export type Resource = {
  key: string
  label: string
  description: string
  actions: string[]
}

/** A sidebar section, and the modules under it. */
export type ResourceGroup = {
  key: string
  label: string
  resources: Resource[]
}

/**
 * The five actions, in the order every screen lists them.
 *
 * <p>Read leads because everything else depends on it — creating, editing,
 * deleting or exporting something you cannot see is not a permission anybody
 * means to grant, and the pickers enforce that.
 */
const VIEW_ONLY = ["READ", "EXPORT"]
const FULL = ["READ", "CREATE", "UPDATE", "DELETE", "EXPORT"]

/**
 * Grouped as the sidebar groups them.
 *
 * <p>The dashboards get read and export only: nobody creates or deletes an
 * overview, it is a view onto data that lives elsewhere. The modules that hold
 * records of their own get the full set.
 */
export const RESOURCE_GROUPS: ResourceGroup[] = [
  {
    key: "OVERVIEW",
    label: "Overview",
    resources: [
      {
        key: "EMAIL_OVERVIEW",
        label: "Email Overview",
        description: "Email performance dashboards.",
        actions: VIEW_ONLY,
      },
      {
        key: "SEO_OVERVIEW",
        label: "SEO Overview",
        description: "Search performance dashboards.",
        actions: VIEW_ONLY,
      },
      {
        key: "MARKETING_OVERVIEW",
        label: "Marketing Overview",
        description: "Campaign and spend dashboards.",
        actions: VIEW_ONLY,
      },
    ],
  },
  {
    key: "CUSTOMERS",
    label: "Customers",
    resources: [
      {
        key: "CUSTOMER",
        label: "Customer List",
        description: "The customer records themselves.",
        actions: FULL,
      },
      {
        key: "CHANNEL",
        label: "Channels",
        description: "The routes customers arrive through.",
        actions: FULL,
      },
    ],
  },
  {
    key: "MANAGEMENT",
    label: "Management",
    resources: [
      {
        key: "USER",
        label: "Users",
        description: "Accounts, roles and access.",
        actions: FULL,
      },
    ],
  },
]

/**
 * Every module, flat.
 *
 * <p>Derived rather than written twice — a screen that does not care about the
 * grouping still gets the same list, and it cannot fall out of step.
 */
export const RESOURCES: Resource[] = RESOURCE_GROUPS.flatMap(
  (group) => group.resources,
)

/** Every permission, as the `RESOURCE:ACTION` strings a token carries. */
export const ALL_PERMISSIONS = RESOURCES.flatMap((resource) =>
  resource.actions.map((action) => `${resource.key}:${action}`),
)

/**
 * Every action any module has, read first.
 *
 * <p>Taken from the modules rather than written out, so an action added to one of
 * them appears as a column instead of silently not being shown.
 */
export const ACTION_COLUMNS = (() => {
  const seen = new Set<string>()
  RESOURCES.forEach((resource) =>
    resource.actions.forEach((action) => seen.add(action)),
  )
  return ["READ", ...[...seen].filter((action) => action !== "READ")]
})()

export type Role = {
  key: string
  label: string
  description: string
  /** What the role grants on its own, before any per-user exception. */
  permissions: string[]
}

/**
 * Two roles, and they mean opposite things.
 *
 * <p><b>Administrator</b> has everything, always. <b>Member</b> has nothing by
 * default — a member's access is entirely whatever they are given, one
 * permission at a time. There is no middle role with a curated set, because a
 * curated set is a guess about a job nobody has described yet.
 *
 * <p>⚠️ <b>The database does not agree with this yet.</b>
 * `V2__seed_roles_and_permissions.sql` seeds three roles — ADMIN, MANAGER and
 * MEMBER — and gives MEMBER `RECORD:READ` outright. So a member created through
 * this form will arrive holding a permission the form never offered, and MANAGER
 * exists with nobody able to choose it. Reconciling that is a migration, and it
 * has to happen before any of this is wired up.
 */
export const ROLES: Role[] = [
  {
    key: "ADMIN",
    label: "Administrator",
    description: "Full access to every part of the system.",
    permissions: ALL_PERMISSIONS,
  },
  {
    key: "MEMBER",
    label: "Member",
    description:
      "Starts with nothing. Access is granted one permission at a time.",
    permissions: [],
  },
]

export function permissionsForRole(roleKey: string): string[] {
  return ROLES.find((role) => role.key === roleKey)?.permissions ?? []
}

/**
 * Whether the role already carries everything, leaving nothing to choose.
 *
 * <p>Derived rather than a check for "ADMIN". If a second all-access role is
 * ever added, every screen that hides its permission grid keeps working — and
 * if Administrator is ever narrowed, the grid comes back on its own.
 */
export function roleGrantsEverything(roleKey: string): boolean {
  return permissionsForRole(roleKey).length === ALL_PERMISSIONS.length
}

/**
 * How a chosen set differs from what the role already gives.
 *
 * <p>This is the shape the backend actually stores: `user_permissions` holds
 * exceptions, not a copy of everything. Sending the whole set would lose the
 * distinction between "this person is a Manager" and "this person is a Manager
 * who was also given exports", and changing the role later would then leave the
 * old permissions frozen in place.
 */
export function diffFromRole(roleKey: string, chosen: Set<string>) {
  const base = new Set(permissionsForRole(roleKey))

  return {
    granted: [...chosen].filter((p) => !base.has(p)).sort(),
    denied: [...base].filter((p) => !chosen.has(p)).sort(),
  }
}
