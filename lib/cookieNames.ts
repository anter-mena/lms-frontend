/**
 * The two cookie names, on their own so both sides can reach them.
 *
 * <p>They cannot live in `lib/session.ts` any more: that module is `server-only`
 * and reads `next/headers`, neither of which exists in middleware. Middleware
 * needs the MFA name to tear up an abandoned login, so the strings sit here with
 * no imports at all and both sides read from one place rather than repeating a
 * literal that would eventually drift.
 */

/** Holds the access token once a login is fully finished. */
export const SESSION_COOKIE = "lms_session"

/**
 * Issued when the password step succeeds but a second factor is still owed.
 * Opens nothing except the 2FA endpoint, and the backend expires it in 5 minutes.
 */
export const MFA_COOKIE = "lms_mfa"
