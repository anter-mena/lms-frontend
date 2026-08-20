import { cn } from "@/lib/utils"

/**
 * "There is something new here."
 *
 * <p>Lifted out of the navbar's inbox button so the folder navigation could use
 * the same one. It was inline there, and the moment a second place needed to say
 * the same thing, two copies would have been two marks that agreed until one of
 * them was adjusted.
 *
 * <p>Two dots stacked: one expanding and fading outward, one solid on top. The
 * animated ring alone would spend most of its cycle nearly invisible, so the
 * marker would appear to blink out.
 *
 * <p>⚠️ <b>Decorative, and it has to be paired with words.</b> `aria-hidden`
 * because a dot is not a sentence — whatever carries this needs the fact in its
 * own label, or a screen reader is told nothing at all. The navbar button says
 * "Inbox"; the folder buttons put the count in a tooltip.
 */
function NewMark({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("absolute flex size-2", className)}>
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-destructive opacity-75" />
      <span className="relative inline-flex size-2 rounded-full bg-destructive ring-2 ring-background" />
    </span>
  )
}

export { NewMark }
