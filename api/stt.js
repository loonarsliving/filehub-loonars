// Proxy server-side ke ElevenLabs Speech-to-Text (Scribe).
// Meneruskan body multipart apa adanya dari browser ke ElevenLabs,
// hanya menambahkan API key di sisi server.

export const config = {
  api: { bodyParser: false },
};

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

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = Buffer.concat(chunks);

  const upstream = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": req.headers["content-type"],
    },
    body,
  });

  const data = await upstream.json();
  res.status(upstream.status).json(data);
}
