import { cn } from "@/lib/utils";

interface RankBadgeProps {
  rank: 1 | 2 | 3 | number;
  size?: number;
  className?: string;
}

/**
 * Rank badge — engraved disc with an inner ring + numeral. Top 3 ranks use
 * the chrome brand ramp with a GOLD hero accent (border + ring + glow) to mark
 * the podium; everything else falls back to a graphite default.
 *
 * Gold accent — mirrors `--bop-gold` / `--bop-emerald` in index.css.
 * Adjust both together.
 */
const GOLD = "#c9a227";

const PALETTE: Record<
  number,
  { fill: string; stroke: string; glow: string; text: string; ring: string }
> = {
  1: {
    fill: "#6e6e73",
    stroke: GOLD,
    glow: GOLD,
    text: "#060607",
    ring: GOLD,
  },
  2: {
    fill: "#1d1d23",
    stroke: GOLD,
    glow: GOLD,
    text: "#e8e8ea",
    ring: GOLD,
  },
  3: {
    fill: "#121216",
    stroke: GOLD,
    glow: GOLD,
    text: GOLD,
    ring: GOLD,
  },
};

const DEFAULT = {
  fill: "#16161b",
  stroke: "#6e6e73",
  glow: "#8a8a90",
  text: "#b8b8bd",
  ring: "#6e6e73",
};

export function RankBadge({ rank, size = 48, className }: RankBadgeProps) {
  const p = PALETTE[rank] ?? DEFAULT;
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={cn(className)}
      style={{
        filter: `drop-shadow(0 0 6px ${p.glow}aa) drop-shadow(0 0 14px ${p.glow}66)`,
      }}
      aria-hidden
    >
      {/* Outer disc */}
      <circle cx="50" cy="50" r="46" fill={p.fill} stroke={p.stroke} strokeWidth="2.5" />
      {/* Inner engraved ring */}
      <circle
        cx="50"
        cy="50"
        r="38"
        fill="none"
        stroke={p.ring}
        strokeOpacity="0.45"
        strokeWidth="1"
        strokeDasharray="2 3"
      />
      {/* Numeral */}
      <text
        x="50"
        y="62"
        textAnchor="middle"
        fontFamily="Jost, Inter, sans-serif"
        fontSize="36"
        fontWeight="700"
        fill={p.text}
      >
        {rank}
      </text>
    </svg>
  );
}
