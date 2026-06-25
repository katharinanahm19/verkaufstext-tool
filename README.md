# Beta-Verkaufstext-Tool

Web-Tool für Launch-Sisters-Kundinnen: lädt **Wunschkundenavatar** + **Produktsheet** als PDF
hoch (plus optionales Textfeld) und schreibt daraus den fertigen **9-Block-Verkaufstext** für die
Beta-Anmeldeseite (JotForm). Block-für-Block kopierbar, .doc-Export, „Weiter optimieren"-Chat.

## Architektur

- `index.html` — komplettes Frontend (statisch). Liest die PDFs im Browser, baut den Prompt, ruft `/api/claude`.
- `netlify/functions/claude.mjs` — Serverless-Proxy. Hält `ANTHROPIC_API_KEY` **serverseitig** (nie im Browser). Modell: Opus 4.8.
- `netlify.toml` — Netlify-Config.

## Deploy (GitHub → Netlify)

1. Dieses Repo auf GitHub anlegen und pushen.
2. Auf [app.netlify.com](https://app.netlify.com): **Add new site → Import from Git** → dieses Repo wählen.
   Build command: *(leer)* · Publish directory: `.` · Functions directory: `netlify/functions` (liest Netlify aus `netlify.toml`).
3. **Site settings → Environment variables**: `ANTHROPIC_API_KEY = sk-ant-…` (Key von console.anthropic.com).
4. **Trigger deploy** → live. Jeder weitere Git-Push deployt automatisch.

> Vercel geht genauso (Import from Git, Env-Variable identisch). GitHub Pages **nicht** — kann die Function nicht ausführen, der Key wäre nicht zu schützen.

## An Kundinnen ausspielen

Netlify-URL per iframe in Ablefy/Circle einbetten:

```html
<iframe src="https://DEINE-SITE.netlify.app" style="width:100%;height:1400px;border:0"></iframe>
```

## Prompt anpassen

Der Prompt sitzt in `index.html` in den Konstanten `VOICE`, `PLACEHOLDER_RULE`, `FORMAT`.
Struktur-Vorlage ist `L6 Verkaufstext` (9 Blöcke).
