// Netlify function -> /.netlify/functions/live  (and /api/live via the netlify.toml redirect)
//
// Live data source (set in Netlify -> Site settings -> Environment variables):
//   FOOTBALL_DATA_TOKEN  -> live scores, results & standings (free tier at football-data.org)
//   ANTHROPIC_API_KEY    -> optional, adds scorer/assist/card leaderboards via web search
//
// Returns { matches, stats, source } which the app reads via d.matches.

const FD = "https://api.football-data.org/v4";
const MODEL = "claude-sonnet-4-20250514";
const STATUS = { IN_PLAY: "live", PAUSED: "ht", FINISHED: "ft" };

function mapMatch(m) {
  const ft = (m.score && m.score.fullTime) || {};
  return {
    home: (m.homeTeam && (m.homeTeam.tla || m.homeTeam.name)) || "",
    away: (m.awayTeam && (m.awayTeam.tla || m.awayTeam.name)) || "",
    homeScore: ft.home != null ? ft.home : null,
    awayScore: ft.away != null ? ft.away : null,
    status: STATUS[m.status] || "upcoming",
    minute: m.minute != null ? String(m.minute) : null,
    events: []
  };
}

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers, body: JSON.stringify({ error: "POST only" }) };

  const FD_TOKEN = process.env.FOOTBALL_DATA_TOKEN;
  const AN_KEY = process.env.ANTHROPIC_API_KEY;
  if (!FD_TOKEN && !AN_KEY) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "No data source set. Add FOOTBALL_DATA_TOKEN in Netlify, then redeploy.", matches: [], stats: {} }) };
  }

  let date = new Date().toDateString();
  try { date = JSON.parse(event.body || "{}").date || date; } catch (_) {}

  const out = { matches: [], stats: { scorers: [], assists: [], cards: [] }, source: [], asOf: new Date().toISOString() };

  // football-data.org: live + finished World Cup matches
  if (FD_TOKEN) {
    try {
      const r = await fetch(`${FD}/competitions/WC/matches?status=IN_PLAY,PAUSED,FINISHED`, { headers: { "X-Auth-Token": FD_TOKEN } });
      if (r.ok) { const d = await r.json(); out.matches = (d.matches || []).map(mapMatch); out.source.push("football-data"); }
    } catch (_) {}
    try {
      const r = await fetch(`${FD}/competitions/WC/scorers?limit=15`, { headers: { "X-Auth-Token": FD_TOKEN } });
      if (r.ok) { const d = await r.json(); out.stats.scorers = (d.scorers || []).map(s => ({ player: s.player && s.player.name, team: s.team && (s.team.tla || s.team.name), goals: s.goals || 0 })); }
    } catch (_) {}
  }

  // optional Anthropic enrichment (and a fallback for matches if football-data gave none)
  if (AN_KEY) {
    try {
      const prompt =
        `Use web search for 2026 FIFA World Cup data as of ${date}. Return ONLY a JSON object, no prose: ` +
        `{"matches":[{"home":"<country>","away":"<country>","homeScore":<int|null>,"awayScore":<int|null>,"status":"live"|"ft"|"ht"|"upcoming","minute":"<string|null>","events":[{"team":"<country>","player":"<name>","minute":"<num>","type":"goal"|"yellow"|"red"|"sub"}]}],` +
        `"stats":{"scorers":[{"player":"<name>","team":"<country>","goals":<int>}],"assists":[{"player":"<name>","team":"<country>","assists":<int>}],"cards":[{"player":"<name>","team":"<country>","yellow":<int>,"red":<int>}]}}. ` +
        `Top 10 each. Full country names. Empty arrays if the tournament has not started.`;
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": AN_KEY, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: MODEL, max_tokens: 2000, messages: [{ role: "user", content: prompt }], tools: [{ type: "web_search_20250305", name: "web_search" }] })
      });
      const data = await r.json();
      const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n");
      const m = text.match(/\{[\s\S]*\}/);
      const p = m ? JSON.parse(m[0]) : {};
      if (!out.matches.length && Array.isArray(p.matches)) out.matches = p.matches;
      if (p.stats) {
        if (!out.stats.scorers.length && p.stats.scorers) out.stats.scorers = p.stats.scorers;
        if (p.stats.assists) out.stats.assists = p.stats.assists;
        if (p.stats.cards) out.stats.cards = p.stats.cards;
      }
      out.source.push("anthropic");
    } catch (_) {}
  }

  return { statusCode: 200, headers, body: JSON.stringify(out) };
};
