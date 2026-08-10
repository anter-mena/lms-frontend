import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight, ShieldCheck, UserRound } from "lucide-react"

import { requireUser } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Settings",
}

/**
 * The way in to everything under /settings.
 *
 * <p>This was a redirect to /settings/profile at first, which meant the only
 * way to discover Security was to already know it existed. A hub costs one
 * click and answers "what can I change here?" without guessing.
 */
const SECTIONS = [
  {
    title: "Profile",
    description: "Your name, email address and contact details.",
    href: "/settings/profile",
    icon: UserRound,
  },
  {
    title: "Security",
    description:
      "Two-factor authentication, password, and how this account is protected.",
    href: "/settings/security",
    icon: ShieldCheck,
  },
]

export default async function SettingsPage() {
  await requireUser()

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your account and how you sign in.
        </p>
      </div>

      {/* The whole row is the link, not a button inside it — a bigger target,
          and one tab stop per section instead of two. */}
      <div className="flex max-w-lg flex-col gap-2">
        {SECTIONS.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="group flex items-start gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50"
          >
            <section.icon
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              aria-hidden
            />

            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="text-sm font-medium">{section.title}</p>
              <p className="text-sm text-muted-foreground">
                {section.description}
              </p>
            </div>

            <ChevronRight
              className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        ))}
      </div>
    </div>
  )
}
