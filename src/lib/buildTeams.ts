import type { Agent, Team } from "@/types";
import type { AgentRow, TeamRow } from "@/types/database";
import type { SheetPayload } from "@/hooks/useGoogleSheetData";

const norm = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

/**
 * Normaliza nombre de MESA de forma tolerante: minúsculas, sin acentos, sin
 * "#" ni signos, espacios colapsados. Así "MESA # 1 MIKE" (Supabase) y
 * "Mesa 1 Mike" (sheet) caen ambos en "mesa 1 mike".
 */
const normTeam = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

/** Fallback: número de mesa ("mesa 2 teo" y "mesa 2" → "2"). */
const teamNum = (s: string): string | null => {
  const m = normTeam(s).match(/\d+/);
  return m ? m[0] : null;
};

type TeamStats = {
  total: number | null;
  dia: number | null;
  semana: number | null;
  mes: number | null;
};

/**
 * Merges the live Apps Script payload (totals + per-agent sales) with the
 * Supabase agents table (photos, songs, start times, team assignment, order).
 * Source-of-truth for *who exists* is Supabase; for *how much they sold* is the Sheet.
 */
export function buildTeams(
  supaAgents: AgentRow[],
  supaTeams: TeamRow[],
  sheet: SheetPayload | null,
): Team[] {
  const salesByAgent = new Map<string, number>();
  // Match por nombre normalizado: el id del sheet es un slug del Apps Script
  // y no coincide con el UUID de Supabase. Indexamos los stats de mesa por
  // nombre tolerante y, como fallback, por número de mesa.
  const statsByTeamName = new Map<string, TeamStats>();
  const statsByTeamNumber = new Map<string, TeamStats>();
  for (const t of sheet?.teams ?? []) {
    const stats: TeamStats = {
      total: typeof t.total_real === "number" ? t.total_real : null,
      dia: typeof t.dia === "number" ? t.dia : null,
      semana: typeof t.semana === "number" ? t.semana : null,
      mes: typeof t.mes === "number" ? t.mes : null,
    };
    statsByTeamName.set(normTeam(t.name), stats);
    const num = teamNum(t.name);
    if (num && !statsByTeamNumber.has(num)) statsByTeamNumber.set(num, stats);
    for (const a of t.agents ?? []) {
      salesByAgent.set(norm(a.name), Number(a.sales) || 0);
    }
  }

  return supaTeams
    .slice()
    .sort((a, b) => a.display_order - b.display_order)
    .map((t) => {
      const teamAgents: Agent[] = supaAgents
        .filter((a) => a.team_id === t.id)
        .sort((a, b) => a.display_order - b.display_order)
        .map((row) => ({
          id: row.id,
          name: row.name,
          photoUrl: row.photo_url,
          songUrl: row.song_url,
          songStartSeconds: Number(row.song_start_seconds) || 0,
          teamId: row.team_id,
          displayOrder: row.display_order,
          total: salesByAgent.get(norm(row.name)) ?? 0,
        }));

      // Match exacto normalizado y, si no, por número de mesa.
      const num = teamNum(t.name);
      const stats =
        statsByTeamName.get(normTeam(t.name)) ??
        (num ? statsByTeamNumber.get(num) : undefined);
      const total =
        stats?.total ??
        teamAgents.reduce((sum, a) => sum + a.total, 0);

      return {
        id: t.id,
        name: t.name,
        goal: Number(t.goal),
        iconUrl: t.icon_url,
        displayOrder: t.display_order,
        total,
        dia: stats?.dia ?? null,
        semana: stats?.semana ?? null,
        mes: stats?.mes ?? null,
        agents: teamAgents,
      };
    });
}
