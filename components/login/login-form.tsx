import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

function LoginForm() {
  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="email">Work email</FieldLabel>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@lumen.com"
          className="h-10"
        />
      </Field>

      <Field>
        <div className="flex items-center justify-between gap-2">
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Link
            href="/forgot-password"
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          className="h-10"
        />
      </Field>

      <Field orientation="horizontal">
        <Checkbox id="remember" defaultChecked />
        <FieldLabel htmlFor="remember" className="font-normal">
          Keep me signed in for 30 days
        </FieldLabel>
      </Field>

      {/* Goes to /otp because verification is the next step in the flow. */}
      <Button size="lg" className="h-10 w-full" render={<Link href="/otp" />}>
        Continue
      </Button>

      {/* No self-signup: accounts are provisioned internally, so the only
          dead end worth catching here is someone who can't get in. */}
      <FieldDescription className="text-center">
        Can&apos;t access your account?{" "}
        <Link href="/support" className="text-foreground">
          Contact IT support
        </Link>
      </FieldDescription>
    </FieldGroup>
  )
}

export { LoginForm }
