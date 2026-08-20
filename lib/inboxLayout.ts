/**
 * Where the inbox divider sits, in a file the server and the browser share.
 *
 * <p><b>A cookie, not `localStorage` — and the difference is the flash.</b>
 * `localStorage` cannot be read while the page is being rendered on the server,
 * so the first HTML always carried the default split and the saved one was
 * applied a moment later, in the browser. That is what made the panes visibly
 * jump on every reload.
 *
 * <p>A cookie travels with the request. The server reads it, renders the panes
 * at the width they were left at, and there is nothing to correct afterwards —
 * no jump, and no loader needed to hide one.
 *
 * <p>⚠️ Worth being precise, because it reads like a contradiction: this
 * application may not write cookies during a <em>render</em> — that is Next's
 * rule, and it is why signing in needed a Server Action. It says nothing about
 * the browser. `document.cookie` from a client component is ordinary DOM, and
 * dragging a divider is about as client-side as an interaction gets.
 */

/** Read by the page on the server, written by the shell in the browser. */
export const PANES_COOKIE = "inbox_panes"

/** A year. The divider is a preference, not a session. */
export const PANES_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

/**
 * What the panel group hands back and takes in: a size per panel id.
 *
 * <p>Declared here rather than imported from the library so the server page can
 * name the shape without pulling a client-side layout engine into its bundle.
 */
export type PaneLayout = Record<string, number>

/**
 * The cookie's value, or nothing if it is missing or malformed.
 *
 * <p>Malformed is not hypothetical: this is a cookie, which means anybody can
 * type anything into it, and a half-written value survives a browser crash.
 * Every failure returns undefined, which the panel group reads as "use the
 * defaults" — the same thing a first-time visitor gets.
 */
export function parsePaneLayout(raw: string | undefined): PaneLayout | undefined {
  if (!raw) return undefined

  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(raw))
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return undefined

    const layout: PaneLayout = {}
    for (const [id, size] of Object.entries(parsed as Record<string, unknown>)) {
      // A NaN or a string here would be handed straight to the layout engine and
      // produce a pane of no width, which looks exactly like the bug this whole
      // file exists to remove.
      if (typeof size !== "number" || !Number.isFinite(size)) return undefined
      layout[id] = size
    }

    return Object.keys(layout).length > 0 ? layout : undefined
  } catch {
    return undefined
  }
}
