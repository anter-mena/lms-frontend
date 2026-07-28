import Link from "next/link"

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
      <div className="flex flex-col p-6 md:p-10">
        <header>
          <Link href="/login" className="font-heading text-sm font-semibold tracking-tight">
            Lumen
          </Link>
        </header>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">{children}</div>
        </div>

        <footer className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground lg:justify-start">
          <span>© 2026 Lumen</span>
          <Link href="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-foreground">
            Terms
          </Link>
          <Link href="/support" className="hover:text-foreground">
            Support
          </Link>
        </footer>
      </div>

      <aside className="relative hidden flex-col justify-between overflow-hidden bg-muted p-10 lg:flex">
        {/* Placeholder for artwork or a course-imagery collage. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--color-foreground)_0%,transparent_55%)] opacity-[0.06]"
        />

        <blockquote className="relative mt-auto max-w-md">
          <p className="font-heading text-2xl leading-snug font-medium text-balance">
            &ldquo;I finished my certification while working full time. The
            pacing made it possible.&rdquo;
          </p>
          <footer className="mt-4 text-sm text-muted-foreground">
            Imane Belkacem — Data Analytics, Class of 2025
          </footer>
        </blockquote>

        <dl className="relative mt-10 grid grid-cols-3 gap-6 border-t pt-6">
          <div>
            <dt className="text-xs text-muted-foreground">Learners</dt>
            <dd className="font-heading text-xl font-semibold">24k</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Courses</dt>
            <dd className="font-heading text-xl font-semibold">380</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Completion</dt>
            <dd className="font-heading text-xl font-semibold">91%</dd>
          </div>
        </dl>
      </aside>
    </div>
  )
}
