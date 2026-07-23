// Endpoint ADMIN SEMENTARA -- generate 7 cue audio branding lewat ElevenLabs
// Sound Effects API (network Vercel tidak dibatasi seperti sandbox dev),
// mengembalikan semuanya sebagai base64 JSON supaya bisa langsung disimpan
// tanpa perlu terminal di sisi user. Dilindungi token statis di kode ini
// (bukan env var) karena cuma dipakai sekali lalu file ini dihapus lagi.

const ADMIN_TOKEN = "oe8Q7sF6wr03ziPaU0hCOa6bnY27BefAnlNYvUJUIlU";

const CUES = [
  {
    name: "online",
    prompt:
      "Futuristic AI system startup, premium digital chime, clean holographic activation, cinematic",
    durationSeconds: 1,
  },
  {
    name: "listening",
    prompt: "Soft futuristic listening beep, elegant sci-fi interface",
    durationSeconds: 0.5,
  },
  {
    name: "thinking",
    prompt: "Subtle neural processing sound, futuristic AI computing ambience",
    durationSeconds: 0.8,
  },
  {
    name: "success",
    prompt: "Elegant confirmation chime, premium technology notification",
    durationSeconds: 0.5,
  },
  {
    name: "notification",
    prompt: "Modern holographic notification, soft digital ping, premium interface",
    durationSeconds: 1,
  },
  {
    name: "error",
    prompt: "Minimal futuristic warning tone, clean technology alert",
    durationSeconds: 1,
  },
  {
    name: "shutdown",
    prompt: "Smooth AI shutdown sequence, futuristic digital fade",
    durationSeconds: 1.5,
  },
];

async function generateOne(apiKey, cue) {
  const duration = Math.min(22, Math.max(0.5, cue.durationSeconds));
  const res = await fetch("https://api.elevenlabs.io/v1/sound-generation", {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text: cue.prompt,
      duration_seconds: duration,
      prompt_influence: 0.3,
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`ElevenLabs gagal (${res.status}): ${detail}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  return buf.toString("base64");
}

export default async function handler(req, res) {
  if (req.query.token !== ADMIN_TOKEN) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "ELEVENLABS_API_KEY belum disetel di Vercel." });
    return;
  }

  const results = await Promise.allSettled(CUES.map((cue) => generateOne(apiKey, cue)));

  const files = {};
  const errors = {};
  results.forEach((r, i) => {
    const name = CUES[i].name;
    if (r.status === "fulfilled") files[name] = r.value;
    else errors[name] = r.reason?.message || String(r.reason);
  });

  res.status(200).json({ files, errors });
}
