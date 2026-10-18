export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    return res.end();
  }
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify({ error: "Method not allowed" }));
  }

  let body = "";
  for await (const chunk of req) body += chunk;
  let data = {};
  try { data = JSON.parse(body || "{}"); } catch {}

  const key = process.env.FISH_AUDIO_API_KEY || process.env.FISH_API_KEY;
  if (!key) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify({ error: "FISH_AUDIO_API_KEY missing on server" }));
  }

  const text = String(data.text || "").slice(0, 3000);
  const reference_id = data.reference_id || data.voice || "";
  if (!text) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify({ error: "text required" }));
  }

  const model = data.model || process.env.FISH_TTS_MODEL || "s2.1-pro-free";

  try {
    const r = await fetch("https://api.fish.audio/v1/tts", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + key,
        "Content-Type": "application/json",
        model
      },
      body: JSON.stringify({
        text,
        reference_id: reference_id || undefined,
        format: data.format || "mp3",
        latency: data.latency || "normal",
        normalize: true
      })
    });

    if (!r.ok) {
      const errText = await r.text();
      res.statusCode = r.status;
      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify({
        error: errText.slice(0, 500),
        proxy: { upstream: "https://api.fish.audio/v1/tts", model, status: r.status }
      }));
    }

    const buf = Buffer.from(await r.arrayBuffer());
    res.statusCode = 200;
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    return res.end(buf);
  } catch (e) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify({ error: String(e.message || e), proxy: "fetch_failed" }));
  }
}
