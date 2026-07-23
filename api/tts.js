// Proxy server-side ke ElevenLabs Text-to-Speech.
// API key tetap di server (env var), tidak pernah dikirim ke browser.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "ELEVENLABS_API_KEY belum disetel di Vercel." });
    return;
  }

  const { text, voiceId } = req.body || {};
  if (!text) {
    res.status(400).json({ error: "Field 'text' wajib diisi." });
    return;
  }

  const vid = voiceId || process.env.ELEVENLABS_VOICE_ID || "pNInz6obpgDQGcFmaJgB";

  const upstream = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${vid}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_turbo_v2_5",
      voice_settings: { stability: 0.45, similarity_boost: 0.8 },
    }),
  });

  if (!upstream.ok) {
    const detail = await upstream.text();
    res.status(upstream.status).json({ error: "ElevenLabs TTS gagal", detail });
    return;
  }

  const buf = Buffer.from(await upstream.arrayBuffer());
  res.setHeader("Content-Type", "audio/mpeg");
  res.status(200).send(buf);
}
