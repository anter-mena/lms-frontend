"use client"

import { useEffect, useState } from "react"
import { Check, Copy, Eye, EyeOff, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

/**
 * A password the system chooses, not one the administrator invents.
 *
 * <p>Whoever creates an account should never be picking its first password.
 * Anything a human types here is either weak or reused, and it has to be
 * communicated to the new person anyway — so it is a temporary secret either
 * way. Generating it removes the worst outcome without adding a step.
 *
 * <p>Excludes the characters that get misread when someone reads a password
 * aloud or copies it off a screen: I, l, 1, O and 0. The alphabet is smaller for
 * it, which the length more than pays back.
 */
const ALPHABET = {
  lower: "abcdefghijkmnopqrstuvwxyz",
  upper: "ABCDEFGHJKLMNPQRSTUVWXYZ",
  digits: "23456789",
  symbols: "!@#$%^&*-_=+?",
}

const LENGTH = 18

function generate(): string {
  const pools = Object.values(ALPHABET)
  const all = pools.join("")
  const random = new Uint32Array(LENGTH)
  crypto.getRandomValues(random)

  // One from each pool first, so a generated password can never happen to miss a
  // character class and score badly against its own meter.
  const required = pools.map((pool, i) => pool[random[i] % pool.length])
  const rest = Array.from(
    { length: LENGTH - pools.length },
    (_, i) => all[random[pools.length + i] % all.length]
  )

  // Shuffled, or the first four characters would always be lower, upper, digit,
  // symbol in that order — a pattern worth nothing to guess around.
  const chars = [...required, ...rest]
  const shuffle = new Uint32Array(chars.length)
  crypto.getRandomValues(shuffle)
  for (let i = chars.length - 1; i > 0; i--) {
    const j = shuffle[i] % (i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }

  return chars.join("")
}

/**
 * Four bands, from what the string actually contains rather than a library's
 * opinion. Enough to tell someone their password is fine, which for a generated
 * one is the only answer it will ever give.
 */
function scoreOf(password: string): number {
  if (!password) return 0
  let score = 0
  if (password.length >= 12) score++
  if (password.length >= 16) score++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score++
  return score
}

const BANDS = [
  { label: "Too short", tone: "text-destructive", bar: "bg-destructive" },
  { label: "Weak", tone: "text-destructive", bar: "bg-destructive" },
  { label: "Fair", tone: "text-warning", bar: "bg-warning" },
  { label: "Good", tone: "text-success", bar: "bg-success" },
  { label: "Strong", tone: "text-success", bar: "bg-success" },
]

function GeneratedPassword({
  value,
  onChange,
}: {
  value: string
  onChange: (password: string) => void
}) {
  const [visible, setVisible] = useState(true)
  const [copied, setCopied] = useState(false)

  // Generated after mount, never during render. `crypto.getRandomValues` on the
  // server would produce a different string from the browser's, and React would
  // report a hydration mismatch on the one field nobody would think to suspect.
  useEffect(() => {
    if (!value) onChange(generate())
  }, [value, onChange])

  const score = scoreOf(value)
  const band = BANDS[score]

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access can be refused; the field is selectable either way.
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Input
          readOnly
          type={visible ? "text" : "password"}
          value={value}
          aria-label="Generated password"
          className="h-8 flex-1 rounded-md bg-transparent font-mono tracking-tight"
        />

        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className="rounded-md bg-card"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff /> : <Eye />}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className="rounded-md bg-card"
          onClick={copy}
          aria-label="Copy password"
        >
          {copied ? <Check /> : <Copy />}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className="rounded-md bg-card"
          onClick={() => onChange(generate())}
          aria-label="Generate a new password"
        >
          <RefreshCw />
        </Button>
      </div>

      {/* Four segments rather than one filling bar: a bar reads as a percentage
          of something, and there is no such thing as 63% of a password. */}
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1" aria-hidden>
          {[1, 2, 3, 4].map((step) => (
            <span
              key={step}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                step <= score ? band.bar : "bg-border"
              )}
            />
          ))}
        </div>
        <span className={cn("font-mono text-[0.7rem] font-medium", band.tone)}>
          {band.label}
        </span>
      </div>

      <p className="text-xs text-muted-foreground">
        Shown once, here. Copy it before saving — it is stored scrambled and
        cannot be read back afterwards.
      </p>
    </div>
  )
}

export { GeneratedPassword }
