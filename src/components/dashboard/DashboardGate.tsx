import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { BrandMark } from "@/components/dashboard/BrandMark";

/**
 * Password gate for the PUBLIC dashboard at "/". This is intentionally a light
 * client-side lock (not real auth) — it just keeps the display URL from being
 * wide open. The /admin route keeps its own Supabase auth and is untouched.
 *
 * The password lives in VITE_DASHBOARD_PASSWORD (baked at build time), with a
 * default so the build never breaks if the env var is missing.
 */
const DASHBOARD_PASSWORD =
  import.meta.env.VITE_DASHBOARD_PASSWORD ?? "panelcali2026admin";

const STORAGE_KEY = "bop-dashboard-unlocked";

export function DashboardGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(
    () => sessionStorage.getItem(STORAGE_KEY) === "1",
  );
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (value === DASHBOARD_PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, "1");
      setError(false);
      setUnlocked(true);
    } else {
      setError(true);
    }
  };

  if (unlocked) return <>{children}</>;

  return (
    <div className="bop-pattern relative flex h-full w-full items-center justify-center overflow-hidden bg-bop-void px-6">
      <form onSubmit={onSubmit} className="bop-card relative w-full max-w-sm p-8" noValidate>
        <div className="mb-6 flex justify-center">
          <BrandMark size={96} showWordmark />
        </div>

        <h1 className="mb-6 text-center font-display text-2xl uppercase tracking-widest text-chrome-glow">
          Panel de operaciones
        </h1>

        <div className="mb-5">
          <label htmlFor="dashboard-password" className="field-label" data-required="true">
            Contraseña
          </label>
          <input
            id="dashboard-password"
            type="password"
            required
            autoFocus
            autoComplete="current-password"
            placeholder="••••••••"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError(false);
            }}
            aria-invalid={error}
            className="field-input"
          />
        </div>

        {error && (
          <p className="field-error mb-3" role="alert">
            Contraseña incorrecta.
          </p>
        )}

        <button type="submit" className="btn btn-primary w-full">
          Entrar
        </button>
      </form>
    </div>
  );
}
