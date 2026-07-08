import { useMemo } from "react";

/**
 * Foreground decoration over the global body background image.
 * Soft rising particles + a slow vertical scanline.
 */
const PARTICLE_COUNT = 14;

interface Particle {
  left: number;
  size: number;
  duration: number;
  delay: number;
  hue: "chrome" | "silver";
}

function makeParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, () => ({
    left: Math.random() * 100,
    size: 2 + Math.random() * 2,
    duration: 22 + Math.random() * 18,
    delay: Math.random() * -30,
    hue: Math.random() > 0.55 ? "silver" : "chrome",
  }));
}

export function AmbientBackground() {
  const particles = useMemo(makeParticles, []);
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      {/* Billetes de fondo — capa estática (sin animación, sin sombras por
          elemento). Intensidad ajustable vía --bills-opacity en index.css. */}
      {/* Lluvia ambiental: UNA capa, animada solo con transform:translateY.
          Colchón de 260px (un tile) arriba y abajo para que el loop no deje
          borde vacío al desplazarse. */}
      <div
        className="anim-bills-drift absolute inset-x-0"
        style={{
          top: "-260px",
          height: "calc(100% + 260px)",
          backgroundImage: "url('/bg-bills.svg?v=3')",
          backgroundRepeat: "repeat",
          backgroundSize: "260px 260px",
          opacity: "var(--bills-opacity)",
        }}
      />
      {/* Slow scanline */}
      <div
        className="anim-bop-scan absolute inset-x-0 h-[120%]"
        style={{
          top: "-10%",
          background:
            "linear-gradient(180deg, transparent 0%, rgba(184,184,189,0.05) 50%, transparent 100%)",
          mixBlendMode: "screen",
        }}
      />
      {particles.map((p, i) => (
        <span
          key={i}
          className="anim-particle absolute block rounded-full"
          style={{
            left: `${p.left}%`,
            bottom: "-10vh",
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.hue === "chrome" ? "#b8b8bd" : "#c9cace",
            boxShadow: `0 0 ${p.size * 2}px ${p.hue === "chrome" ? "#b8b8bd" : "#c9cace"}`,
            opacity: 0.28,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
