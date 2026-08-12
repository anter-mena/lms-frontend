"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { apiFetch } from "@/lib/api"
import type { ActionState } from "@/lib/actionState"

/**
 * Everything that changes a user account.
 *
 * <p>Server Actions rather than fetches from the browser, for the same reason
 * everything else here is: the access token lives in an httpOnly cookie that
 * client JavaScript cannot read. It also means the pages showing what just
 * changed can be revalidated in the same round trip, so a deactivated account
 * appears deactivated without anyone reloading.
 *
 * <p>⚠️ <b>Only async functions may be exported from here.</b> Every export in a
 * `"use server"` file becomes a callable endpoint, so a type or a constant among
 * them is refused — and the failure is not local: it breaks every action in the
 * file, each one 500ing with nothing on screen to explain it. Shared shapes live
 * in `lib/actionState.ts` for that reason.
 *
 * <p>Every one of these returns rather than throws. The backend refuses several
 * of them on purpose — the last active administrator, your own account, a
 * duplicate email — and those refusals are the most useful thing it says. A
 * thrown error would replace a precise sentence with the generic error page.
 */

/**
 * Repaints every screen that shows this account.
 *
 * <p>The list and the detail page can both be open in history, and an action
 * taken from one has to be true on the other. Revalidating the layout rather
 * than the page catches the nested routes under `/users` in one call.
 */
function refreshUserScreens(id?: number | string) {
  revalidatePath("/users")
  if (id !== undefined) revalidatePath(`/users/${id}`)
}

/**
 * Turns a failed call into something worth reading.
 *
 * <p>The backend's own message is used whenever there is one: "This is the last
 * active administrator. Promote somebody else first." is the entire value of the
 * request having failed, and replacing it with "Something went wrong" throws
 * away the only part anybody needed.
 */
function failure(error: { status: number; message: string; fieldErrors?: Record<string, string> }): ActionState {
  if (error.status === 401) {
    // Not a failure of this action — the session went. Sending them to sign in
    // beats an error inside a dialog they can no longer do anything with.
    redirect("/login?reason=session-expired")
  }

  return {
    ok: false,
    message: error.message,
    fieldErrors: error.fieldErrors,
  }
}

/** Creating an account with a chosen role. Needs USER:CREATE. */
export async function createUser(formData: FormData): Promise<ActionState> {
  const result = await apiFetch<{ id: number }>("/api/users", {
    method: "POST",
    authenticated: true,
    body: JSON.stringify({
      firstName: String(formData.get("firstName") ?? "").trim(),
      lastName: String(formData.get("lastName") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
      password: String(formData.get("password") ?? ""),
      role: String(formData.get("role") ?? "MEMBER"),
    }),
  })

  if (!result.ok) return failure(result.error)

  refreshUserScreens()
  // Straight to the account that was just made, which is where somebody wants to
  // be — to check it, or to give them permissions.
  redirect(`/users/${result.data.id}`)
}

/** Editing name, email and phone. Nothing here changes what they may do. */
export async function updateUser(id: number, formData: FormData): Promise<ActionState> {
  const result = await apiFetch(`/api/users/${id}`, {
    method: "PATCH",
    authenticated: true,
    body: JSON.stringify({
      firstName: String(formData.get("firstName") ?? "").trim(),
      lastName: String(formData.get("lastName") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
    }),
  })

  if (!result.ok) return failure(result.error)

  refreshUserScreens(id)
  return { ok: true, message: "Details saved." }
}

/**
 * Moving somebody between roles.
 *
 * <p>⚠️ This clears their permission exceptions, on the backend's side. The
 * dialog says so before you confirm; if that copy is ever softened, the
 * behaviour is still this.
 */
export async function changeUserRole(id: number, role: string): Promise<ActionState> {
  const result = await apiFetch(`/api/users/${id}/role`, {
    method: "PATCH",
    authenticated: true,
    body: JSON.stringify({ role }),
  })

  if (!result.ok) return failure(result.error)

  refreshUserScreens(id)
  return { ok: true, message: `Role changed to ${role === "ADMIN" ? "Administrator" : "Member"}.` }
}

/** Switching an account off, or back on. */
export async function changeUserStatus(id: number, status: string): Promise<ActionState> {
  const result = await apiFetch(`/api/users/${id}/status`, {
    method: "PATCH",
    authenticated: true,
    body: JSON.stringify({ status }),
  })

  if (!result.ok) return failure(result.error)

  refreshUserScreens(id)
  return {
    ok: true,
    message: status === "ACTIVE" ? "Account reactivated." : "Account deactivated.",
  }
}

/** An administrator setting somebody else's password, and ending their sessions. */
export async function setUserPassword(id: number, password: string): Promise<ActionState> {
  const result = await apiFetch<{ message: string }>(`/api/users/${id}/password`, {
    method: "POST",
    authenticated: true,
    body: JSON.stringify({ password }),
  })

  if (!result.ok) return failure(result.error)

  refreshUserScreens(id)
  return { ok: true, message: result.data.message }
}

/** Clearing somebody's two-factor so they can enrol again on a new phone. */
export async function resetUserTwoFactor(id: number): Promise<ActionState> {
  const result = await apiFetch<{ message: string }>(`/api/users/${id}/2fa/reset`, {
    method: "POST",
    authenticated: true,
  })

  if (!result.ok) return failure(result.error)

  refreshUserScreens(id)
  return { ok: true, message: result.data.message }
}

/**
 * Replacing somebody's permission exceptions.
 *
 * <p>Differences from their role, not a copy of everything they hold — see the
 * backend's own note. Both lists replace whatever was there, so an empty pair
 * means "no exceptions at all", which is the only way one can be removed.
 */
export async function setUserPermissions(
  id: number,
  granted: string[],
  denied: string[],
  reason?: string
): Promise<ActionState> {
  const result = await apiFetch(`/api/users/${id}/permissions`, {
    method: "PUT",
    authenticated: true,
    body: JSON.stringify({ granted, denied, reason: reason ?? null }),
  })

  if (!result.ok) return failure(result.error)

  refreshUserScreens(id)
  return { ok: true, message: "Permissions saved." }
}
