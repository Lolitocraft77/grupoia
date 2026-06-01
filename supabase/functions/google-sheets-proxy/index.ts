// Edge Function: google-sheets-proxy
// Proxies a GET to the Apps Script URL stored in env var APPS_SCRIPT_URL.
// Public (no JWT required) so the dashboard can call it without auth.
//
// Deploy:
//   supabase secrets set APPS_SCRIPT_URL="https://script.google.com/macros/s/.../exec"
//   supabase functions deploy google-sheets-proxy --no-verify-jwt

const APPS_SCRIPT_URL = Deno.env.get("APPS_SCRIPT_URL") ?? "";

const allowedOrigins =
  Deno.env.get("ALLOWED_ORIGINS")?.split(",").map((s) => s.trim()) ?? ["*"];

const corsOrigin = (requestOrigin: string | null) => {
  if (allowedOrigins.includes("*")) return "*";
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    return requestOrigin;
  }
  return allowedOrigins[0] ?? "*";
};

const corsHeaders = (requestOrigin: string | null) => ({
  "Access-Control-Allow-Origin": corsOrigin(requestOrigin),
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
});

const MAX_ATTEMPTS = 2;
const ATTEMPT_TIMEOUT_MS = 10000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const looksLikeHtml = (body: string) => {
  const t = body.trimStart().slice(0, 64).toLowerCase();
  return t.startsWith("<!doctype") || t.startsWith("<html");
};

/**
 * Calls APPS_SCRIPT_URL with browser-like headers, a per-attempt timeout, and
 * follows Google's 302 → googleusercontent.com redirect. Retries on transient
 * failures (network error, non-ok status, HTML, or non-JSON body) because that
 * chain intermittently serves an HTML interstitial instead of the JSON — the
 * cause of the intermittent 502s.
 *
 * Returns parsed JSON on success, or throws after MAX_ATTEMPTS with detail.
 */
async function fetchUpstream(): Promise<unknown> {
  let lastErr = "";
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), ATTEMPT_TIMEOUT_MS);
    try {
      const res = await fetch(APPS_SCRIPT_URL, {
        method: "GET",
        redirect: "follow",
        signal: ctrl.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; BopProxy/1.0; +https://supabase.com)",
          "Accept": "application/json, text/plain, */*",
        },
      });
      const body = await res.text();

      if (!res.ok) {
        lastErr = `status ${res.status}`;
        console.warn(`[proxy] attempt ${attempt} non-ok: ${lastErr}`);
        await sleep(250 * attempt);
        continue;
      }
      if (looksLikeHtml(body)) {
        lastErr = "received HTML (redirect interstitial)";
        console.warn(`[proxy] attempt ${attempt}: ${lastErr}`);
        await sleep(250 * attempt);
        continue;
      }
      try {
        return JSON.parse(body);
      } catch {
        lastErr = `non-JSON body (snippet: ${body.slice(0, 120)})`;
        console.warn(`[proxy] attempt ${attempt}: ${lastErr}`);
        await sleep(250 * attempt);
        continue;
      }
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e);
      console.warn(`[proxy] attempt ${attempt} fetch error: ${lastErr}`);
      await sleep(250 * attempt);
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error(`upstream failed after ${MAX_ATTEMPTS} attempts: ${lastErr}`);
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const headers = corsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  if (!APPS_SCRIPT_URL.startsWith("https://script.google.com/")) {
    return new Response(
      JSON.stringify({
        error:
          "APPS_SCRIPT_URL not configured. Run: supabase secrets set APPS_SCRIPT_URL=...",
      }),
      { status: 500, headers: { ...headers, "Content-Type": "application/json" } },
    );
  }

  try {
    const parsed = await fetchUpstream();

    // Apps Script reported an explicit error → real failure, not transient.
    if (
      parsed &&
      typeof parsed === "object" &&
      "error" in parsed &&
      typeof (parsed as { error: unknown }).error === "string"
    ) {
      return new Response(
        JSON.stringify({
          error: `Apps Script error: ${(parsed as { error: string }).error}`,
        }),
        {
          status: 502,
          headers: { ...headers, "Content-Type": "application/json" },
        },
      );
    }

    if (
      !parsed ||
      typeof parsed !== "object" ||
      !Array.isArray((parsed as { teams?: unknown }).teams) ||
      !Array.isArray((parsed as { newSales?: unknown }).newSales)
    ) {
      return new Response(
        JSON.stringify({
          error: "Apps Script payload missing teams[] / newSales[]",
        }),
        {
          status: 502,
          headers: { ...headers, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify(parsed), {
      headers: {
        ...headers,
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[proxy] ${message}`);
    return new Response(JSON.stringify({ error: message }), {
      status: 502,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }
});
