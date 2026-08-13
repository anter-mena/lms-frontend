/**
 * Turning raw numbers into something a person reads.
 *
 * <p>Kept out of the API on purpose: the backend should not have to decide
 * whether 8641559 reads as "8.6 MB" or "8.2 MiB", and a second screen wanting the
 * other one should not need a second endpoint.
 */

/**
 * Bytes, in the units people actually use.
 *
 * <p>Powers of 1000, not 1024. Disk manufacturers, cloud providers and `df -h`
 * all say a gigabyte is a billion bytes, and a page reporting 145 GB where the
 * hosting panel says 145 GB is worth more than being technically correct about
 * gibibytes.
 */
export function bytes(value: number, digits = 1): string {
  if (!Number.isFinite(value) || value <= 0) return "0 B"

  const units = ["B", "kB", "MB", "GB", "TB"]
  const exponent = Math.min(
    Math.floor(Math.log10(value) / 3),
    units.length - 1
  )
  const scaled = value / 1000 ** exponent

  // No decimal on plain bytes, and none once the number is large enough to carry
  // the meaning on its own — "145 GB" beats "144.9 GB".
  const places = exponent === 0 ? 0 : scaled >= 100 ? 0 : digits
  return `${scaled.toFixed(places)} ${units[exponent]}`
}

/** Bytes per second, as a network speed. */
export function bitsPerSecond(bytesPerSecond: number): string {
  const bits = bytesPerSecond * 8
  if (bits < 1000) return `${Math.round(bits)} bps`
  if (bits < 1_000_000) return `${(bits / 1000).toFixed(1)} kbps`
  return `${(bits / 1_000_000).toFixed(1)} Mbps`
}

/**
 * A duration as the largest unit that still says something.
 *
 * <p>"2 weeks" rather than "1,209,600 seconds". Precision past the leading unit
 * is noise for an uptime — nobody has ever needed to know it was two weeks and
 * four hours.
 */
export function duration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 60) {
    return `${Math.max(0, Math.round(seconds))}s`
  }

  const units: [number, string, string][] = [
    [31_536_000, "year", "years"],
    [2_592_000, "month", "months"],
    [604_800, "week", "weeks"],
    [86_400, "day", "days"],
    [3_600, "hour", "hours"],
    [60, "minute", "minutes"],
  ]

  for (const [size, one, many] of units) {
    if (seconds >= size) {
      const count = Math.floor(seconds / size)
      return `${count} ${count === 1 ? one : many}`
    }
  }

  return `${Math.round(seconds)}s`
}

/** A percentage, with one decimal only while it still matters. */
export function percent(value: number, digits = 0): string {
  if (!Number.isFinite(value)) return "—"
  return `${value.toFixed(value < 10 && digits === 0 ? 1 : digits)}%`
}

/** Thousands separators, so 1204 does not read as 12:04. */
export function count(value: number): string {
  return new Intl.NumberFormat("en-GB").format(Math.round(value))
}
