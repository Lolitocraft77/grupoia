import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { BRAND } from "@/config/branding";

interface BrandMarkProps {
  size?: number;
  showWordmark?: boolean;
  className?: string;
}

/**
 * Silver crescent monogram — the fallback mark used when no logo image is set
 * via VITE_BRAND_LOGO / branding.ts. Keeps a 100×100 viewBox so callers don't
 * need to know about it.
 */
function MonogramSvg({ size, label }: { size: number; label: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="img"
      aria-label={label}
    >
      <defs>
        <linearGradient id="brand-silver" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f4f6f8" />
          <stop offset="50%" stopColor="#c4c9d1" />
          <stop offset="100%" stopColor="#7c818b" />
        </linearGradient>
        <mask id="brand-crescent">
          <circle cx="50" cy="50" r="42" fill="white" />
          <circle cx="64" cy="43" r="35" fill="black" />
        </mask>
      </defs>
      {/* Brushed-silver crescent */}
      <rect
        width="100"
        height="100"
        fill="url(#brand-silver)"
        mask="url(#brand-crescent)"
      />
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
      <div
        className="relative"
        style={{
          filter:
            "drop-shadow(0 0 12px rgba(196, 201, 209, 0.4)) drop-shadow(0 0 24px rgba(236, 238, 241, 0.12))",
        }}
      >
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
