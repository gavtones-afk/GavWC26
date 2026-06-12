# World Cup 2026 — Matchday Board

Self-contained web app: full 72-match group stage with UK kick-off times, BBC/ITV labels,
auto standings, stats (total goals, Golden Boot, assists, clean sheets, discipline),
knockout scaffold, team following, calendar export and notifications. Live scores layer
on top via a serverless function.

## Deploy (Netlify + GitHub)
1. Upload **everything in this folder, keeping the folders intact** to your GitHub repo:
   - `index.html`, `manifest.webmanifest`, `service-worker.js`, `netlify.toml`, `README.md`
   - `icons/` (4 png files)
   - `netlify/functions/live.js`  ← must stay at this path
   - `api/live.js` (only used if you host on Vercel instead)
2. Netlify auto-deploys from the repo.
3. Set ONE environment variable in Netlify → Site settings → Environment variables:
   - `FOOTBALL_DATA_TOKEN` = your free token from https://football-data.org (register, copy token)
   - Scope: All scopes · Same value for all deploy contexts
4. After saving, redeploy (Deploys → Trigger deploy → Deploy site).
5. Open the app, tap **Live**. Before 11 June you'll see "connected, no live matches" = success.

## Optional
- `ANTHROPIC_API_KEY` (pay-as-you-go) adds the Golden Boot / assists / cards leaderboards.
  Without it, total goals + clean sheets still work (calculated from results).

## Notes
- Times show in UK first, with venue-local alongside. 🌙 = after-midnight UK kick-off.
- The live function is never cached; the rest works offline.
