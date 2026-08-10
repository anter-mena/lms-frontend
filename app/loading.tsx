import { PageLoader } from "@/components/ui/pageLoader"

/**
 * The whole window, while any page anywhere works out what it should be.
 *
 * <p><b>Why it lives at the root and nowhere else.</b> A `loading.tsx` replaces
 * everything <em>below</em> it and nothing above it. Placed inside `(app)`, it
 * sits within that group's layout — so the sidebar and navbar render first and
 * the loader only fills the gap between them, which is not a loading screen so
 * much as a hole in a half-drawn app. Here there is nothing above it but
 * `<body>`, so it covers the lot: shell included, on every route.
 *
 * <p>The cost is real and deliberate: moving between two pages of the signed-in
 * app blanks the sidebar too, rather than keeping it while the content swaps. In
 * exchange, a page that ends up redirecting — not enrolled, session expired —
 * never shows a flicker of an app the person is not allowed into. Guarding
 * against being shown the wrong thing is worth more than smoothness between two
 * things they are already allowed to see.
 */
export default function Loading() {
  return <PageLoader />
}
