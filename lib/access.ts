import type { PermissionGroup, Role } from "@/lib/userTypes"

/**
 * Reasoning about permissions, over whatever the backend said they are.
 *
 * <p>This replaced `lib/permissions.ts`, which described the whole model by hand
 * — every module, its label, its order, its actions — because nothing exposed it.
 * Adding a module meant editing a migration and a TypeScript file and hoping the
 * two agreed; they did not, for a while, and no test could have noticed.
 *
 * <p>What is left here is only the arithmetic. Every function takes the
 * catalogue or the roles as an argument rather than reading a constant, which is
 * what makes it impossible for this file to disagree with the database.
 */

/** Every permission that exists, as the `RESOURCE:ACTION` strings a token holds. */
export function allPermissions(groups: PermissionGroup[]): string[] {
  return groups.flatMap((group) =>
    group.modules.flatMap((entry) =>
      entry.actions.map((action) => `${entry.key}:${action}`)
    )
  )
}

/**
 * Every action any module has, read first.
 *
 * <p>Read leads because everything else depends on it, and a prerequisite listed
 * second reads as an afterthought. Anything the backend adds later that is not
 * read sorts to the end rather than displacing it.
 */
export function actionColumns(groups: PermissionGroup[]): string[] {
  const seen = new Set<string>()

  // `entry` rather than `module`: assigning to that name is refused, because it
  // shadows the CommonJS binding some tooling still expects to find.
  for (const group of groups) {
    for (const entry of group.modules) {
      for (const action of entry.actions) seen.add(action)
    }
  }

  return ["READ", ...[...seen].filter((action) => action !== "READ")]
}

/** What a role grants on its own, before any per-person exception. */
export function permissionsForRole(roles: Role[], roleKey: string): string[] {
  return roles.find((role) => role.name === roleKey)?.permissions ?? []
}

/**
 * Whether the role already carries everything, leaving nothing to choose.
 *
 * <p>Counted rather than checked against the name "ADMIN". If a second all-access
 * role is ever added, every screen that hides its permission grid keeps working —
 * and if Administrator is ever narrowed, the grid comes back on its own.
 */
export function roleGrantsEverything(
  roles: Role[],
  roleKey: string,
  groups: PermissionGroup[]
): boolean {
  return permissionsForRole(roles, roleKey).length === allPermissions(groups).length
}

/**
 * How a chosen set differs from what the role already gives.
 *
 * <p>This is the shape the backend stores: `user_permissions` holds exceptions,
 * not a copy of everything. Sending the whole set would lose the difference
 * between "this person is a Member" and "this person is a Member who was also
 * given exports", and changing the role later would then leave the old
 * permissions frozen in place.
 */
export function diffFromRole(
  roles: Role[],
  roleKey: string,
  chosen: Set<string>
): { granted: string[]; denied: string[] } {
  const base = new Set(permissionsForRole(roles, roleKey))

  return {
    granted: [...chosen].filter((p) => !base.has(p)).sort(),
    denied: [...base].filter((p) => !chosen.has(p)).sort(),
  }
}

/**
 * The groups a person on this role may be given permissions in.
 *
 * <p>Management is marked `adminOnly` in the database: no member may hold it,
 * however many boxes are ticked for them, and the API refuses rather than
 * silently dropping the attempt. Offering the checkboxes anyway would only
 * produce an error later, so the section is not drawn at all.
 */
export function grantableGroups(
  groups: PermissionGroup[],
  isAdmin: boolean
): PermissionGroup[] {
  if (isAdmin) return groups

  return groups
    .map((group) => ({
      ...group,
      modules: group.modules.filter((entry) => !entry.adminOnly),
    }))
    .filter((group) => group.modules.length > 0)
}
