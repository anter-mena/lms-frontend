import { cn } from "@/lib/utils"

/**
 * What fills the screen while a page is deciding what it is.
 *
 * <p>Without one, a route that has to check something server-side paints its
 * layout first and its answer second — so a signed-out visitor sees a flash of
 * the app shell before being sent to sign in, and someone who has not enrolled
 * glimpses the dashboard on the way to the enrolment gate. The flash is not a
 * rendering fault; it is the honest gap between "this route exists" and "you may
 * see it". This covers the gap rather than shortening it.
 *
 * <p>Deliberately not a client component: no state, no effects, nothing added to
 * the browser bundle, and it can be exported straight from a `loading.tsx`.
 */

const SIZES = ["sm", "md", "lg"] as const

type LoaderSize = (typeof SIZES)[number]

/**
 * Square, and the gap between squares. Nothing else changes between sizes.
 *
 * <p>Overall widths are 15px, 20px and 26px. The range is deliberately narrow:
 * 26px read as heavy on a blank screen and 12px vanished, so what is left is the
 * band between those two rather than a general-purpose scale.
 */
const SIZE_CLASSES: Record<
  LoaderSize,
  { pixel: string; gap: string; breathe: string }
> = {
  sm: {
    pixel: "size-[3px]",
    gap: "gap-[3px]",
    breathe: "animate-[pixel-breathe-sm_1.3s_ease-in-out_infinite]",
  },
  md: {
    pixel: "size-1",
    gap: "gap-1",
    breathe: "animate-[pixel-breathe-md_1.3s_ease-in-out_infinite]",
  },
  lg: {
    pixel: "size-1.5",
    gap: "gap-1",
    breathe: "animate-[pixel-breathe-lg_1.3s_ease-in-out_infinite]",
  },
}

/**
 * Nine squares lighting corner to corner.
 *
 * <p>The delay is row + column rather than index, which is what makes the wave
 * travel diagonally instead of reading line by line like text.
 */
function PixelLoader({
  size = "sm",
  className,
}: {
  size?: LoaderSize
  className?: string
}) {
  const { pixel, gap, breathe } = SIZE_CLASSES[size]

  return (
    // The static `gap` stays as the resting value the animation departs from and
    // returns to, and is what shows if the animation never runs.
    <div aria-hidden className={cn("grid grid-cols-3", gap, breathe, className)}>
      {Array.from({ length: 9 }, (_, i) => (
        <span
          key={i}
          className={cn(
            "block rounded-[1px] bg-foreground",
            pixel,
            "animate-[pixel-pulse_1.3s_ease-in-out_infinite]"
          )}
          style={{ animationDelay: `${((i % 3) + Math.floor(i / 3)) * 0.12}s` }}
        />
      ))}
    </div>
  )
}

/**
 * A whole screen of nothing, with the loader in the middle.
 *
 * <p>`min-h-svh` rather than `h-screen`: on mobile, `vh` counts the space behind
 * the browser's own chrome, which drags the centre visibly low.
 */
function PageLoader({
  size = "sm",
  className,
}: {
  size?: LoaderSize
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex min-h-svh w-full items-center justify-center bg-background",
        className
      )}
    >
      <PixelLoader size={size} />
    </div>
  )
}

export { PageLoader, PixelLoader, SIZES, type LoaderSize }
