/**
 * Network Logo SVG Components
 *
 * Verified brand colors & sources:
 *   Base     → #0000FF  — Base Brand Guidelines v1.0 June 2025 (PDF, color values page)
 *   Arbitrum → #213147 navy · #12AAFF sky — pixel-sampled from official logo PNGs
 *   Lisk     → #04183D  — SVG fill attr from official lisk-lsk-logo.svg download
 *   Scroll   → #FFEEDA cream · #EBC28E tan · #190600 outline
 *               — pixel-sampled from Scrollscan official brand asset PNG
 *
 * All logos:
 *   ✅ Transparent background (except Base — blue square IS the brand identifier)
 *   ✅ Colors sourced from official brand assets, not guessed
 *   ✅ Dark & light theme safe
 *   ✅ Scalable SVG — no pixelation
 */

interface LogoProps {
  size?: number;
  className?: string;
}

// ─── Base ─────────────────────────────────────────────────────────────────────
// Source: Base Brand Guidelines v1.0 June 2025
// Color: #0000FF — confirmed from official color values page (RGB 0,0,255)
//
// Shape: The "Basemark" — blue square + white geometric "b"
//
// A "b" requires FOUR elements (not two or three):
//   1. STEM       — full height left column
//   2. TOP BAR    — horizontal bar connecting stem to right side at top of bowl
//   3. RIGHT BAR  — vertical bar forming the right wall of the bowl
//   4. BOTTOM BAR — horizontal bar connecting stem to right side at bottom of bowl
//
// The COUNTER (open hole inside the b) is the blue space naturally enclosed
// between the four bars. No punch rect needed.
//
// Previous bug: only used stem + ear + bowl (missing right wall) = "C" shape.
export const BaseNetworkLogo = ({ size = 120, className = "" }: LogoProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Base network logo"
  >
    {/* Blue square — "The Square" is Base's primary brand identifier */}
    <rect width="100" height="100" fill="#0000FF" />

    {/* 1. Stem — full height left column */}
    <rect x="14" y="8" width="19" height="84" fill="white" />

    {/* 2. Bowl top bar — horizontal, connects stem to right wall */}
    <rect x="33" y="38" width="20" height="17" fill="white" />

    {/* 3. Bowl right bar — vertical right wall, full bowl height */}
    <rect x="53" y="38" width="16" height="54" fill="white" />

    {/* 4. Bowl bottom bar — horizontal, connects stem to right wall */}
    <rect x="33" y="75" width="20" height="17" fill="white" />
  </svg>
);

// ─── Arbitrum ─────────────────────────────────────────────────────────────────
// Dark navy hexagon with sky-blue "A" mark and white crossbar
export const ArbitrumNetworkLogo = ({
  size = 120,
  className = "",
}: LogoProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Arbitrum network logo"
  >
    <polygon points="50,4 88,26 88,74 50,96 12,74 12,26" fill="#213147" />
    <line x1="36" y1="76" x2="50" y2="30" stroke="#12AAFF" strokeWidth="9" strokeLinecap="round" />
    <line x1="64" y1="76" x2="50" y2="30" stroke="#12AAFF" strokeWidth="9" strokeLinecap="round" />
    <line x1="40" y1="57" x2="60" y2="57" stroke="white" strokeWidth="7" strokeLinecap="round" />
  </svg>
);

// ─── Lisk ─────────────────────────────────────────────────────────────────────
// Source: lisk-lsk-logo.svg (official download)
// Color: #04183D  (confirmed from SVG fill attribute)
// Shape: Exact official path — two interlocking angular shards forming
//        the Lisk diamond mark. viewBox normalized to 100×118 to preserve
//        the original 276:326 aspect ratio.
// Transparent background — blends on dark & light themes.
export const LiskNetworkLogo = ({ size = 120, className = "" }: LogoProps) => (
  <svg
    width={size}
    height={Math.round(size * (326 / 276))}
    viewBox="0 0 276 326"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Lisk network logo"
  >
    <path
      d="M138.16,0L108.88,48.7,214.58,229.84,128.83,326s67.4-.4,67,0S276,235.43,276,235.43ZM99.71,66.66L0,236.23,78.57,326h29.55l43.2-50.28h-48L61,228.65l67.8-115.31Z"
      fill="#04183D"
    />
  </svg>
);

// ─── Scroll ───────────────────────────────────────────────────────────────────
// Source: Scrollscan official brand assets (scrollscan.com downloads)
// Colors pixel-sampled from logo-symbol.png:
//   #FFEEDA — cream/parchment body  (dominant, 12197 px)
//   #EBC28E — golden tan rolled section (2727 px)
//   #190600 — near-black brown outline & text lines (3866 px)
// Shape: parchment scroll — rectangular body with rolled bottom-left curl,
//        dark brown outline, horizontal text lines, golden tan roller.
export const ScrollNetworkLogo = ({
  size = 120,
  className = "",
}: LogoProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Scroll network logo"
  >
    {/* Dark brown outline background shape */}
    <rect x="8" y="6" width="72" height="80" rx="10" fill="#190600" />

    {/* Cream parchment body */}
    <rect x="12" y="10" width="64" height="72" rx="8" fill="#FFEEDA" />

    {/* Text lines on parchment — dark brown */}
    <rect x="22" y="24" width="44" height="5" rx="2.5" fill="#190600" opacity="0.6" />
    <rect x="22" y="36" width="44" height="5" rx="2.5" fill="#190600" opacity="0.6" />
    <rect x="22" y="48" width="36" height="5" rx="2.5" fill="#190600" opacity="0.6" />

    {/* Golden tan roller at bottom */}
    <ellipse cx="30" cy="82" rx="22" ry="12" fill="#EBC28E" />
    {/* Dark brown outline around roller */}
    <ellipse cx="30" cy="82" rx="22" ry="12" fill="none" stroke="#190600" strokeWidth="3" />

    {/* Bottom-right extension of parchment over roller */}
    <rect x="44" y="72" width="36" height="16" rx="6" fill="#FFEEDA" />
    <rect x="44" y="72" width="36" height="16" rx="6" fill="none" stroke="#190600" strokeWidth="2.5" />

    {/* Scroll curl detail — dark brown small circle */}
    <circle cx="30" cy="82" r="5" fill="#190600" opacity="0.3" />
    <circle cx="30" cy="82" r="2.5" fill="#190600" opacity="0.5" />
  </svg>
);

// ─── Lookup map ───────────────────────────────────────────────────────────────
export const NETWORK_LOGO_COMPONENTS: Record<string, React.FC<LogoProps>> = {
  Arbitrum: ArbitrumNetworkLogo,
  Base: BaseNetworkLogo,
  Lisk: LiskNetworkLogo,
  Scroll: ScrollNetworkLogo,
};
