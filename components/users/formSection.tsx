/**
 * A titled panel, in the same nested shape the stat cards and the table use.
 *
 * <p>Its own file because two forms need it — creating an account and editing
 * one — and a shape copied into both is a shape that drifts. It is the only
 * thing those two forms share, which is itself the argument for them being
 * separate components rather than one with a `mode` prop.
 *
 * <p>The heading sits on the grey shell rather than inside the white card. That
 * is what the two layers are for: the outer one says what this is, the inner one
 * holds what you actually touch. With the heading inside, the grey was a 2px rim
 * doing nothing and the card had a label glued to its own contents.
 *
 * <p>Padded to `px-4` so the heading's left edge lands on the same line as the
 * fields below it — the inner card's own `p-4` starts from the same 2px inset,
 * so any other value would have them a few pixels out of step.
 *
 * <p>`flex-1` on the card is what lets a section fill a row rather than stopping
 * at its content. Side by side, the shorter of two sections would otherwise end
 * early and leave the grey shell hanging below it.
 */
function Section({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col rounded-md border bg-muted/40 p-0.5">
      {/* The page header's treatment, one level down: same sizes, same weight,
          same gap. The old pairing had a tiny mono label over a text-sm sentence,
          so the description outweighed the thing it described. */}
      <div className="flex flex-col gap-1 px-4 pt-3 pb-3">
        <h2 className="font-heading text-lg font-semibold tracking-tight">
          {title}
        </h2>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      <div className="flex flex-1 flex-col gap-4 rounded-sm border bg-card p-4">
        {children}
      </div>
    </section>
  )
}

export { Section }
