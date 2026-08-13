import {
  Activity,
  LayoutDashboard,
  LifeBuoy,
  Settings,
  Share2,
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
  /**
   * Only shown to administrators.
   *
   * <p>Not a nicety. Every route under Management is admin-only in the database,
   * so a member following this link gets a 403 — and a menu entry that always
   * refuses is worse than no entry: it reads as something they are supposed to
   * have and cannot, rather than something that was never theirs.
   *
   * <p>Hiding it is not what stops them. Middleware refuses the route and the
   * backend refuses the request; this only decides what to draw.
   */
  adminOnly?: boolean
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
    adminOnly: true,
    items: [
      { title: "Users", href: "/users", icon: UserCog },
      { title: "System Health", href: "/system-health", icon: Activity },
      // Roles & Permissions used to sit here and no longer does. The screen
      // still exists at /roles-permissions, but changing somebody's permissions
      // only makes sense once you have said whose — so it is reached by
      // "Change permissions" on an account, which carries the person in the URL,
      // rather than by a link that arrives with nobody selected.
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
