# World Cup 2026 — Matchday Board (PWA)

An installable web app that tracks every 2026 World Cup match: groups, stadiums,
UK kick-off times, scorers, cards, subs, results, standings, the knockout bracket,
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

## The one thing to know about live scores

The "Live" button fetches current scores by asking an AI model with web search.
That needs an API key, which must never sit in the phone's code or anyone could
read and abuse it. So the key lives in the serverless function (`api/live.js`),
and the app calls that function instead.

Everything else — the full schedule, standings, bracket, following, calendar
export, kick-off alerts — works with no key and no internet after first load.

## Deploy in ~5 minutes (Vercel, recommended)

1. Create a free account at vercel.com.
2. Get an Anthropic API key at console.anthropic.com (Settings -> API Keys).
3. Install the CLI: `npm i -g vercel`
4. In this folder run: `vercel`  (accept the defaults).
5. Add your key: `vercel env add ANTHROPIC_API_KEY`  (paste the key, choose Production).
6. Deploy for real: `vercel --prod`

You get a URL like `https://your-app.vercel.app`. The `api/live.js` file is
automatically served at `/api/live`, which is what the app already calls. Done.

(Prefer clicking to typing? Push this folder to a GitHub repo, then "Import Project"
in Vercel and add the `ANTHROPIC_API_KEY` environment variable in the dashboard.)

## Deploy on Netlify instead

1. Create a free Netlify account and get an Anthropic API key (as above).
2. In `index.html`, change one line near the live code:
   `const LIVE_ENDPOINT="/api/live";` -> `const LIVE_ENDPOINT="/.netlify/functions/live";`
3. Drag this folder onto the Netlify dashboard, or connect a GitHub repo.
4. In Site settings -> Environment variables, add `ANTHROPIC_API_KEY`.

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
