<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# File naming: camelCase

Source files and folders use **camelCase**, not kebab-case.

- `components/forgotPassword/forgotPasswordForm.tsx`, `components/layout/navItems.ts`, `components/ui/inputOtp.tsx`
- Applies to every file and folder you create under `components/` and `lib/`.

## Two exceptions — do not "fix" these

**1. Next.js reserved filenames.** The framework matches these by exact name. Renaming them does not fail loudly, it just silently stops the file from being used:

- `not-found.tsx`, `global-error.tsx` — keep the hyphen
- `page.tsx`, `layout.tsx`, `error.tsx`, `forbidden.tsx`, `unauthorized.tsx`, `route.ts`, `loading.tsx`, `template.tsx`, `default.tsx`

**2. Route folders under `app/`.** A folder name *is* the URL segment, so `app/(auth)/forgot-password/` serves `/forgot-password`. URLs stay kebab-case by deliberate choice — camelCase URLs are unconventional and case-sensitive. Route groups like `(auth)` and `(app)` follow the same rule.

Everything else — component files, non-route folders, `lib/` modules — is camelCase.
