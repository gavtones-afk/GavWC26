// Netlify function -> available at /.netlify/functions/live
// If you deploy on Netlify, change LIVE_ENDPOINT in index.html to "/.netlify/functions/live".
// Set the key in Netlify: Site settings -> Environment variables -> ANTHROPIC_API_KEY

const MODEL = "claude-sonnet-4-20250514";

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers, body: JSON.stringify({ error: "POST only" }) };
  if (!process.env.ANTHROPIC_API_KEY) return { statusCode: 500, headers, body: JSON.stringify({ error: "ANTHROPIC_API_KEY not set" }) };

  let date = new Date().toDateString();
  try { date = JSON.parse(event.body || "{}").date || date; } catch (_) {}

  const prompt =
    `Use web search to find the live and finished 2026 FIFA World Cup matches for ${date} (and any in progress now). ` +
    `Return ONLY a JSON array, no prose, no markdown fences. Each element: ` +
    `{"home":"<full country name>","away":"<full country name>","homeScore":<int|null>,"awayScore":<int|null>,` +
    `"status":"live"|"ft"|"ht"|"upcoming","minute":"<string|null>",` +
    `"events":[{"team":"<full country name>","player":"<name>","minute":"<num>","type":"goal"|"yellow"|"red"|"sub"}]}. ` +
    `If no matches are live or finished today, return [].`;

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: MODEL, max_tokens: 1500, messages: [{ role: "user", content: prompt }], tools: [{ type: "web_search_20250305", name: "web_search" }] })
    });
    const data = await r.json();
    const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n");
    const m = text.match(/\[[\s\S]*\]/);
    return { statusCode: 200, headers, body: JSON.stringify({ matches: m ? JSON.parse(m[0]) : [], asOf: new Date().toISOString() }) };
  } catch (e) {
    return { statusCode: 502, headers, body: JSON.stringify({ error: "upstream failed", matches: [] }) };
  }
};
