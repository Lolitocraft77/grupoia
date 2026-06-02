import { cn } from "@/lib/utils";

interface RankBadgeProps {
  rank: 1 | 2 | 3 | number;
  size?: number;
  className?: string;
}

/**
 * Rank badge — engraved disc with an inner ring + numeral. Top 3 ranks use
 * the brushed-silver brand ramp with an emerald accent (border + ring + glow)
 * to mark the podium; everything else falls back to a slate default.
 *
 * Emerald accent — mirrors `--bop-emerald` in index.css. Adjust both together.
 */
const EMERALD = "#34d399";

const PALETTE: Record<
  number,
  { fill: string; stroke: string; glow: string; text: string; ring: string }
> = {
  1: {
    fill: "#7c818b",
    stroke: EMERALD,
    glow: EMERALD,
    text: "#050506",
    ring: EMERALD,
  },
  2: {
    fill: "#181b21",
    stroke: EMERALD,
    glow: EMERALD,
    text: "#eceef1",
    ring: EMERALD,
  },
  3: {
    fill: "#0a0b0d",
    stroke: EMERALD,
    glow: EMERALD,
    text: EMERALD,
    ring: EMERALD,
  },
};

const DEFAULT = {
  fill: "#101216",
  stroke: "#7c818b",
  glow: "#8a8f98",
  text: "#c4c9d1",
  ring: "#7c818b",
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
