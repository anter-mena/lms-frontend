import { Button } from "@/components/ui/button"

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#4285F4"
        d="M23.06 12.25c0-.85-.08-1.67-.22-2.45H12v4.63h6.2a5.3 5.3 0 0 1-2.3 3.48v2.9h3.72c2.17-2 3.44-4.95 3.44-8.46Z"
      />
      <path
        fill="#34A853"
        d="M12 23.5c3.11 0 5.72-1.03 7.62-2.79l-3.72-2.89c-1.03.69-2.35 1.1-3.9 1.1-3 0-5.54-2.02-6.45-4.75H1.71v2.98A11.5 11.5 0 0 0 12 23.5Z"
      />
      <path
        fill="#FBBC05"
        d="M5.55 14.17a6.9 6.9 0 0 1 0-4.34V6.85H1.71a11.5 11.5 0 0 0 0 10.3l3.84-2.98Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.69 0 3.21.58 4.4 1.72l3.3-3.3C17.71 1.32 15.1.25 12 .25A11.5 11.5 0 0 0 1.71 6.85l3.84 2.98C6.46 7.1 9 4.75 12 4.75Z"
      />
    </svg>
  )
}

function MicrosoftIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path fill="#F25022" d="M2 2h9.5v9.5H2z" />
      <path fill="#7FBA00" d="M12.5 2H22v9.5h-9.5z" />
      <path fill="#00A4EF" d="M2 12.5h9.5V22H2z" />
      <path fill="#FFB900" d="M12.5 12.5H22V22h-9.5z" />
    </svg>
  )
}

/**
 * Institutional SSO. On an internal-only platform this is the path almost
 * everyone takes — staff already hold a company account.
 */
function SsoButtons() {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <Button variant="outline" size="lg" className="h-10 w-full">
        <GoogleIcon className="size-4" />
        Google
      </Button>
      <Button variant="outline" size="lg" className="h-10 w-full">
        <MicrosoftIcon className="size-4" />
        Microsoft
      </Button>
    </div>
  )
}

export { SsoButtons }
