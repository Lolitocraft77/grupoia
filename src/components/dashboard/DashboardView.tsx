import { useMemo } from "react";
import type { Team } from "@/types";
import { TeamCard } from "./TeamCard";
import { NeonText } from "./NeonText";
import { BrandMark } from "./BrandMark";
import { BRAND } from "@/config/branding";
import { formatCurrency } from "@/lib/utils";

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
  const houseTotal = useMemo(
    () => teams.reduce((sum, t) => sum + t.total, 0),
    [teams],
  );
  const houseDia = useMemo(() => sumPeriod(teams, "dia"), [teams]);
  const houseSemana = useMemo(() => sumPeriod(teams, "semana"), [teams]);
  const houseMes = useMemo(() => sumPeriod(teams, "mes"), [teams]);

  const remaining = Math.max(monthlyTarget - houseTotal, 0);
  const targetReached = houseTotal >= monthlyTarget;

  return (
    <div className="flex h-full w-full flex-col">
      <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-bop-chrome/30 px-4 pb-4 pt-4 sm:px-6 sm:pb-5 lg:px-8">
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

        <div className="text-right">
          <p className="font-sans text-[10px] uppercase tracking-[0.4em] text-bop-silver/60 sm:text-xs">
            Total Volume
          </p>
          <p
            className="font-digital text-chrome-glow"
            style={{ fontSize: "clamp(1.75rem, 5vw, 3rem)" }}
          >
            {formatCurrency(houseTotal)}
          </p>
          <p className="font-sans text-[11px] text-bop-silver/50 sm:text-xs">
            target {formatCurrency(monthlyTarget)}
          </p>
        </div>
      </header>

      {/* ───── Resumen global de oficina (suma de las 3 mesas) ───── */}
      <section className="px-4 pt-4 sm:px-6 lg:px-8">
        <div className="bop-card grid grid-cols-2 gap-x-4 gap-y-3 px-4 py-3 sm:grid-cols-4 sm:py-4">
          <OfficeStat label="Día" value={houseDia} />
          <OfficeStat label="Semana" value={houseSemana} />
          <OfficeStat label="Mes" value={houseMes} />
          {targetReached ? (
            <OfficeStat label="Falta" reached />
          ) : (
            <OfficeStat label="Falta" value={remaining} accent />
          )}
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
  accent = false,
  reached = false,
}: {
  label: string;
  value?: number | null;
  accent?: boolean;
  reached?: boolean;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-bop-chrome/70 sm:text-xs sm:tracking-[0.4em]">
        {label}
      </span>
      {reached ? (
        <span
          className="font-sans text-sm uppercase tracking-[0.3em] sm:text-base"
          style={{ color: "var(--bop-emerald)" }}
        >
          Target reached
        </span>
      ) : (
        <span
          className={accent ? "font-digital" : "font-digital text-chrome-glow"}
          style={{
            fontSize: "clamp(1.1rem, 2.6vw, 1.6rem)",
            ...(accent
              ? {
                  color: "var(--bop-emerald)",
                  textShadow: "0 0 10px var(--bop-emerald-glow)",
                }
              : {}),
          }}
        >
          {value == null ? "—" : formatCurrency(value)}
        </span>
      )}
    </div>
  );
}
