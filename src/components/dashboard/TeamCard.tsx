import type { Team } from "@/types";
import { AgentRow } from "./AgentRow";
import { formatCurrency } from "@/lib/utils";

interface TeamCardProps {
  team: Team;
}

function ProgressBar({ progress }: { progress: number }) {
  const pct = Math.max(0, Math.min(1, progress)) * 100;
  return (
    <div
      className="relative h-3 w-full overflow-hidden rounded-full border border-bop-ash bg-bop-slate/60"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-bop-chrome-light via-bop-chrome to-bop-chrome-dark transition-[width] duration-500 ease-out"
        style={{
          width: `${pct}%`,
          boxShadow:
            pct > 0
              ? "0 0 10px rgba(58, 166, 255, 0.55), inset 0 0 6px rgba(231, 236, 245, 0.35)"
              : "none",
        }}
      />
    </div>
  );
}

export function TeamCard({ team }: TeamCardProps) {
  const progress = Math.min(team.total / team.goal, 1);
  const remaining = Math.max(team.goal - team.total, 0);
  const targetReached = team.total >= team.goal;
  const sortedAgents = [...team.agents].sort((a, b) => b.total - a.total);

  return (
    <section
      className="bop-card ornament-frame relative flex flex-col overflow-hidden"
      style={{ padding: "clamp(1rem, 2.5vw, 1.5rem)" }}
    >
      <header className="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b border-bop-chrome/30 pb-3">
        <div className="min-w-0">
          <p className="font-sans text-[10px] uppercase tracking-[0.4em] text-bop-chrome/70 sm:text-xs sm:tracking-[0.5em]">
            Equipo
          </p>
          <h2
            className="truncate font-display text-chrome-glow"
            style={{ fontSize: "clamp(1.4rem, 3.4vw, 2rem)" }}
          >
            {team.name}
          </h2>
        </div>
        <div className="ml-auto text-right">
          <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-bop-silver/60 sm:text-xs sm:tracking-[0.4em]">
            Volume
          </p>
          <p
            className="font-digital text-chrome-glow"
            style={{ fontSize: "clamp(1.25rem, 3vw, 1.875rem)" }}
          >
            {formatCurrency(team.total)}
          </p>
          <p className="font-sans text-[11px] text-bop-silver/50">
            target {formatCurrency(team.goal)}
          </p>
        </div>
      </header>

      <div className="mb-5">
        <ProgressBar progress={progress} />
        <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <p className="font-sans text-xs tracking-wider text-bop-silver/70 sm:text-sm">
            {Math.round(progress * 100)}% del objetivo ·{" "}
            {sortedAgents.length} agente
            {sortedAgents.length === 1 ? "" : "s"}
          </p>
          {targetReached ? (
            <p className="font-sans text-xs uppercase tracking-[0.3em] text-bop-positive sm:text-sm">
              Target reached
            </p>
          ) : (
            <p className="font-sans text-xs tracking-wider text-bop-silver/70 sm:text-sm">
              <span className="font-digital text-chrome-glow">
                {formatCurrency(remaining)}
              </span>
            </p>
          )}
        </div>
      </div>

      <ul className="flex flex-col gap-2">
        {sortedAgents.map((agent, i) => (
          <AgentRow key={agent.id} agent={agent} rank={i + 1} />
        ))}
        {sortedAgents.length === 0 && (
          <li className="rounded-md border border-dashed border-bop-chrome/30 px-4 py-6 text-center text-sm text-bop-silver/50">
            Sin agentes en esta mesa.
          </li>
        )}
      </ul>

      <footer className="mt-5 grid grid-cols-3 gap-2 border-t border-bop-chrome/20 pt-3">
        <PeriodStat label="Día" value={team.dia} />
        <PeriodStat label="Semana" value={team.semana} />
        <PeriodStat label="Mes" value={team.mes} />
      </footer>
    </section>
  );
}

function PeriodStat({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="flex flex-col items-center text-center">
      <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-bop-chrome/70 sm:text-xs sm:tracking-[0.4em]">
        {label}
      </span>
      <span
        className="font-digital text-chrome-glow"
        style={{ fontSize: "clamp(0.95rem, 1.8vw, 1.25rem)" }}
      >
        {value == null ? "—" : formatCurrency(value)}
      </span>
    </div>
  );
}
