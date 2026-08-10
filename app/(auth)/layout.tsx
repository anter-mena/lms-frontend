import Link from "next/link"
import { Command, LifeBuoy } from "lucide-react"

/**
 * Shared shell for the whole auth flow. Login and OTP are consecutive steps, so
 * they sit in the same column and the brand panel stays put between them —
 * no layout jump mid-flow.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="grid min-h-svh lg:grid-cols-[1fr_minmax(0,32rem)]">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        {/* An outer ceiling only — every auth screen pulls itself in to
            max-w-xs, so this just stops anything new from running wide. */}
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">{children}</div>
        </div>

        {/* col-reverse below lg puts the links above the copyright without
            reordering the DOM — the copyright still comes first in the markup,
            which is the order it should be read in. */}
        <footer className="flex flex-col-reverse items-center gap-1 text-xs text-muted-foreground lg:flex-row lg:justify-between lg:gap-x-4">
          {/* Two groups, not four loose items: justify-between needs exactly
              two children to split apart. With all four it would space them
              evenly across the whole width instead. */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <span>© 2026 Norden Capital</span>
            {/* aria-hidden — the label sits right beside the glyph, so
                announcing both would double up. Hidden below lg to keep the
                stacked mobile footer uncluttered. */}
            <Link
              href="/help-center"
              className="flex items-center gap-1 underline-offset-4 hover:text-foreground hover:underline"
            >
              <LifeBuoy className="hidden size-3 lg:block" aria-hidden />
              Help Center
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
            <Link
              href="/privacy-policy"
              className="underline-offset-4 hover:text-foreground hover:underline"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms-of-use"
              className="underline-offset-4 hover:text-foreground hover:underline"
            >
              Terms of Use
            </Link>
          </div>
        </footer>
      </div>

      <aside className="relative hidden flex-col justify-between overflow-hidden bg-muted p-10 lg:flex">
        {/* Placeholder for artwork or a course-imagery collage. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--color-foreground)_0%,transparent_55%)] opacity-[0.06]"
        />

        {/* self-end, not justify-end: shrinks the row to its content so it sits
            flush against the panel's right padding. */}
        <div className="relative flex items-center gap-2 self-end font-heading text-lg font-semibold">
          {/* drop-shadow, not shadow: box-shadow would trace the SVG's square
              bounding box rather than the glyph itself. */}
          <Command className="size-5 drop-shadow-sm" aria-hidden />
          Norden Capital
        </div>

        <blockquote className="relative mt-auto max-w-md text-sm leading-relaxed text-muted-foreground">
          &ldquo;I finished my certification while working full time. The pacing
          made it possible.&rdquo; — Imane Belkacem, Data Analytics &rsquo;25
        </blockquote>
      </aside>
    </div>
  )
}
