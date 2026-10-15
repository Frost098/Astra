export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const {
      text,
      reference_id,
      format = "mp3"
    } = req.body || {};

    if (!text) {
      return res.status(400).json({
        error: "Text is required"
      });
    }

    if (!reference_id) {
      return res.status(400).json({
        error: "reference_id is required"
      });
    }

    const apiKey = process.env.FISH_AUDIO_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "FISH_AUDIO_API_KEY belum diatur di Vercel Environment Variables"
      });
    }

    const fishResponse = await fetch(
      "https://api.fish.audio/v1/tts",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Accept": "audio/mpeg",
          "model": "s2.1-pro-free"
        },
        body: JSON.stringify({
          text: String(text).slice(0, 3000),
          reference_id,
          format
        })
      }
    );

    if (!fishResponse.ok) {
      const errorText = await fishResponse.text();

      return res.status(fishResponse.status).json({
        error: errorText || "Fish Audio request failed"
      });
    }

    const audioBuffer = Buffer.from(
      await fishResponse.arrayBuffer()
    );

    res.setHeader(
      "Content-Type",
      fishResponse.headers.get("content-type") || "audio/mpeg"
    );

    res.setHeader(
      "Cache-Control",
      "no-store"
    );

    return res.status(200).send(audioBuffer);

  } catch (error) {
    console.error("Fish TTS proxy error:", error);

    return res.status(500).json({
      error: error.message || "Internal server error"
    });
  }
}