import { Award, BookOpen, CalendarDays, House, User } from "lucide-react"

export type NavItem = {
  title: string
  href: string
}

export type NavSection = {
  title: string
  /** Where the rail icon navigates — normally the first child. */
  href: string
  icon: React.ComponentType<{ className?: string }>
  /** Rendered in the secondary panel when this section is active. */
  items: NavItem[]
}

/** Top of the rail. */
export const navSections: NavSection[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: House,
    items: [
      { title: "Overview", href: "/dashboard" },
      { title: "My progress", href: "/dashboard/progress" },
      { title: "Analytics", href: "/dashboard/analytics" },
      { title: "Reports", href: "/dashboard/reports" },
    ],
  },
  {
    title: "Courses",
    href: "/courses",
    icon: BookOpen,
    items: [
      { title: "Enrolled", href: "/courses" },
      { title: "Catalog", href: "/courses/catalog" },
      { title: "Archived", href: "/courses/archived" },
    ],
  },
  {
    title: "Schedule",
    href: "/schedule",
    icon: CalendarDays,
    items: [
      { title: "Calendar", href: "/schedule" },
      { title: "Deadlines", href: "/schedule/deadlines" },
      { title: "Live sessions", href: "/schedule/sessions" },
    ],
  },
  {
    title: "Grades",
    href: "/grades",
    icon: Award,
    items: [
      { title: "All grades", href: "/grades" },
      { title: "Assignments", href: "/grades/assignments" },
      { title: "Certificates", href: "/grades/certificates" },
    ],
  },
]

/** Pinned to the bottom of the rail. */
export const accountSection: NavSection = {
  title: "Account",
  href: "/profile",
  icon: User,
  items: [
    { title: "Profile", href: "/profile" },
    { title: "Settings", href: "/settings" },
    { title: "Notifications", href: "/settings/notifications" },
  ],
}

export const allSections: NavSection[] = [...navSections, accountSection]

/**
 * The panel is never empty — you are always inside some section — so this falls
 * back to the first section rather than returning undefined.
 */
export function findActiveSection(pathname: string): NavSection {
  return (
    allSections.find((section) =>
      section.items.some(
        (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
      )
    ) ?? allSections[0]
  )
}

/**
 * Longest-prefix wins, so `/dashboard/analytics` highlights Analytics rather
 * than Overview — whose `/dashboard` href would otherwise prefix-match it too.
 */
export function findActiveItemHref(
  section: NavSection,
  pathname: string
): string | undefined {
  const exact = section.items.find((item) => item.href === pathname)
  if (exact) return exact.href

  return section.items
    .filter((item) => pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href
}
