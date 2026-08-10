import {
  LayoutDashboard,
  LifeBuoy,
  Settings,
  Share2,
  ShieldCheck,
  UserCog,
  Users,
} from "lucide-react"

export type NavSubItem = {
  title: string
  href: string
}

export type NavItem = {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  /** Present on items that expand into a sub-list. */
  items?: NavSubItem[]
}

export type NavSection = {
  title: string
  items: NavItem[]
}

/**
 * The scrolling part of the sidebar.
 *
 * Overview points at /dashboard rather than /overview because that is the one
 * route in here that actually exists — and its children nest under it, so the
 * prefix match lights the parent up when a child is open. Everything else
 * resolves to the 404 page until built.
 */
export const navSections: NavSection[] = [
  {
    title: "Main Menu",
    items: [
      {
        title: "Overview",
        href: "/dashboard",
        icon: LayoutDashboard,
        items: [
          { title: "Email Overview", href: "/dashboard/email" },
          { title: "SEO Overview", href: "/dashboard/seo" },
          { title: "Marketing Overview", href: "/dashboard/marketing" },
        ],
      },
    ],
  },
  {
    title: "Customers",
    items: [
      { title: "Customer List", href: "/customers", icon: Users },
      { title: "Channels", href: "/channels", icon: Share2 },
    ],
  },
  {
    title: "Management",
    items: [
      { title: "Users", href: "/users", icon: UserCog },
      {
        title: "Roles & Permissions",
        href: "/roles-permissions",
        icon: ShieldCheck,
      },
    ],
  },
]

/**
 * Pinned to the bottom of the sidebar, below the scrolling nav — it stays put
 * however long the menu above it gets. The log out button is rendered
 * alongside these in the sidebar rather than listed here, since it submits an
 * action rather than navigating.
 */
export const settingsSection: NavSection = {
  title: "Settings",
  items: [
    { title: "Help Center", href: "/help-center", icon: LifeBuoy },
    // Points at the section root, not /settings/profile: isNavItemActive does a
    // longest-prefix match, so this row stays lit anywhere under /settings —
    // including /settings/security.
    { title: "System Settings", href: "/settings", icon: Settings },
  ],
}

/**
 * Longest-prefix match, so a nested route like /customers/42 still lights up
 * Customer List. Exact-only would leave the sidebar with nothing active there.
 */
export function isNavItemActive(href: string, pathname: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}
