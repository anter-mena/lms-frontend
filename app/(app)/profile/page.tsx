import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Profile",
}

export default function ProfilePage() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">
        Profile
      </h1>
    </div>
  )
}
