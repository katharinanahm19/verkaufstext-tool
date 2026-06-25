// Netlify Function: Proxy für das Beta-Verkaufstext-Tool.
// Hält den Anthropic-API-Key serverseitig (Env ANTHROPIC_API_KEY), damit er
// NICHT im Browser/Quelltext steht. Der Client schickt nur die Nachricht.
//
// Aufruf: POST /api/claude
//   { max_tokens?: number, model?: string, messages: [{ role:"user", content:"..." }] }
// Antwort: die rohe Anthropic-Messages-Antwort (Frontend liest content[0].text).

export const config = { path: "/api/claude" };

// Verkaufstext = Qualitätsarbeit -> Opus als Default.
const DEFAULT_MODEL = "claude-opus-4-8";
const ALLOWED_MODELS = new Set([
  "claude-opus-4-8",
  "claude-sonnet-4-6",
  "claude-haiku-4-5-20251001",
]);
const MAX_TOKENS_CAP = 6000;

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export default async (req) => {
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  let body;
  try { body = await req.json(); } catch { return json({ error: "bad json" }, 400); }

  const { messages, max_tokens, model } = body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return json({ error: "missing messages" }, 400);
  }

  const useModel = ALLOWED_MODELS.has(model) ? model : DEFAULT_MODEL;

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return json({ error: "ANTHROPIC_API_KEY nicht gesetzt" }, 500);

  const tokens = Math.min(Number(max_tokens) || 4000, MAX_TOKENS_CAP);

  let resp;
  try {
    resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({ model: useModel, max_tokens: tokens, messages }),
    });
  } catch {
    return json({ error: "anthropic unreachable" }, 502);
  }

  const data = await resp.json().catch(() => null);
  if (!resp.ok || !data) {
    return json({ error: data?.error?.message || "anthropic error", status: resp.status }, 502);
  }
  return json(data, 200);
};
