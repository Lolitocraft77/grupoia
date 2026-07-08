import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { BRAND } from "@/config/branding";

interface BrandMarkProps {
  size?: number;
  showWordmark?: boolean;
  className?: string;
}

/**
 * Gold/chrome diamond monogram — the fallback mark used when no logo image is
 * set via VITE_BRAND_LOGO / branding.ts. A gold-edged rhombus with a chrome
 * core carrying the brand initials, echoing the Group I.A logo. Keeps a 100×100
 * viewBox so callers don't need to know about it.
 */
function MonogramSvg({ size, label }: { size: number; label: string }) {
  const initials = label.slice(0, 2).toUpperCase();
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="img"
      aria-label={label}
    >
      <defs>
        {/* Gold metallic (135deg): dark → gold → highlight → gold → dark */}
        <linearGradient id="brand-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8a6d1b" />
          <stop offset="35%" stopColor="#c9a227" />
          <stop offset="50%" stopColor="#f4e4a6" />
          <stop offset="65%" stopColor="#c9a227" />
          <stop offset="100%" stopColor="#8a6d1b" />
        </linearGradient>
        {/* Chrome metallic core */}
        <linearGradient id="brand-chrome" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6e6e73" />
          <stop offset="40%" stopColor="#b8b8bd" />
          <stop offset="50%" stopColor="#f0f0f2" />
          <stop offset="60%" stopColor="#b8b8bd" />
          <stop offset="100%" stopColor="#6e6e73" />
        </linearGradient>
        <radialGradient id="brand-core" cx="0.5" cy="0.42" r="0.62">
          <stop offset="0%" stopColor="#f0f0f2" />
          <stop offset="55%" stopColor="#b8b8bd" />
          <stop offset="100%" stopColor="#33333a" />
        </radialGradient>
      </defs>

      {/* Gold-edged diamond */}
      <polygon
        points="50,4 96,50 50,96 4,50"
        fill="none"
        stroke="url(#brand-gold)"
        strokeWidth="6"
        strokeLinejoin="round"
      />
      {/* Chrome core */}
      <polygon
        points="50,20 80,50 50,80 20,50"
        fill="url(#brand-core)"
        stroke="url(#brand-chrome)"
        strokeWidth="2"
      />
      {/* Initials */}
      <text
        x="50"
        y="58"
        textAnchor="middle"
        fontFamily="Jost, Inter, sans-serif"
        fontSize={initials.length > 1 ? 26 : 34}
        fontWeight="700"
        letterSpacing="1"
        fill="url(#brand-gold)"
      >
        {initials}
      </text>
    </svg>
  );
}

export function BrandMark({
  size = 96,
  showWordmark = false,
  className,
}: BrandMarkProps) {
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.title = BRAND.documentTitle;
    }
  }, []);

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      {/* Outer: shaped gold/chrome glow (follows the mark's alpha). */}
      <div
        className="relative"
        style={{
          filter:
            "drop-shadow(0 0 12px rgba(201, 162, 39, 0.38)) drop-shadow(0 0 24px rgba(184, 184, 189, 0.14))",
        }}
      >
        {/* Inner: hover light-sweep shimmer, clipped to the mark. */}
        <div className="metal-shimmer" style={{ borderRadius: 8, lineHeight: 0 }}>
          {BRAND.logoPath ? (
            <img
              src={BRAND.logoPath}
              alt={BRAND.name}
              width={size}
              height={size}
              style={{ width: size, height: "auto", objectFit: "contain" }}
              onError={(e) => {
                // If the configured logo can't load, hide it so nothing visual breaks.
                // Components above us already have a monogram fallback path via branding.ts.
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <MonogramSvg size={size} label={BRAND.monogram} />
          )}
        </div>
      </div>
      {showWordmark && (
        <span
          className="font-display tracking-[0.35em] text-chrome-glow"
          style={{ fontSize: Math.max(15, size * 0.14) }}
        >
          {BRAND.name.toUpperCase()}
        </span>
      )}
    </div>
  );
}
