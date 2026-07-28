import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Dashboard",
}

export default function DashboardPage() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">
        Dashboard
      </h1>
    </div>
  )
}
