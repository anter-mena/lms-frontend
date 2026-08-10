"use client"

import { useState } from "react"
import { Check, Copy, Download, TriangleAlert } from "lucide-react"

import { Button } from "@/components/ui/button"

/**
 * Recovery codes, in the only moment they exist as plaintext.
 *
 * <p>The database holds bcrypt hashes, so nothing — not this app, not an
 * administrator, not someone holding the database — can produce these again.
 * A refresh loses them for good.
 *
 * <p>Shared by enrolment and by regenerating a set, because the hazard and the
 * handling are identical either way. Callers supply their own heading; this
 * owns the warning, the codes and the two ways of getting them out.
 */
function RecoveryCodesPanel({
  codes,
  email,
}: {
  codes: string[]
  email: string
}) {
  const [copied, setCopied] = useState(false)

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(codes.join("\n"))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access can be refused outright; the codes below are
      // selectable, so there is still a way to get them.
    }
  }

  function download() {
    // Built on click rather than at render: it reads the clock, and doing that
    // while rendering would differ between server and client.
    const contents = [
      "Norden Capital — two-factor recovery codes",
      `Account: ${email}`,
      `Generated: ${new Date().toISOString()}`,
      "",
      ...codes,
      "",
      "Each code works once. Keep this file somewhere only you can reach.",
    ].join("\n")

    const url = URL.createObjectURL(
      new Blob([contents], { type: "text/plain;charset=utf-8" })
    )
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = "norden-capital-recovery-codes.txt"
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
        <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
        <p className="text-sm text-destructive">
          This is the only time these are shown. Only scrambled copies are
          stored, so nobody can retrieve them later — not support, not an
          administrator. Save them before you continue.
        </p>
      </div>

      <ul className="grid grid-cols-2 gap-2 rounded-lg border bg-muted/40 p-3">
        {codes.map((code) => (
          <li
            key={code}
            className="text-center font-mono text-sm tracking-wider select-all"
          >
            {code}
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" onClick={copyAll}>
          {copied ? <Check data-icon="inline-start" /> : <Copy data-icon="inline-start" />}
          {copied ? "Copied" : "Copy all"}
        </Button>
        <Button type="button" variant="outline" onClick={download}>
          <Download data-icon="inline-start" />
          Download
        </Button>
      </div>
    </>
  )
}

export { RecoveryCodesPanel }
