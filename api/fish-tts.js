export default async function handler(req, res) {
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
  try {
    const r = await fetch("https://api.fish.audio/v1/tts", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + key,
        "Content-Type": "application/json",
        model: "s1"
      },
      body: JSON.stringify({
        text,
        reference_id: reference_id || undefined,
        format: data.format || "mp3"
      })
    });
    if (!r.ok) {
      const errText = await r.text();
      res.statusCode = r.status;
      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify({ error: errText.slice(0, 500) }));
    }
    const buf = Buffer.from(await r.arrayBuffer());
    res.statusCode = 200;
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.end(buf);
  } catch (e) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify({ error: String(e.message || e) }));
  }
}
