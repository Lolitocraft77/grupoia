import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { SpotlightEvent } from "@/types";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { useSpotlightSfx } from "@/hooks/useSpotlightSfx";
import { logger } from "@/lib/logger";
import { formatCurrency } from "@/lib/utils";
import {
  STAGE_STREAM_MS,
  STAGE_FLASH_MS,
  SPOTLIGHT_AUDIO_FADE_MS,
  SPOTLIGHT_DURATION_MS,
} from "@/config/constants";

interface SpotlightOverlayProps {
  event: SpotlightEvent | null;
  onComplete: () => void;
  /** Total animation duration in ms. Falls back to SPOTLIGHT_DURATION_MS. */
  durationMs?: number;
}

/**
 * Spotlight choreography (4 phases) — premium silver/graphite token rain
 * falling from above. No emitter, no per-element shadows/filters: every moving
 * element animates ONLY transform + opacity on the GPU.
 *
 *   1. flash   — brief silver flash + a single subtle shake
 *   2. stream  — token rain falls from the top; counter ramps; SFX burst
 *   3. reveal  — rain keeps settling, counter punch, brief champagne sparkle
 *   4. close   — fade out
 */
type Phase = "flash" | "stream" | "reveal" | "close" | "done";

/** Champagne accent — low saturation (not yellow), used only as a touch of light. */
const CHAMPAGNE_LIGHT = "#e7d3a1";
const CHAMPAGNE = "#c9ad74";
const CHAMPAGNE_DEEP = "#9c7f4a";

/** Heuristic for low-power devices: fewer tokens. */
function useReducedFx() {
  return useMemo(() => {
    if (typeof window === "undefined") return false;
    try {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return true;
    } catch {
      /* ignore */
    }
    const cores = (navigator as unknown as { hardwareConcurrency?: number }).hardwareConcurrency;
    if (typeof cores === "number" && cores <= 4) return true;
    const mem = (navigator as unknown as { deviceMemory?: number }).deviceMemory;
    if (typeof mem === "number" && mem <= 4) return true;
    return false;
  }, []);
}

interface RainDrop {
  id: number;
  /** Horizontal position 0–100% (left). */
  left: number;
  /** Final horizontal drift in vw. */
  dx: number;
  rotateStart: number; // deg
  spin: number;        // total deg over fall
  size: number;        // px width
  delay: number;       // s
  duration: number;    // s
  prime: boolean;      // champagne-accent variant
}

/**
 * Token rain — bills falling from above the viewport, staggered across the
 * full width. Pure CSS keyframes (`token-rain`) animating only transform +
 * opacity. No filters, no box-shadow → cheap to composite even when abundant.
 */
function makeRain(count: number): RainDrop[] {
  return Array.from({ length: count }, (_, i) => {
    const prime = i % 7 === 3; // ~1 in 7 carries a stronger champagne accent
    return {
      id: i,
      left: Math.random() * 100,
      dx: (Math.random() - 0.5) * 16,
      rotateStart: Math.random() * 360,
      spin: 240 + Math.random() * 520,
      size: prime ? 78 + Math.random() * 26 : 52 + Math.random() * 34,
      // Front-loaded so the screen fills quickly, then keeps raining.
      delay: Math.random() * 1.7,
      duration: 3.0 + Math.random() * 1.8,
      prime,
    };
  });
}

/**
 * Counter that ramps from 0 → value with cubic ease-out.
 *
 * `onComplete` lives in a ref so a new function reference from the parent does
 * NOT restart the animation (which would make the number jump around).
 */
function CountUp({
  value,
  durationMs,
  onComplete,
}: {
  value: number;
  durationMs: number;
  onComplete?: () => void;
}) {
  const [display, setDisplay] = useState(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = () => {
      const elapsed = performance.now() - start;
      const k = Math.min(1, elapsed / durationMs);
      const eased = 1 - Math.pow(1 - k, 3);
      setDisplay(Math.round(value * eased));
      if (k < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        onCompleteRef.current?.();
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, durationMs]);
  return <span>+{formatCurrency(display)}</span>;
}

/**
 * Banknote SVG — graphite body, silver frame, champagne medallion + "$".
 * All shine is baked into the vector (gradients + a static diagonal sheen), so
 * there is NO runtime filter/shadow cost per token. The `prime` variant fills
 * the medallion with a faint champagne wash for extra sparkle.
 */
function Token({ size, prime }: { size: number; prime?: boolean }) {
  const s = prime ? "p" : "n";
  return (
    <svg
      width={size}
      height={(size * 90) / 200}
      viewBox="0 0 200 90"
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id={`tk-body-${s}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#20242b" />
          <stop offset="100%" stopColor="#0a0b0d" />
        </linearGradient>
        <linearGradient id={`tk-champ-${s}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={CHAMPAGNE_LIGHT} />
          <stop offset="55%" stopColor={CHAMPAGNE} />
          <stop offset="100%" stopColor={CHAMPAGNE_DEEP} />
        </linearGradient>
      </defs>

      {/* Body + silver frame */}
      <rect x="1" y="1" width="198" height="88" rx="6" fill={`url(#tk-body-${s})`} stroke="#b7bcc4" strokeOpacity="0.55" strokeWidth="1.5" />
      <rect x="6" y="6" width="188" height="78" rx="4" fill="none" stroke="#b7bcc4" strokeOpacity="0.28" strokeDasharray="2 3" />

      {/* Static diagonal metallic sheen — catches light as the token rotates */}
      <polygon points="40,1 78,1 30,89 -8,89" fill="#ffffff" fillOpacity="0.06" />

      {/* Champagne medallion */}
      {prime && <circle cx="100" cy="45" r="21" fill={`url(#tk-champ-${s})`} fillOpacity="0.14" />}
      <circle cx="100" cy="45" r="22" fill="none" stroke={`url(#tk-champ-${s})`} strokeWidth="2" />
      <circle cx="100" cy="45" r="16" fill="none" stroke="#b7bcc4" strokeOpacity="0.4" />
      <text x="100" y="53" textAnchor="middle" fontFamily="Jost, sans-serif" fontSize="22" fontWeight="800" fill={`url(#tk-champ-${s})`}>
        $
      </text>

      {/* Corner denominations — silver */}
      <text x="14" y="22" fontFamily="Jost, sans-serif" fontSize="13" fontWeight="700" fill="#b7bcc4" fillOpacity="0.8">
        {prime ? "1000" : "100"}
      </text>
      <text x="186" y="80" textAnchor="end" fontFamily="Jost, sans-serif" fontSize="13" fontWeight="700" fill="#b7bcc4" fillOpacity="0.8">
        {prime ? "1000" : "100"}
      </text>
    </svg>
  );
}

/** The falling token rain — one CSS-animated node per drop. */
function TokenRain({ drops }: { drops: RainDrop[] }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {drops.map((d) => (
        <div
          key={d.id}
          className="anim-token-rain absolute"
          style={
            {
              left: `${d.left}%`,
              top: 0,
              width: d.size,
              animationDelay: `${d.delay}s`,
              animationDuration: `${d.duration}s`,
              ["--dx" as string]: `${d.dx}vw`,
              ["--rot" as string]: `${d.rotateStart}deg`,
              ["--spin" as string]: `${d.spin}deg`,
            } as React.CSSProperties
          }
        >
          <Token size={d.size} prime={d.prime} />
        </div>
      ))}
    </div>
  );
}

/**
 * Brief champagne sparkle at reveal — small flecks, transform + opacity only.
 */
function Sparkle({ enabled }: { enabled: boolean }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        id: i,
        left: 30 + Math.random() * 40,
        size: 5 + Math.random() * 4,
        dx: (Math.random() - 0.5) * 24,
        delay: Math.random() * 0.5,
        duration: 1.8 + Math.random() * 1.2,
        champ: i % 2 === 0,
      })),
    [],
  );
  if (!enabled) return null;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {pieces.map((p) => (
        <span
          key={p.id}
          className="anim-confetti absolute rounded-sm"
          style={
            {
              left: `${p.left}%`,
              top: "26%",
              width: p.size,
              height: p.size,
              background: p.champ ? CHAMPAGNE_LIGHT : "#d7dbe0",
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              ["--dx" as string]: `${p.dx}vw`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

export function SpotlightOverlay({
  event,
  onComplete,
  durationMs,
}: SpotlightOverlayProps) {
  const { play, stop } = useAudioPlayer();
  const sfx = useSpotlightSfx();
  const reducedFx = useReducedFx();
  const totalMs = durationMs ?? SPOTLIGHT_DURATION_MS;
  const [phase, setPhase] = useState<Phase>("flash");
  const [shaking, setShaking] = useState(false);
  const [counterPunched, setCounterPunched] = useState(false);
  const counterPunchTimer = useRef<number | null>(null);

  // Rain computed once per event so it stays stable across renders.
  const rain = useMemo(
    () => makeRain(reducedFx ? 28 : 70),
    [event?.triggeredAt, reducedFx],
  );

  useEffect(() => {
    if (!event) return;
    logger.info("spotlight firing", {
      agent: event.agent.name,
      amount: event.amount,
      hasSong: !!event.agent.songUrl,
      totalMs,
      reducedFx,
    });

    setPhase("flash");
    setShaking(true);
    setCounterPunched(false);

    sfx.mechanical();
    const sfxBurst = window.setTimeout(() => sfx.burst(), STAGE_FLASH_MS);
    const sfxStinger = window.setTimeout(
      () => sfx.stinger(),
      STAGE_FLASH_MS + Math.max(0, STAGE_STREAM_MS - 250),
    );

    // Single, very subtle shake — only on the focal column, only at the start.
    const tShake = window.setTimeout(() => setShaking(false), 200);
    const tStream = window.setTimeout(() => setPhase("stream"), STAGE_FLASH_MS);
    const tReveal = window.setTimeout(
      () => setPhase("reveal"),
      STAGE_FLASH_MS + STAGE_STREAM_MS,
    );
    const tClose = window.setTimeout(
      () => setPhase("close"),
      Math.max(0, totalMs - 500),
    );
    const tDone = window.setTimeout(() => {
      setPhase("done");
      onComplete();
    }, totalMs);

    const cleanup = () => {
      window.clearTimeout(tShake);
      window.clearTimeout(tStream);
      window.clearTimeout(tReveal);
      window.clearTimeout(tClose);
      window.clearTimeout(tDone);
      window.clearTimeout(sfxBurst);
      window.clearTimeout(sfxStinger);
      if (counterPunchTimer.current) {
        window.clearTimeout(counterPunchTimer.current);
        counterPunchTimer.current = null;
      }
      sfx.stop();
      stop();
    };

    if (event.agent.songUrl) {
      const audioStart = window.setTimeout(() => {
        play({
          url: event.agent.songUrl as string,
          startSeconds: event.agent.songStartSeconds,
          fadeOutMs: SPOTLIGHT_AUDIO_FADE_MS,
          totalDurationMs: totalMs - STAGE_FLASH_MS,
        });
      }, STAGE_FLASH_MS);
      return () => {
        window.clearTimeout(audioStart);
        cleanup();
      };
    }

    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event?.triggeredAt]);

  if (!event) return null;

  const counterDuration = STAGE_STREAM_MS;
  const rainVisible = phase === "stream" || phase === "reveal" || phase === "close";
  const counterActive = phase === "stream" || phase === "reveal" || phase === "close";
  const targetVisible = phase !== "flash";
  const glowing = phase === "stream" || phase === "reveal";
  const showSparkle = phase === "reveal" || phase === "close";

  return (
    <AnimatePresence>
      {event && phase !== "done" && (
        <motion.div
          key={event.triggeredAt}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(24, 27, 33, 0.94) 0%, rgba(5, 5, 6, 0.98) 75%)",
          }}
          className="fixed inset-0 z-50 flex items-start justify-center overflow-hidden"
        >
          {/* ── Phase 1: brief silver flash (opacity only) ───────────── */}
          <AnimatePresence>
            {phase === "flash" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: STAGE_FLASH_MS / 1000, times: [0, 0.25, 1] }}
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "radial-gradient(ellipse at center 55%, #ffffff 0%, #e9ecf0 30%, #c4c9d1 55%, transparent 80%)",
                  mixBlendMode: "screen",
                }}
                aria-hidden
              />
            )}
          </AnimatePresence>

          {/* Global champagne ambient glow — ONE cheap layer (opacity only) */}
          <motion.div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at center 60%, rgba(201,173,116,0.20) 0%, rgba(201,173,116,0.06) 38%, transparent 72%)",
              mixBlendMode: "screen",
            }}
            animate={{ opacity: glowing ? 1 : phase === "close" ? 0.4 : 0 }}
            transition={{ duration: 0.6 }}
            aria-hidden
          />

          {/* Static vignette (opacity only) */}
          <motion.div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 38%, rgba(5,5,6,0.55) 82%, rgba(5,5,6,0.85) 100%)",
            }}
            animate={{ opacity: phase === "flash" ? 0 : 0.7 }}
            transition={{ duration: 0.5 }}
            aria-hidden
          />

          {/* Decorative frame */}
          <div
            className="pointer-events-none absolute inset-6 rounded-xl border border-bop-chrome/25"
            aria-hidden
          >
            <div
              className="absolute inset-3 rounded-lg border border-dashed"
              style={{ borderColor: "rgba(183,188,196,0.16)" }}
            />
          </div>

          {/* Hallmark */}
          <div className="absolute top-8 left-1/2 -translate-x-1/2 text-center">
            <p className="font-sans text-[10px] uppercase tracking-[0.55em] text-bop-chrome/70">
              reconocimiento
            </p>
          </div>

          {/* ── TOKEN RAIN — falls from above ─────────────────────────── */}
          {rainVisible && <TokenRain drops={rain} />}

          {/* ── TARGET: name + photo + counter ────────────────────────── */}
          {targetVisible && (
            <motion.div
              className={`relative z-20 mt-[10vh] flex flex-col items-center gap-4 px-4 text-center ${
                shaking ? "anim-camera-shake" : ""
              }`}
              initial={{ scale: 0.85, opacity: 0, y: -28 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 240, damping: 18, mass: 0.9 }}
            >
              <h2
                className="font-display text-4xl uppercase tracking-[0.22em] sm:text-5xl"
                style={{
                  color: "#eceef1",
                  textShadow: "0 0 10px rgba(201,173,116,0.45), 0 0 28px rgba(196,201,209,0.3)",
                }}
              >
                VENTA CERRADA
              </h2>

              <AgentSeal
                photoUrl={event.agent.photoUrl}
                name={event.agent.name}
                glowing={glowing}
              />

              <p
                className="font-display text-2xl uppercase tracking-[0.18em] sm:text-3xl"
                style={{
                  color: "#eceef1",
                  textShadow: "0 0 12px rgba(196,201,209,0.35)",
                }}
              >
                {event.agent.name}
              </p>

              {/* Counter — ramps during stream, punches at end (transform only). */}
              <motion.div
                className="rounded-lg border-2 px-8 py-3 font-digital text-5xl sm:text-6xl"
                style={{
                  borderColor: CHAMPAGNE,
                  background: "rgba(5,5,6,0.85)",
                  color: "#eceef1",
                  textShadow: "0 0 10px rgba(201,173,116,0.5)",
                  boxShadow: "0 0 28px rgba(201,173,116,0.18)",
                }}
                animate={
                  counterPunched
                    ? { scale: [1, 1.18, 1.04, 1.1, 1] }
                    : { scale: 1 }
                }
                transition={
                  counterPunched
                    ? { duration: 0.7, times: [0, 0.2, 0.45, 0.7, 1] }
                    : { duration: 0.3 }
                }
              >
                {counterActive ? (
                  <CountUp
                    value={event.amount}
                    durationMs={counterDuration}
                    onComplete={() => {
                      setCounterPunched(true);
                      if (counterPunchTimer.current) {
                        window.clearTimeout(counterPunchTimer.current);
                      }
                      counterPunchTimer.current = window.setTimeout(
                        () => setCounterPunched(false),
                        800,
                      );
                    }}
                  />
                ) : (
                  <span>+{formatCurrency(0)}</span>
                )}
              </motion.div>
            </motion.div>
          )}

          {/* Champagne sparkle at reveal */}
          <Sparkle enabled={showSparkle && !reducedFx} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function AgentSeal({
  photoUrl,
  name,
  glowing,
}: {
  photoUrl: string | null;
  name: string;
  glowing?: boolean;
}) {
  return (
    <motion.div
      className="relative h-32 w-32 sm:h-40 sm:w-40"
      animate={glowing ? { scale: [1, 1.03, 1] } : { scale: 1 }}
      transition={{ duration: 1.4, repeat: glowing ? Infinity : 0, ease: "easeInOut" }}
    >
      {/* Conic silver ring with a champagne stop */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "conic-gradient(from 0deg, rgba(196,201,209,0.6), rgba(201,173,116,0.55), rgba(124,129,139,0.6), rgba(196,201,209,0.6))",
          padding: 5,
        }}
      >
        <div
          className="h-full w-full rounded-full"
          style={{ background: "linear-gradient(180deg, #0a0b0d 0%, #050506 100%)" }}
        />
      </div>
      {/* Dashed inner ring — rotates via transform (cheap) */}
      <motion.div
        className="absolute inset-2 rounded-full"
        style={{ border: "1px dashed rgba(201,173,116,0.4)" }}
        animate={glowing ? { rotate: 360 } : { rotate: 0 }}
        transition={{ duration: 18, repeat: glowing ? Infinity : 0, ease: "linear" }}
      />
      <div className="absolute inset-3 overflow-hidden rounded-full ring-2 ring-bop-chrome/70">
        {photoUrl ? (
          <img src={photoUrl} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-bop-void">
            <span className="font-display text-5xl text-chrome-glow">
              {name.charAt(0)}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
