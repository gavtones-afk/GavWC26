# World Cup 2026 — Matchday Board (PWA)

An installable web app that tracks every 2026 World Cup match: groups, stadiums,
UK kick-off times, scorers, cards, subs, results, standings, the knockout bracket,
a live stats tab (total goals, Golden Boot, assists, cards, clean sheets),
followed teams, calendar export and alerts.

This folder is a complete Progressive Web App. Host it once and anyone can install
it on their phone from the browser. No app store needed.

## What each file does

- `index.html` — the whole app (UI, data, logic). Runs on its own, even offline.
- `manifest.webmanifest` — tells the phone the app's name, icon, colours and that it
  should open fullscreen like a real app.
- `service-worker.js` — caches the app so it loads instantly and works offline, and
  is ready to receive push notifications.
- `icons/` — the home-screen icons.
- `api/live.js` — a tiny serverless function (Vercel) that fetches live scores. It
  holds your API key on the server so it is never exposed in the app.
- `netlify/functions/live.js` — the same thing for Netlify.
- `netlify.toml` — Netlify config (ignore if you use Vercel).

## Live data: where it comes from

The "Live" button calls a tiny serverless function (`api/live.js` on Vercel,
`netlify/functions/live.js` on Netlify) that fetches data and returns it to the app.
Keys live in that function, never in the phone's code. You set either or both of
these as environment variables on your host:

- `FOOTBALL_DATA_TOKEN` (recommended) — reliable live scores, results and standings
  from football-data.org. The free tier covers the World Cup. This drives the
  schedule scores, the standings, the total-goals counter and clean sheets.
- `ANTHROPIC_API_KEY` (optional) — adds the Golden Boot, assists and cards
  leaderboards via AI web search. Best-effort, not broadcast-grade. You can also
  get reliable scorers/cards by upgrading football-data.org to its paid tier.

With at least one set, live data works. Everything else — the full schedule,
bracket, following, calendar export, kick-off alerts — works with no key at all,
even offline.

### Get a football-data.org token (free, ~2 minutes)

1. Register at football-data.org/client/register and confirm your email.
2. Copy the API token from your account page.
3. Add it on your host as `FOOTBALL_DATA_TOKEN` (see deploy steps below), redeploy.

Free tier is 10 requests/minute, which is plenty — the app only fetches when you
tap Live.

## Deploy in ~5 minutes (Vercel, recommended)

1. Create a free account at vercel.com.
2. Get a football-data.org token (above). Optionally an Anthropic key too.
3. Install the CLI: `npm i -g vercel`
4. In this folder run: `vercel`  (accept the defaults).
5. Add your token: `vercel env add FOOTBALL_DATA_TOKEN`  (paste it, choose Production).
   Optionally also: `vercel env add ANTHROPIC_API_KEY`
6. Deploy for real: `vercel --prod`

You get a URL like `https://your-app.vercel.app`. The `api/live.js` file is
automatically served at `/api/live`, which is what the app already calls. Done.


(Prefer clicking to typing? Push this folder to a GitHub repo, then "Import Project"
in Vercel and add the `FOOTBALL_DATA_TOKEN` (and optional `ANTHROPIC_API_KEY`)
environment variables in the dashboard.)

## Deploy on Netlify instead

1. Create a free Netlify account and get a football-data.org token (above).
2. Drag this whole folder onto the Netlify dashboard (so `netlify.toml` is at the
   root of what you drop), or connect a GitHub repo. The included `netlify.toml`
   builds the function and redirects `/api/live` to it, so no code editing is needed.
3. In Site settings -> Environment variables, add `FOOTBALL_DATA_TOKEN`
   (and optionally `ANTHROPIC_API_KEY`).
4. Trigger a redeploy so the new variables and function are picked up.

If "Live" says the function wasn't found, the deploy that's up is an older one
without the redirect, or the function didn't build — redeploy this exact folder
and confirm a "live" function appears under Site -> Functions.

## GitHub Pages (free, but no live scores)

GitHub Pages only serves static files, so the live function won't run there.
The full schedule, standings, bracket, following and calendar export still work.
Just upload the files (minus the `api`/`netlify` folders) to a repo and enable Pages.

## Put it on a phone

1. Open your deployed URL in Safari (iPhone) or Chrome (Android).
2. iPhone: Share -> Add to Home Screen. Android: menu -> Install app / Add to Home Screen.
3. Open it from the new icon. It runs fullscreen, offline-capable.
4. Tap the bell to turn on alerts, and star teams or matches to follow them.

## About notifications (honest version)

- Alerts before a followed match, and goal alerts during a refresh, work while the
  app is open or recently backgrounded. This needs no extra setup.
- True push to a fully closed app (e.g. an automatic goal alert with the app shut)
  needs a push server: generate VAPID keys, save each device's push subscription,
  and run a small background job that watches scores and sends pushes. The service
  worker here already has the receiving side wired up (`push` + `notificationclick`),
  so that is an add-on, not a rewrite. Ask and I'll build it.

## Updating the schedule

`index.html` ships with the opener plus the first two match-weeks at confirmed UK
times. The `MATCHES` array near the top of the script is where fixtures live — add
more in the same format, or just rely on the Live button to fill them in.
