import { cn } from "@/lib/utils";

interface NeonTextProps {
  children: React.ReactNode;
  color?: "chrome" | "silver" | "platinum" | "danger" | "success";
  className?: string;
}

const COLOR_MAP = {
  chrome: "#c4c9d1",
  silver: "#b7bcc4",
  platinum: "#eceef1",
  danger: "#c79090",
  success: "#a9b3ad",
} as const;

export function NeonText({
  children,
  color = "chrome",
  className,
}: NeonTextProps) {
  const c = COLOR_MAP[color];
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
