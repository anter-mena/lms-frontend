/**
 * Counting down to a moment, in a file both sides can use.
 *
 * <p>These two live here rather than beside the component that ticks, because
 * that component is `"use client"` — and <b>everything</b> exported from a client
 * module is a client reference, including plain functions. The server can render
 * them as components or pass them as props, but it cannot call them. Trying
 * throws "attempted to call remaining() from the server", which is what happened
 * when they lived there.
 *
 * <p>The server needs them for the first frame, so the value it renders matches
 * what the timer produces a second later. Same reason `actionState` and
 * `userTypes` were split out of their neighbours.
 */

/** Seconds until `targetIso`. Negative once it has passed. */
export function remaining(targetIso: string, now: number): number {
  return (new Date(targetIso).getTime() - now) / 1000
}

/**
 * `06:59:12`, counting down.
 *
 * <p>Seconds, unlike everywhere else on this screen, precisely because this is
 * the one thing meant to be visibly alive. The coarse `duration()` wording would
 * say "in 7 hours" for the next fifty-nine minutes, which looks identical to a
 * frozen page.
 */
export function formatCountdown(seconds: number): string {
  if (seconds <= 0) return "due now"

  const whole = Math.floor(seconds)
  const days = Math.floor(whole / 86_400)
  const hours = Math.floor((whole % 86_400) / 3600)
  const minutes = Math.floor((whole % 3600) / 60)
  const secs = whole % 60

  const clock = [hours, minutes, secs]
    .map((n) => String(n).padStart(2, "0"))
    .join(":")

  return days > 0 ? `${days}d ${clock}` : clock
}
