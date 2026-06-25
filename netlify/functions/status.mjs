// Netlify Function: Status-/Ergebnis-Abfrage fuer das Beta-Verkaufstext-Tool.
// Liest das von generate-background abgelegte Ergebnis aus Netlify Blobs.
// Aufruf: GET /.netlify/functions/status?id=<id>
// Antwort: { status: "pending" | "done" | "error", text?, error? }

import { getStore } from "@netlify/blobs";

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

export default async (req) => {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return json({ status: "error", error: "no id" }, 400);

  const store = getStore("verkaufstext");
  let rec = null;
  try { rec = await store.get(id, { type: "json" }); } catch { /* noch nicht da */ }

  if (!rec) return json({ status: "pending" });
  return json(rec);
};
