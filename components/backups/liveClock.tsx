"use client"

import { useEffect, useState } from "react"

import { formatCountdown } from "@/lib/countdown"
import { duration } from "@/lib/format"

/**
 * The two numbers on this page that move on their own.
 *
 * <p>Everything else here is rendered on the server and stays put. These two
 * cannot: a countdown that only updates when you reload is not a countdown, and
 * "data at risk" is a number that grows by definition.
 *
 * <p><b>Both start from a value the server worked out</b> and take it as a prop.
 * Reading the clock during the first render would produce one answer on the
 * server and a different one a moment later in the browser, and React reports
 * that as a mismatch.
 *
 * <p>Nothing is set during the effect itself either — only inside the interval
 * callback. Setting state while an effect is running forces an extra render
 * before the browser has painted, and the lint rule that catches it is right to.
 *
 * <p>⚠️ The arithmetic lives in `lib/countdown`, not here. Everything exported
 * from a `"use client"` file is a client reference, so a helper defined here
 * cannot be called by the server component that needs it for the first frame.
 */

function Countdown({
  targetIso,
  /** What the server rendered, so the first frame matches exactly. */
  initial,
}: {
  targetIso: string
  initial: string
}) {
  const [label, setLabel] = useState(initial)

  useEffect(() => {
    const timer = setInterval(() => {
      setLabel(formatCountdown((new Date(targetIso).getTime() - Date.now()) / 1000))
    }, 1000)

    return () => clearInterval(timer)
  }, [targetIso])

  return <span className="tabular-nums">{label}</span>
}

/**
 * How long since a moment, in the coarse wording used elsewhere.
 *
 * <p>Ticks once a minute rather than once a second. The output only changes on
 * the hour, so a second-by-second timer would be sixty times the work for the
 * same words on screen.
 */
function Elapsed({ sinceIso, initial }: { sinceIso: string; initial: string }) {
  const [label, setLabel] = useState(initial)

  useEffect(() => {
    const timer = setInterval(() => {
      const seconds = Math.max(0, (Date.now() - new Date(sinceIso).getTime()) / 1000)
      setLabel(duration(seconds))
    }, 60_000)

    return () => clearInterval(timer)
  }, [sinceIso])

  return <span className="tabular-nums">{label}</span>
}

export { Countdown, Elapsed }
