import { cn } from "@/lib/utils"

/**
 * Shared layout for every error screen (404, 403, 401, 500). Kept presentational
 * and directive-free so both server pages (`not-found`) and client error
 * boundaries (`error`, `global-error`) can render it.
 */
function ErrorState({
  code,
  icon: Icon,
  title,
  description,
  className,
  children,
}: {
  code: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  className?: string
  children?: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "flex min-h-svh flex-col items-center justify-center gap-6 p-6",
        className
      )}
    >
      <div className="flex max-w-sm flex-col items-center gap-3 text-center">
        <span className="flex size-10 items-center justify-center rounded-full bg-muted">
          <Icon className="size-5" />
        </span>
        <span className="font-mono text-xs tracking-widest text-muted-foreground tabular-nums">
          {code}
        </span>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-balance">
          {title}
        </h1>
        <p className="text-sm text-muted-foreground text-balance">
          {description}
        </p>
      </div>

      {children && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {children}
        </div>
      )}
    </div>
  )
}

export { ErrorState }
