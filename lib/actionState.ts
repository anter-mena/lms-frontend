/**
 * What a Server Action hands back to the form that called it.
 *
 * <p><b>Here rather than beside the actions, and that is not tidiness.</b> A file
 * marked `"use server"` may export <em>only</em> async functions — every export
 * becomes a callable endpoint, so a plain object among them is refused. Exporting
 * one constant from `users/actions.ts` broke every action in it at once, with a
 * 500 on each and nothing on screen to say why.
 *
 * <p>So anything that is not an action lives out here. Types are erased and would
 * have been harmless, but keeping them together with the constant means there is
 * one obvious place to look and no judgement call about which exports are safe.
 */

/** The result of one action. `ok` decides whether a dialog closes. */
export type ActionState = {
  ok?: boolean
  message?: string
  fieldErrors?: Record<string, string>
}

/** Nothing has been submitted yet. Every form starts from this same object. */
export const IDLE: ActionState = {}
