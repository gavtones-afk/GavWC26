// Vercel serverless function -> available at /api/live
// Holds your Anthropic API key server-side so it is never exposed in the app.
// Set the key in Vercel: Project Settings -> Environment Variables -> ANTHROPIC_API_KEY

const MODEL = "claude-sonnet-4-20250514"; // swap for a newer model string anytime

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: "ANTHROPIC_API_KEY not set" });

  const date = (req.body && req.body.date) || new Date().toDateString();
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
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
        tools: [{ type: "web_search_20250305", name: "web_search" }]
      })
    });
    const data = await r.json();
    const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n");
    const match = text.match(/\[[\s\S]*\]/);
    const matches = match ? JSON.parse(match[0]) : [];
    return res.status(200).json({ matches, asOf: new Date().toISOString() });
  } catch (e) {
    return res.status(502).json({ error: "upstream failed", matches: [] });
  }
}
