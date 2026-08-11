import type { UserDetailData } from "@/components/users/userDetail"

/**
 * ⚠️ An invented account, for the screens that need one person rather than a list.
 *
 * <p>Here rather than in a page because two now need it — the detail screen and
 * the permission editor — and two copies of a fake person is two things to keep
 * in step for no reason. It is also one file to delete once
 * `GET /api/users/{id}` exists.
 *
 * <p>Deliberately not a tidy administrator with everything switched on: this one
 * has a partial permission set so the matrix shows ticks and dashes rather than a
 * solid column, no phone number so the "not given" state is visible, and a
 * verified email against a two-factor enrolment that happened later.
 *
 * <p>Only the id comes from the URL, so every account looks like Nadia until the
 * endpoint lands.
 */
export function placeholderUser(id: number): UserDetailData {
  return {
    id,
    firstName: "Nadia",
    lastName: "Cherkaoui",
    email: "nadia.cherkaoui@nordencapital.com",
    phone: null,
    role: "MEMBER",
    status: "ACTIVE",
    mfaEnabled: true,
    permissions: [
      "RECORD:READ",
      "RECORD:CREATE",
      "RECORD:UPDATE",
      "REPORT:READ",
      "REPORT:EXPORT",
    ],
    createdAt: "2025-11-04T09:12:00Z",
    emailVerifiedAt: "2025-11-04T09:41:00Z",
    mfaConfirmedAt: "2025-11-06T14:20:00Z",
    lastLoginAt: "2026-08-10T07:35:00Z",
    // Newest first, and deliberately mixed: a log of nothing but sign-ins tells
    // you the layout works and nothing about whether it is readable.
    activity: [
      { kind: "signIn", action: "Signed in", at: "2026-08-10T07:35:00Z" },
      {
        kind: "export",
        action: "Exported",
        subject: "the quarterly report",
        at: "2026-08-09T16:02:00Z",
      },
      {
        kind: "update",
        action: "Updated",
        subject: "record #1042",
        at: "2026-08-09T15:48:00Z",
      },
      {
        kind: "create",
        action: "Created",
        subject: "record #1042",
        at: "2026-08-09T11:20:00Z",
      },
      {
        kind: "delete",
        action: "Deleted",
        subject: "record #0987",
        at: "2026-08-07T09:14:00Z",
      },
      {
        kind: "security",
        action: "Enrolled in two-factor",
        at: "2025-11-06T14:20:00Z",
      },
    ],
  }
}
