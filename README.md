# Group I.A — Dashboard de ventas

Dashboard de ventas en tiempo real con identidad **monocromática premium**: negro profundo, plata cepillada y platino, tipografía limpia en mayúsculas con tracking amplio. Cuando un agente cierra una venta, se dispara una **animación de reconocimiento** con foto, monto, partículas con física suave y 3 SFX (arranque mecánico → ráfaga → stinger de confirmación).

> **Misma arquitectura, contratos y rutas** que el repo origen. Sólo cambia la identidad visual y la animación/SFX del reconocimiento.

## Stack

- React 18 + TypeScript + Vite
- React Router v7
- Tailwind CSS
- Framer Motion + CSS keyframes
- Supabase (Auth + Postgres + Storage + Edge Functions)
- WaveSurfer.js v7 (audio trimmer del admin)
- React Hook Form + Zod
- Lucide React

## 1) Correr en local

```bash
cp .env.example .env       # rellenar con los valores de Supabase
npm install
npm run dev
```

Si no hay Supabase configurado todavía, el dashboard cae a `mockTeams` y la animación se puede probar disparando ventas desde el admin en cuanto conectes el backend.

> **Nota WSL:** si tu `npm` está en `/mnt/c/Program Files/nodejs/` y el repo en el filesystem Linux, npm falla con `UNC paths are not supported`. Solución: instalar Node nativo en Linux (vía nvm o apt), o correr desde PowerShell en Windows.

## 2) Configurar Supabase

1. **Crear proyecto** en [supabase.com](https://supabase.com).
2. **Copiar credenciales** desde *Project Settings → API*:
   - `VITE_SUPABASE_URL` → URL del proyecto.
   - `VITE_SUPABASE_ANON_KEY` → publishable key (`sb_publishable_...`) o la anon legacy.
   Pegar en `.env`.
3. **Correr la migración inicial** (crea tablas, RLS, buckets):
   - Vía Supabase CLI: `supabase db push`
   - O vía Dashboard: *SQL editor* → pegar `supabase/migrations/0001_initial_schema.sql` → Run.
4. **Seed** (3 mesas + tunables):
   - SQL editor → pegar `supabase/seed.sql` → Run.
5. **Crear el usuario admin**:
   - *Authentication → Users → Add user* → email + password → marcar *Auto Confirm*.
   - No hay signup público; sólo este usuario puede entrar a `/admin`.
6. **Desplegar la Edge Function** (con la URL del Apps Script como secret):

   ```bash
   supabase link --project-ref <your-project-ref>
   supabase secrets set APPS_SCRIPT_URL="https://script.google.com/macros/s/.../exec"
   supabase functions deploy google-sheets-proxy --no-verify-jwt
   ```

   Si más adelante recreás el deployment desde Apps Script, Google va a darte un ID/URL nuevos. Repetí el `supabase secrets set` y el `deploy` con la URL nueva.

## 3) Apps Script (Google Sheets)

El proyecto usa el mismo `doGet()` que el repo original. Vive en `supabase/apps-script/Code.gs`. Devuelve:

```json
{
  "teams": [{
    "id": "mesa-1",
    "name": "Mesa 1",
    "goal": 50000,
    "total_real": 12345,
    "agents": [{ "id": "...", "name": "Alexis", "sales": 4500, "teamId": "mesa-1" }]
  }],
  "newSales": [{ "agentName": "Alexis", "entryDate": "...", "value": 1500 }]
}
```

Si tu Sheet aún no está publicado:

1. *Extensiones → Apps Script* en tu Sheet.
2. Pegar el contenido de `supabase/apps-script/Code.gs`.
3. *Implementar → Nueva implementación → Aplicación web*:
   - *Ejecutar como:* yo
   - *Quién tiene acceso:* **cualquier persona**
4. Copiar la URL `https://script.google.com/macros/s/.../exec` y pegarla en el `supabase secrets set APPS_SCRIPT_URL=...` del paso 6 de arriba.

## 3.1) Verificar la conexión Sheet → Supabase

```bash
npm run check:sheet                     # tablas + Edge Function
npm run check:sheet -- "<url-apps-script>"  # además prueba el Apps Script directo
```

| Error | Causa | Solución |
|---|---|---|
| `No item with the given ID could be found` | El Apps Script del secret `APPS_SCRIPT_URL` no puede abrir su Sheet (Sheet borrado, copiado, script standalone o `SPREADSHEET_ID` incorrecto) | Abrí **tu** Sheet → *Extensiones → Apps Script*, pegá `Code.gs`, *Nueva implementación*, y actualizá el secret con la URL nueva |
| `APPS_SCRIPT_URL not configured` | Falta el secret | `supabase secrets set APPS_SCRIPT_URL=...` |
| HTTP 404 en la función | Edge Function no desplegada | `supabase functions deploy google-sheets-proxy --no-verify-jwt` |
| `Falta hoja 'Tabla'` / `'Equipos'` / `'Base_Agregada'` | El Sheet no tiene las pestañas esperadas | Renombrá las pestañas o ajustá `Code.gs` |
| Apps Script devuelve HTML | La implementación no es pública | *Quién tiene acceso: cualquier persona* |

> Los nombres de mesa del Sheet deben coincidir con `teams.id` / `teams.name` en Supabase para que se crucen bien.

## 4) Desplegar a producción

Recomendado: **Vercel** (Vite framework preset).

1. Importar el repo en Vercel.
2. Setear las dos env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) y opcionalmente `VITE_BRAND_*` en *Project Settings → Environment Variables*.
3. *Deploy*.

La Edge Function vive en Supabase, no en Vercel.

## Estructura

```
src/
├── pages/
│   ├── Index.tsx              # Dashboard público
│   ├── AdminLogin.tsx
│   ├── AdminDashboard.tsx
│   └── NotFound.tsx
├── components/
│   ├── dashboard/             # AmbientBackground, StartScreen, DashboardView,
│   │                          # TeamCard, AgentRow, SpotlightOverlay (reconocimiento),
│   │                          # NeonText, BrandMark, RankBadge
│   ├── admin/                 # ProtectedRoute, AgentsTab, TeamsTab,
│   │                          # SettingsTab, AgentDialog
│   └── ui/button.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useAgents.ts
│   ├── useAgentsAdmin.ts
│   ├── useAppSettings.ts
│   ├── useAppSettingsAdmin.ts
│   ├── useTeamsAdmin.ts
│   ├── useGoogleSheetData.ts
│   ├── useAudioPlayer.ts
│   └── useSpotlightSfx.ts     # SFX del reconocimiento (mechanical / burst / stinger)
├── lib/                       # supabase.ts, buildTeams.ts, utils.ts, logger.ts
├── types/                     # index.ts (UI), database.ts (rows)
├── config/                    # constants.ts, branding.ts, mockData.ts
├── styles/animations.css
├── index.css                  # paleta bop, marco grabado, botones premium
└── main.tsx

public/
├── bg-bop.svg                 # background con grid plateado + spotlights
├── favicon.svg
├── logos/bop.svg
└── sounds/                    # opcional — drop-in MP3 que reemplazan los SFX sintetizados

supabase/
├── migrations/0001_initial_schema.sql
├── functions/google-sheets-proxy/index.ts
├── apps-script/Code.gs
└── seed.sql
```

## Variables de entorno

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_BRAND_NAME=Business Operations 12:12
VITE_BRAND_LOGO=/logos/bop.svg
VITE_BRAND_TAGLINE=Operaciones · Rendimiento · Tiempo real
VITE_BRAND_MONOGRAM=BOP
```

---

## Guía de rebranding

Esta app está pensada para ser **clonada con otra identidad** sin tocar componentes.

### 1) Nombre, tagline, monograma

Editá `.env` (o `src/config/branding.ts` si querés bakearlo en el código):

| Variable | Para qué |
|---|---|
| `VITE_BRAND_NAME` | Nombre comercial (header, login, título de pestaña) |
| `VITE_BRAND_LOGO` | Ruta del logo en `/public` (`null`/vacío = se usa el monograma SVG) |
| `VITE_BRAND_TAGLINE` | Línea bajo el brand en la start screen |
| `VITE_BRAND_MONOGRAM` | 1–3 letras de fallback si no hay logo |

### 2) Logo

Reemplazá `public/logos/bop.svg` o apuntá `VITE_BRAND_LOGO` a otro path. Si la imagen no carga, el componente `BrandMark` cae automáticamente al monograma SVG (la luna creciente plateada).

### 3) Paleta

La paleta vive en dos lugares y deben quedar en sync:

- **Tokens CSS** en `src/index.css` (`:root { --bop-* }`). Cambiá esos valores y todo el dashboard sigue.
- **Tailwind** en `tailwind.config.ts` (`colors.bop`).

Tokens principales:

- `--bop-chrome`, `--bop-chrome-light`, `--bop-chrome-dark`  ← acento metálico (plata)
- `--bop-silver`, `--bop-platinum`                            ← texto / metales
- `--bop-void`, `--bop-onyx`                                  ← fondo
- `colors.bop.*` correspondiente en Tailwind

### 4) Fondo

`public/bg-bop.svg` es el fondo. Si querés otro, dejá el archivo con el mismo nombre o cambiá `--bg-image` en `src/index.css`.

### 5) Tipografía

Las families se cargan desde Google Fonts en `index.html`. Cambiá:

- Display (limpia, mayúsculas, tracking amplio): `Jost`
- Sans (UI): `Inter` / `Manrope`
- Digital (counters): `JetBrains Mono` / `IBM Plex Mono`

Después actualizá `tailwind.config.ts` (`fontFamily`) y los stacks en `src/index.css`.

---

## Guía para cambiar sonidos / animaciones

### Sonidos del reconocimiento

Por defecto los 3 SFX se sintetizan en runtime con la Web Audio API (sin archivos binarios → 0 bytes en producción).

`useSpotlightSfx` expone `mechanical()`, `burst()` y `stinger()`. Editá las frecuencias, duraciones y filtros directamente en `src/hooks/useSpotlightSfx.ts`.

**Volumen y mute** son configurables en `/admin → Configuración → Audio`. Persisten en localStorage:
- `bop.audio.muted` (`"1"` / `"0"`)
- `bop.audio.master` (número 0–1)

### Animación

- Tiempos por etapa: `src/config/constants.ts` (`STAGE_FLASH_MS`, `STAGE_ARM_MS`, `STAGE_STREAM_MS`, `STAGE_REVEAL_MS`).
- Duración total: `app_settings.spotlight_duration_seconds` en Supabase (editable desde `/admin`).
- Densidad de partículas y modo fallback: `useReducedFx()` en `SpotlightOverlay.tsx` (detecta `prefers-reduced-motion`, cores ≤ 4 o memoria ≤ 4 GB → reduce el número de elementos).
- Geometría del emisor / token: SVG inline al final de `SpotlightOverlay.tsx` (sin dependencias externas).

---

## Checklist de validación final

- [ ] `/` carga el dashboard público (con mock o datos reales).
- [ ] `/admin/login` autentica con Supabase.
- [ ] `/admin` muestra tabs *Agentes*, *Mesas*, *Configuración* y exige sesión.
- [ ] La animación de reconocimiento dispara con flash plateado, partículas con física, contador y camera shake.
- [ ] Los 3 SFX (mechanical / burst / stinger) suenan y respetan mute + volumen.
- [ ] Cola serial: dos ventas seguidas no encinan animaciones.
- [ ] `npm run build` termina sin errores.
- [ ] Mobile y desktop responsivos.

---

## Origen y acuerdos preservados

- Misma estructura de tablas (`teams`, `agents`, `app_settings`) y nombres de campos.
- Mismo contrato Apps Script (`teams[]`, `newSales[]`, `submittedAt`).
- Misma cola serial de reconocimientos, hidratación de `processed` desde localStorage, y dedupe por `agentName|submittedAt|value`.
- Mismas rutas: `/`, `/admin/login`, `/admin`, `/404`.
- Misma Edge Function (`google-sheets-proxy`) con CORS configurable y validación de payload.

Si comparás este proyecto con el original, **se siente el mismo producto en lógica y UX**, pero con identidad visual y audiovisual totalmente nueva: *monocromática premium, plata sobre negro*.
