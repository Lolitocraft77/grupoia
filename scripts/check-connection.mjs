// Diagnóstico Sheet → Supabase. Uso: npm run check:sheet [-- <apps-script-url>]
// Lee VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY de .env.
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error("✗ Falta VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en .env");
  process.exit(1);
}
const h = { apikey: key, Authorization: `Bearer ${key}` };
let ok = true;

const summarize = (j) =>
  `${j.teams.length} mesa(s): ${j.teams.map((t) => t.name).join(", ")} · ${j.newSales.length} ventas`;

// 1) Tablas
for (const t of ["teams", "agents", "app_settings"]) {
  const r = await fetch(`${url}/rest/v1/${t}?select=*`, { headers: h });
  const body = await r.json().catch(() => null);
  if (r.ok) console.log(`✓ tabla ${t}: ${body.length} fila(s)`);
  else {
    ok = false;
    console.log(`✗ tabla ${t}: HTTP ${r.status} ${body?.message ?? ""} → corré supabase/migrations/0001_initial_schema.sql`);
  }
}

// 2) Edge Function (Sheet vía Apps Script)
const r = await fetch(`${url}/functions/v1/google-sheets-proxy`, { headers: h });
const j = await r.json().catch(() => ({ error: `respuesta no-JSON (HTTP ${r.status})` }));
if (r.ok && Array.isArray(j.teams)) console.log(`✓ google-sheets-proxy: ${summarize(j)}`);
else {
  ok = false;
  console.log(`✗ google-sheets-proxy: HTTP ${r.status} ${j.error ?? j.message ?? JSON.stringify(j)}`);
  if (r.status === 404) console.log("  → la función no está desplegada: supabase functions deploy google-sheets-proxy --no-verify-jwt");
  if (/No item with the given ID/.test(j.error ?? ""))
    console.log("  → el Apps Script del secret APPS_SCRIPT_URL no puede abrir su Sheet. Redesplegalo desde Extensiones → Apps Script de TU Sheet y actualizá el secret.");
  if (/not configured/.test(j.error ?? "")) console.log("  → falta el secret: supabase secrets set APPS_SCRIPT_URL=...");
}

// 3) Opcional: probar una URL de Apps Script directamente
const direct = process.argv[2];
if (direct) {
  const d = await fetch(direct, { redirect: "follow" });
  const t = await d.text();
  try {
    const dj = JSON.parse(t);
    if (dj.error) { ok = false; console.log(`✗ Apps Script directo: ${dj.error}`); }
    else console.log(`✓ Apps Script directo: ${summarize(dj)}`);
  } catch {
    ok = false;
    console.log(`✗ Apps Script directo: no devolvió JSON (¿acceso "cualquier persona"?) HTTP ${d.status}`);
  }
}

process.exit(ok ? 0 : 1);
