import { useEffect, useMemo, useState } from "react";
import type { Team } from "@/types";
import { TeamCard } from "./TeamCard";
import { NeonText } from "./NeonText";
import { BrandMark } from "./BrandMark";
import { BRAND } from "@/config/branding";
import { formatCompactK, formatCurrency } from "@/lib/utils";
import { daysLeftInMonth } from "@/lib/daysLeftInMonth";

interface DashboardViewProps {
  teams: Team[];
  /** Meta del mes (target global), configurable desde /admin. */
  monthlyTarget: number;
}

/** Suma un campo de período entre mesas; `null` si ninguna mesa lo trae. */
function sumPeriod(teams: Team[], key: "dia" | "semana" | "mes"): number | null {
  let acc: number | null = null;
  for (const t of teams) {
    const v = t[key];
    if (typeof v === "number") acc = (acc ?? 0) + v;
  }
  return acc;
}

export function DashboardView({ teams, monthlyTarget }: DashboardViewProps) {
  const houseDia = useMemo(() => sumPeriod(teams, "dia"), [teams]);
  const houseSemana = useMemo(() => sumPeriod(teams, "semana"), [teams]);
  const houseMes = useMemo(() => sumPeriod(teams, "mes"), [teams]);

  // FALTA = meta del mes − total del MES (no el acumulado de las mesas).
  const remainingMes =
    houseMes == null ? null : Math.max(monthlyTarget - houseMes, 0);

  // Días de calendario restantes del mes (America/Bogota, excluye hoy).
  // Se recalcula cada minuto para que el conteo cruce de día sin recargar.
  const [daysLeft, setDaysLeft] = useState(() => daysLeftInMonth(new Date()));
  useEffect(() => {
    const id = setInterval(
      () => setDaysLeft(daysLeftInMonth(new Date())),
      60_000,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex h-full w-full flex-col">
      {/* En lg+ el header es una grilla 1fr/auto/1fr: título a la izquierda,
          tarjetas centradas en la mitad y una celda vacía que balancea el
          centrado. En pantallas chicas las tarjetas bajan a su propia fila. */}
      <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-bop-chrome/30 px-4 pb-4 pt-4 sm:px-6 sm:pb-5 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:px-8">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <BrandMark size={48} />
          <div className="min-w-0">
            <p className="font-sans text-[10px] uppercase tracking-[0.4em] text-bop-chrome/70 sm:text-xs">
              Operaciones en vivo
            </p>
            <h1
              className="truncate font-display leading-none text-chrome-glow"
              style={{ fontSize: "clamp(1.5rem, 4vw, 2.5rem)" }}
            >
              {BRAND.name.toUpperCase()}
            </h1>
            {/* LIVE — bajo el título, alineado a la izquierda. */}
            <div className="mt-1.5 flex items-center gap-2">
              <span
                className="anim-live-pulse h-2.5 w-2.5 rounded-full"
                style={{
                  background: "var(--color-danger)",
                  boxShadow:
                    "0 0 10px var(--color-danger), 0 0 20px var(--color-danger)",
                }}
              />
              <NeonText color="danger" className="text-xl sm:text-2xl">
                LIVE
              </NeonText>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-stretch justify-center gap-4 sm:gap-6">
          <MetricCard label="Meta" value={formatCompactK(monthlyTarget)} />
          <MetricCard
            label="Falta"
            value={remainingMes == null ? "—" : formatCompactK(remainingMes)}
            emerald
          />
          <MetricCard label="Días restantes" value={`${daysLeft} días`} />
        </div>

        {/* Celda vacía: balancea la grilla para que las tarjetas queden
            realmente al centro del header en pantalla ancha. */}
        <div aria-hidden className="hidden lg:block" />
      </header>

      {/* ───── Resumen global de oficina (suma de las 3 mesas) ───── */}
      <section className="px-4 pt-4 sm:px-6 lg:px-8">
        <div className="bop-card grid grid-cols-3 gap-x-4 gap-y-3 px-4 py-3 sm:py-4">
          <OfficeStat label="Día" value={houseDia} />
          <OfficeStat label="Semana" value={houseSemana} />
          <OfficeStat label="Mes" value={houseMes} />
        </div>
      </section>

      <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        {teams.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-center font-sans text-base text-bop-silver/60 sm:text-lg">
              No hay mesas configuradas. Andá a{" "}
              <a
                href="/admin"
                className="text-bop-chrome underline underline-offset-4"
              >
                /admin
              </a>{" "}
              para crear una.
            </p>
          </div>
        ) : (
          <div
            className="grid gap-4 sm:gap-5 lg:gap-6"
            style={{
              gridTemplateColumns:
                "repeat(auto-fit, minmax(min(100%, 360px), 1fr))",
            }}
          >
            {teams.map((team) => (
              <TeamCard key={team.id} team={team} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function OfficeStat({
  label,
  value,
}: {
  label: string;
  value?: number | null;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-bop-chrome/70 sm:text-xs sm:tracking-[0.4em]">
        {label}
      </span>
      <span
        className="font-digital text-chrome-glow"
        style={{ fontSize: "clamp(1.1rem, 2.6vw, 1.6rem)" }}
      >
        {value == null ? "—" : formatCurrency(value)}
      </span>
    </div>
  );
}

/** Tarjeta de métrica compacta del header (Meta / Falta / Días hábiles). */
function MetricCard({
  label,
  value,
  emerald = false,
}: {
  label: string;
  value: string;
  emerald?: boolean;
}) {
  return (
    <div className="bop-card flex min-w-[8rem] flex-col items-center justify-center gap-1 px-5 py-3 text-center sm:min-w-[10rem] sm:px-7 sm:py-4 lg:min-w-[11rem]">
      <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-bop-chrome/70 sm:text-xs sm:tracking-[0.4em]">
        {label}
      </span>
      <span
        className={emerald ? "font-digital" : "font-digital text-chrome-glow"}
        style={{
          fontSize: "clamp(1.5rem, 3.5vw, 2.5rem)",
          lineHeight: 1.1,
          ...(emerald
            ? {
                color: "var(--bop-emerald)",
                textShadow: "0 0 10px var(--bop-emerald-glow)",
              }
            : {}),
        }}
      >
        {value}
      </span>
    </div>
  );
}
