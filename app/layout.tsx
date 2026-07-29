import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { LiquidGlassFilter } from "@/components/ui/liquidGlass";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Norden Capital — Learning Management System",
    template: "%s · Norden Capital",
  },
  description:
    "Courses, coursework, and progress for students, instructors, and administrators.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        {/* One definition for every glass surface in the app — SVG filter ids
            are document-global. */}
        <LiquidGlassFilter />
        {/* theme="light" is pinned deliberately. The generated Toaster reads
            next-themes, which without a ThemeProvider falls back to "system" —
            so on a machine set to dark, toasts would render dark against this
            app, which is always light until dark mode is actually wired up.
            Passing it here rather than editing the component keeps that file
            matching upstream. Drop this prop when a ThemeProvider lands. */}
        <Toaster theme="light" />
      </body>
    </html>
  );
}
