import type { Metadata } from "next"

import { PageHeader } from "@/components/layout/pageHeader"
import { PermissionRefused } from "@/components/access/permissionRefused"
import { requireUser } from "@/lib/auth"
import { apiFetch } from "@/lib/api"

export const metadata: Metadata = {
  title: "SEO overview",
}

type Metric = {
  label: string
  value: string
  change: string
}

/**
 * ⚠️ <b>A placeholder module, built to prove the permission model works.</b>
 *
 * <p>The other half of the pair with `/customers`. The development member holds
 * `CUSTOMER:READ` and not `SEO_OVERVIEW:READ`, so signing in as them and visiting
 * both is the whole test: one renders, one refuses, and nothing about the token
 * or the session differs between them.
 */
export default async function SeoOverviewPage() {
  await requireUser()

  const result = await apiFetch<Metric[]>("/api/overview/seo", {
    authenticated: true,
  })

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-6 pb-3">
      <PageHeader
        title="SEO overview"
        description="How the site is doing in search."
      />

      {result.ok ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {result.data.map((metric) => (
            <div
              key={metric.label}
              className="flex flex-col gap-1 rounded-md border bg-card p-4"
            >
              <span className="font-mono text-[0.7rem] tracking-wider text-muted-foreground uppercase">
                {metric.label}
              </span>
              <span className="font-heading text-xl font-semibold tracking-tight">
                {metric.value}
              </span>
              <span
                className={
                  metric.change.startsWith("-")
                    ? "text-xs text-destructive"
                    : "text-xs text-success"
                }
              >
                {metric.change}
              </span>
            </div>
          ))}
        </div>
      ) : result.error.status === 403 ? (
        <PermissionRefused
          module="the SEO overview"
          permission="SEO_OVERVIEW:READ"
        />
      ) : (
        <p className="text-sm text-muted-foreground">{result.error.message}</p>
      )}
    </div>
  )
}
