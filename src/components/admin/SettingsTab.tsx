import { useEffect, useState } from "react";
import { useAppSettingsAdmin } from "@/hooks/useAppSettingsAdmin";
import { useSpotlightSfx } from "@/hooks/useSpotlightSfx";

export function SettingsTab() {
  const { settings, loading, error, updateSetting } = useAppSettingsAdmin();
  const sfx = useSpotlightSfx();
  const [polling, setPolling] = useState(10);
  const [duration, setDuration] = useState(10);
  const [monthlyTarget, setMonthlyTarget] = useState(130000);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [muted, setMuted] = useState<boolean>(sfx.isMuted());
  const [master, setMasterValue] = useState<number>(sfx.getMaster());

  useEffect(() => {
    setPolling(settings.polling_interval_seconds);
    setDuration(settings.spotlight_duration_seconds);
    setMonthlyTarget(settings.monthly_target);
  }, [settings]);

  const save = async (
    key:
      | "polling_interval_seconds"
      | "spotlight_duration_seconds"
      | "monthly_target",
    value: number,
  ) => {
    setBusyKey(key);
    try {
      await updateSetting(key, value);
      setSavedKey(key);
      setTimeout(() => setSavedKey(null), 1500);
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="font-display text-2xl uppercase tracking-widest text-chrome-glow">
          Configuración
        </h2>
        <p className="text-sm text-bop-silver/60">
          Tunables del dashboard. Los cambios se aplican en vivo.
        </p>
      </div>

      {error && (
        <p className="field-error mb-3" role="alert">
          {error}
        </p>
      )}

      <div className="bop-card grid grid-cols-1 gap-6 p-6 md:grid-cols-2">
        <div>
          <label htmlFor="cfg-polling" className="field-label">
            Intervalo de polling (s)
          </label>
          <div className="flex flex-wrap gap-2">
            <input
              id="cfg-polling"
              type="number"
              min="3"
              value={polling}
              onChange={(e) => setPolling(parseInt(e.target.value, 10) || 10)}
              disabled={loading}
              className="field-input max-w-[140px]"
            />
            <button
              type="button"
              onClick={() => save("polling_interval_seconds", polling)}
              disabled={busyKey === "polling_interval_seconds"}
              className="btn btn-primary btn-sm"
            >
              {busyKey === "polling_interval_seconds" ? "..." : "Guardar"}
            </button>
            {savedKey === "polling_interval_seconds" && (
              <span
                className="self-center text-sm font-semibold text-[var(--color-success)]"
                role="status"
              >
                ✓ guardado
              </span>
            )}
          </div>
          <p className="field-help">
            Cada cuánto consulta la hoja de Google. Mínimo 3 segundos.
          </p>
        </div>

        <div>
          <label htmlFor="cfg-duration" className="field-label">
            Duración del destacado (s)
          </label>
          <div className="flex flex-wrap gap-2">
            <input
              id="cfg-duration"
              type="number"
              min="3"
              max="30"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value, 10) || 10)}
              disabled={loading}
              className="field-input max-w-[140px]"
            />
            <button
              type="button"
              onClick={() => save("spotlight_duration_seconds", duration)}
              disabled={busyKey === "spotlight_duration_seconds"}
              className="btn btn-primary btn-sm"
            >
              {busyKey === "spotlight_duration_seconds" ? "..." : "Guardar"}
            </button>
            {savedKey === "spotlight_duration_seconds" && (
              <span
                className="self-center text-sm font-semibold text-[var(--color-success)]"
                role="status"
              >
                ✓ guardado
              </span>
            )}
          </div>
          <p className="field-help">
            Tiempo total de la animación cuando entra una venta nueva.
          </p>
        </div>

        <div className="md:col-span-2">
          <label htmlFor="cfg-target" className="field-label">
            Meta del mes (target global)
          </label>
          <div className="flex flex-wrap gap-2">
            <input
              id="cfg-target"
              type="number"
              min="0"
              step="1000"
              value={monthlyTarget}
              onChange={(e) =>
                setMonthlyTarget(parseInt(e.target.value, 10) || 0)
              }
              disabled={loading}
              className="field-input max-w-[200px]"
            />
            <button
              type="button"
              onClick={() => save("monthly_target", monthlyTarget)}
              disabled={busyKey === "monthly_target"}
              className="btn btn-primary btn-sm"
            >
              {busyKey === "monthly_target" ? "..." : "Guardar"}
            </button>
            {savedKey === "monthly_target" && (
              <span
                className="self-center text-sm font-semibold text-[var(--color-success)]"
                role="status"
              >
                ✓ guardado
              </span>
            )}
          </div>
          <p className="field-help">
            Objetivo consolidado de toda la oficina. El dashboard muestra el
            faltante contra este valor. Se aplica en vivo.
          </p>
        </div>

        <div className="md:col-span-2">
          <p className="field-label">Audio</p>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-bop-silver">
              <input
                type="checkbox"
                checked={muted}
                onChange={(e) => {
                  setMuted(e.target.checked);
                  sfx.setMuted(e.target.checked);
                }}
              />
              Mute global
            </label>
            <label className="flex items-center gap-3 text-sm text-bop-silver">
              <span className="uppercase tracking-widest text-xs text-bop-chrome/70">
                Volumen
              </span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={master}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setMasterValue(v);
                  sfx.setMaster(v);
                }}
                className="accent-bop-chrome"
              />
              <span className="font-digital tabular-nums text-bop-platinum">
                {Math.round(master * 100)}%
              </span>
            </label>
          </div>
          <p className="field-help">
            Mute y volumen se guardan en localStorage y se aplican a la animación
            de reconocimiento. Si dejás MP3 en{" "}
            <code className="rounded bg-[var(--bg-elevated)] px-1 py-0.5 font-mono text-[12px] text-[var(--color-primary-hover)]">
              /public/sounds/
            </code>{" "}
            se usan en lugar del sintetizador.
          </p>
        </div>

        <div className="md:col-span-2">
          <p className="field-label">URL del Apps Script</p>
          <div className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-base)] p-4">
            <p className="text-sm text-[var(--text-secondary)]">
              Vive como Edge Function secret (
              <code className="rounded bg-[var(--bg-elevated)] px-1 py-0.5 font-mono text-[12px] text-[var(--color-primary-hover)]">
                APPS_SCRIPT_URL
              </code>
              ). Para cambiarla:
            </p>
            <pre className="mt-3 overflow-x-auto rounded bg-[var(--bg-elevated)] p-3 font-mono text-[12px] leading-relaxed text-[var(--color-primary-hover)]">
{`supabase secrets set APPS_SCRIPT_URL="https://script.google.com/.../exec"
supabase functions deploy google-sheets-proxy --no-verify-jwt`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
