import { cn } from "@/lib/utils";

interface NeonTextProps {
  children: React.ReactNode;
  color?: "chrome" | "silver" | "platinum" | "gold" | "danger" | "success";
  className?: string;
}

/** Metallic gradients — the metal look is a gradient, never a flat hex. */
const METAL_GRADIENT: Partial<Record<NonNullable<NeonTextProps["color"]>, string>> = {
  gold: "linear-gradient(135deg, #8a6d1b, #c9a227 35%, #f4e4a6 50%, #c9a227 65%, #8a6d1b)",
  chrome: "linear-gradient(135deg, #6e6e73, #b8b8bd 40%, #f0f0f2 50%, #b8b8bd 60%, #6e6e73)",
  silver: "linear-gradient(135deg, #6e6e73, #c9cace 45%, #f0f0f2 50%, #c9cace 55%, #6e6e73)",
  platinum:
    "linear-gradient(135deg, #9a9aa0, #e8e8ea 45%, #f7f7f9 50%, #e8e8ea 55%, #9a9aa0)",
};

/** Functional states keep a flat glow (not part of the metal system). */
const GLOW_COLOR: Partial<Record<NonNullable<NeonTextProps["color"]>, string>> = {
  danger: "#c79090",
  success: "#9db3a4",
};

/** Soft glow halo under each metallic variant, tuned per axis. */
const METAL_GLOW: Record<string, string> = {
  gold: "0 0 6px rgba(201,162,39,0.55), 0 0 18px rgba(201,162,39,0.30)",
  chrome: "0 0 6px rgba(184,184,189,0.5), 0 0 18px rgba(184,184,189,0.28)",
  silver: "0 0 6px rgba(201,202,206,0.5), 0 0 18px rgba(201,202,206,0.26)",
  platinum: "0 0 6px rgba(232,232,234,0.55), 0 0 18px rgba(232,232,234,0.28)",
};

export function NeonText({
  children,
  color = "chrome",
  className,
}: NeonTextProps) {
  const gradient = METAL_GRADIENT[color];

  if (gradient) {
    // Metallic gradient clipped into the glyphs; drop-shadow supplies the glow
    // (text-shadow is invisible when the fill is transparent).
    return (
      <span
        className={cn("font-display", className)}
        style={{
          backgroundImage: gradient,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          WebkitTextFillColor: "transparent",
          color: "transparent",
          filter: `drop-shadow(${METAL_GLOW[color]})`,
        }}
      >
        {children}
      </span>
    );
  }

  const c = GLOW_COLOR[color] ?? "#b8b8bd";
  return (
    <span
      className={cn("font-display", className)}
      style={{
        color: c,
        textShadow: `0 0 6px ${c}aa, 0 0 18px ${c}66, 0 0 36px ${c}33`,
      }}
    >
      {children}
    </span>
  );
}
