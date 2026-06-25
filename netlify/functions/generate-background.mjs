// Netlify BACKGROUND Function (Dateiname endet auf "-background" -> laeuft asynchron bis 15 Min,
// umgeht damit das 10-Sekunden-Limit normaler Functions). Ruft Claude auf und legt das Ergebnis
// in Netlify Blobs ab. Der Client startet diese Function und pollt danach status.mjs.
//
// Key liegt serverseitig in der Env ANTHROPIC_API_KEY (nie im Browser).
// Aufruf: POST /.netlify/functions/generate-background
//   { id: string, model?: string, max_tokens?: number, messages: [...] }

import { getStore } from "@netlify/blobs";

const DEFAULT_MODEL = "claude-opus-4-8";
const ALLOWED_MODELS = new Set([
  "claude-opus-4-8",
  "claude-sonnet-4-6",
  "claude-haiku-4-5-20251001",
]);
const MAX_TOKENS_CAP = 6000;

export default async (req) => {
  let body;
  try { body = await req.json(); } catch { return new Response("bad json", { status: 400 }); }

  const { id, messages, max_tokens, model } = body || {};
  if (!id || !Array.isArray(messages) || messages.length === 0) {
    return new Response("missing id/messages", { status: 400 });
  }

  const store = getStore("verkaufstext");

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    await store.setJSON(id, { status: "error", error: "ANTHROPIC_API_KEY nicht gesetzt" });
    return new Response("no key", { status: 202 });
  }

  const useModel = ALLOWED_MODELS.has(model) ? model : DEFAULT_MODEL;
  const tokens = Math.min(Number(max_tokens) || 5000, MAX_TOKENS_CAP);

  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({ model: useModel, max_tokens: tokens, messages }),
    });
    const data = await resp.json().catch(() => null);
    if (!resp.ok || !data) {
      await store.setJSON(id, { status: "error", error: data?.error?.message || ("anthropic " + resp.status) });
      return new Response("anthropic error", { status: 202 });
    }
    const text = data.content?.[0]?.text || "";
    await store.setJSON(id, { status: "done", text });
  } catch (e) {
    await store.setJSON(id, { status: "error", error: String(e?.message || e) });
  }
  return new Response("ok", { status: 202 });
};
