"use client"

import Link from "next/link"
import { useActionState, useState } from "react"
import { EyeIcon, EyeOffIcon } from "lucide-react"

import { login, type LoginState } from "@/app/(auth)/login/actions"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

const initialState: LoginState = {}

function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState)
  const [showPassword, setShowPassword] = useState(false)

  return (
    <form action={formAction}>
      {/* No height overrides at all — Input and Button both default to h-8, the
          design system's base tier. Anything smaller means overriding the
          system downward, which would put login out of step again. */}
      <FieldGroup className="gap-3">
        {/* Whatever the backend said, passed through unchanged. It answers
            identically for a wrong password and an account that does not exist,
            which is deliberate — anything more specific would let someone work
            out which email addresses have accounts. */}
        {state.message ? (
          <p
            role="alert"
            aria-live="polite"
            className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {state.message}
          </p>
        ) : null}

        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="m@example.com"
            required
            aria-invalid={Boolean(state.fieldErrors?.email)}
          />
          {state.fieldErrors?.email ? (
            <FieldError>{state.fieldErrors.email}</FieldError>
          ) : null}
        </Field>

        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Link
              href="/forgot-password"
              className="ml-auto text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              className="pr-8"
              required
              aria-invalid={Boolean(state.fieldErrors?.password)}
            />
            {/* type="button" is load-bearing — without it this submits the form. */}
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 h-full w-8 px-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
            >
              {showPassword ? (
                <EyeOffIcon className="size-4" />
              ) : (
                <EyeIcon className="size-4" />
              )}
              <span className="sr-only">
                {showPassword ? "Hide password" : "Show password"}
              </span>
            </Button>
          </div>
          {state.fieldErrors?.password ? (
            <FieldError>{state.fieldErrors.password}</FieldError>
          ) : null}
        </Field>

        {/* No "keep me signed in" checkbox: the backend has no remember-me, so
            one would silently do nothing — every session lasts 24 hours whether
            it was ticked or not. */}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Signing in…" : "Login"}
        </Button>
      </FieldGroup>
    </form>
  )
}

export { LoginForm }
