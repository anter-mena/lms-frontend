const FILTER_ID = "liquid-glass"

/**
 * The displacement map behind the effect.
 *
 * SVG filter ids are document-global, so this is mounted once per document and
 * every glass surface points at it — emitting it per-surface would mean
 * duplicate ids. It lives in the root layout, and again in global-error.tsx,
 * which replaces the root layout when it renders and so would not otherwise
 * have it.
 *
 * The feTurbulence -> feGaussianBlur -> feDisplacementMap chain and its values
 * come from the published recipes for recreating Apple's Liquid Glass in the
 * browser, not from guesswork. `scale` is the knob for how hard it warps.
 */
function LiquidGlassFilter() {
  return (
    <svg aria-hidden className="pointer-events-none absolute size-0">
      <filter id={FILTER_ID} x="0%" y="0%" width="100%" height="100%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.008 0.008"
          numOctaves={2}
          seed={92}
          result="noise"
        />
        <feGaussianBlur in="noise" stdDeviation="2" result="blurred" />
        <feDisplacementMap
          in="SourceGraphic"
          in2="blurred"
          scale={70}
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </svg>
  )
}

/**
 * The three material layers, matching how Apple describes the material:
 * refraction (lensing the backdrop rather than just blurring it), illumination
 * (a flat wash), and specular (light caught on the top-left edge).
 *
 * Drop these inside any `relative overflow-hidden` element, ahead of its
 * content — and give that content `relative` so it paints above them, since
 * absolutely positioned siblings otherwise cover static ones.
 *
 * Two things worth remembering when using it:
 *
 * - `backdrop-filter: url(#…)` is Chromium-only. This uses the portable
 *   variant, so elsewhere it degrades to blur + tint + specular — still glass,
 *   minus the lensing.
 * - Glass refracts whatever is behind it. On a flat surface there is nothing to
 *   bend, so it reads as a sheen rather than the effect from Apple's demos.
 */
function LiquidGlassLayers() {
  return (
    <>
      {/* isolate keeps the filter from bleeding into siblings. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 isolate backdrop-blur-[2px]"
        style={{ filter: `url(#${FILTER_ID})` }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-white/25"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_1px_1px_0_rgba(255,255,255,0.75),inset_0_0_5px_rgba(255,255,255,0.75)]"
      />
    </>
  )
}

export { LiquidGlassFilter, LiquidGlassLayers }
