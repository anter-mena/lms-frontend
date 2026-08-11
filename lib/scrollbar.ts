/**
 * A thin, pale scrollbar with no arrow buttons.
 *
 * <p>Deliberately the `::-webkit-*` pseudo-elements rather than the standard
 * `scrollbar-width` / `scrollbar-color`. Those cannot drop the stepper buttons
 * at the ends, and worse, setting either one makes Chrome ignore the webkit
 * rules entirely — so it is one approach or the other, never both. This buys
 * exact control in Chromium and Safari; Firefox keeps its own scrollbar, which
 * is already thin and unobtrusive there.
 *
 * <p>Both axes are sized, because a table can overflow sideways as well as down
 * and a 4px vertical bar beside a default-width horizontal one looks like a bug.
 *
 * <p>The thumb is a token rather than a fixed grey, so it holds up if the
 * surface underneath ever changes.
 */
export const THIN_SCROLLBAR = [
  "[&::-webkit-scrollbar]:w-1.5",
  "[&::-webkit-scrollbar]:h-1.5",
  "[&::-webkit-scrollbar-track]:bg-transparent",
  "[&::-webkit-scrollbar-thumb]:rounded-full",
  "[&::-webkit-scrollbar-thumb]:bg-foreground/12",
  "hover:[&::-webkit-scrollbar-thumb]:bg-foreground/20",
  // The stepper arrows, and the square where the two bars meet.
  "[&::-webkit-scrollbar-button]:hidden",
  "[&::-webkit-scrollbar-corner]:bg-transparent",
].join(" ")
