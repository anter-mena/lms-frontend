import type { Metadata } from "next"

import { PageHeader } from "@/components/layout/pageHeader"
import { PermissionRefused } from "@/components/access/permissionRefused"
import { requireUser } from "@/lib/auth"
import { apiFetch } from "@/lib/api"

export const metadata: Metadata = {
  title: "Customer list",
}

type Customer = {
  id: number
  name: string
  channel: string
  status: string
}

/**
 * ⚠️ <b>A placeholder module, built to prove the permission model works.</b>
 *
 * <p>The rows are invented and the backend has no customer table. What is real is
 * that `GET /api/customers` demands `CUSTOMER:READ`, checked against the database
 * on every request — so this page opens for somebody who holds it and refuses
 * somebody who does not, with the same token in the same session.
 *
 * <p>Pair it with `/dashboard/seo`, which demands a permission the development
 * member deliberately does not have. One of the two refuses; that is the test.
 */
export default async function CustomersPage() {
  await requireUser()

  const result = await apiFetch<Customer[]>("/api/customers", {
    authenticated: true,
  })

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-6 pb-3">
      <PageHeader
        title="Customer list"
        description="Everyone the company sells to, and how they arrived."
      />

      {result.ok ? (
        <div className="overflow-hidden rounded-md border bg-card">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2.5 pl-4 text-left font-mono text-[0.7rem] font-medium tracking-wider text-muted-foreground uppercase">
                  Customer
                </th>
                <th className="px-4 py-2.5 text-left font-mono text-[0.7rem] font-medium tracking-wider text-muted-foreground uppercase">
                  Channel
                </th>
                <th className="px-4 py-2.5 text-left font-mono text-[0.7rem] font-medium tracking-wider text-muted-foreground uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {result.data.map((customer) => (
                <tr key={customer.id} className="border-b last:border-b-0">
                  <td className="py-2.5 pl-4 font-medium">{customer.name}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {customer.channel}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {customer.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : result.error.status === 403 ? (
        <PermissionRefused module="the customer list" permission="CUSTOMER:READ" />
      ) : (
        <p className="text-sm text-muted-foreground">{result.error.message}</p>
      )}
    </div>
  )
}
