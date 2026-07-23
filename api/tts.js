// Proxy server-side ke ElevenLabs Text-to-Speech (streaming).
// API key tetap di server (env var), tidak pernah dikirim ke browser.
// Menerima GET (?text=...) supaya elemen <audio> browser bisa langsung
// stream & mulai memutar sebelum seluruh audio selesai di-generate.

export default async function handler(req, res) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "ELEVENLABS_API_KEY belum disetel di Vercel." });
    return;
  }

  const text = req.method === "GET" ? req.query?.text : req.body?.text;
  const voiceId = req.method === "GET" ? req.query?.voiceId : req.body?.voiceId;

  if (!text) {
    res.status(400).json({ error: "Field 'text' wajib diisi." });
    return;
  }

  const vid = voiceId || process.env.ELEVENLABS_VOICE_ID || "pNInz6obpgDQGcFmaJgB";

  const upstream = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${vid}/stream`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_flash_v2_5",
      voice_settings: { stability: 0.45, similarity_boost: 0.8 },
      output_format: "mp3_44100_64",
    }),
  });

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => "");
    res.status(upstream.status || 502).json({ error: "ElevenLabs TTS gagal", detail });
    return;
  }

  res.writeHead(200, {
    "Content-Type": "audio/mpeg",
    "Cache-Control": "no-store",
  });

  for await (const chunk of upstream.body) {
    res.write(chunk);
  }
  res.end();
}
