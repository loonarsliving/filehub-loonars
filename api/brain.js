// Otak Ultron: proxy server-side ke Claude (Anthropic Messages API) dengan
// akses tool ke MK Connect lewat jembatan suara Mkhsistem
// (app/api/ai/voice-bridge di repo Mkhsistem). API key Anthropic tetap di
// server (env var), sama seperti pola api/tts.js dan api/stt.js.
//
// Alur: ambil daftar tool dari Mkhsistem (pakai token sesi milik pemanggil)
// -> tanya Claude -> kalau Claude minta panggil tool, panggil endpoint
// voice-bridge Mkhsistem lalu kirim hasilnya balik ke Claude -> ulangi
// sampai Claude memberi jawaban teks final.

const ANTHROPIC_VERSION = "2023-06-01";
const MAX_TOOL_ROUNDS = 5;

const SYSTEM_PROMPT = `Kamu adalah Ultron, asisten suara internal PT Maha Karya Haluoleo, berbicara dengan Super Admin lewat mikrofon.
Jawabanmu akan dibacakan lewat text-to-speech, jadi:
- Selalu ringkas (1-4 kalimat), bahasa Indonesia natural, tanpa markdown/bullet/simbol.
- Sebutkan angka atau nama yang relevan langsung, jangan mendaftar mentah data JSON.
- Kalau kamu punya tool untuk menjawab pertanyaan tentang MK Connect (absensi, memo, pengumuman, karyawan, cabang, notifikasi, CRM, dll), selalu pakai tool itu dulu daripada menebak.
- Kalau sebuah aksi butuh data yang tidak kamu punya (misalnya id spesifik), coba cari lewat tool pencarian/list dulu sebelum menyerah.
- Kalau memang tidak ada tool yang cocok atau terjadi error, katakan dengan singkat dan jujur, jangan mengarang data.`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "ANTHROPIC_API_KEY belum disetel di Vercel." });
    return;
  }

  const bridgeUrl = process.env.MKHSISTEM_BRIDGE_URL;
  const { message, history, mkhsistemToken } = req.body || {};

  if (!message || typeof message !== "string") {
    res.status(400).json({ error: "Field 'message' wajib diisi." });
    return;
  }

  if (!bridgeUrl || !mkhsistemToken) {
    res.status(200).json({
      text: "Aku belum tersambung ke MK Connect, jadi belum bisa membantu soal itu. Silakan login dulu.",
    });
    return;
  }

  try {
    const tools = await fetchTools(bridgeUrl, mkhsistemToken);
    const messages = [...sanitizeHistory(history), { role: "user", content: message }];
    const text = await converse(apiKey, tools, messages, bridgeUrl, mkhsistemToken);
    res.status(200).json({ text });
  } catch (err) {
    console.error("Brain handler error:", err);
    res.status(500).json({ error: err.message || "Gagal memproses permintaan." });
  }
}

function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter((turn) => turn && (turn.role === "user" || turn.role === "assistant") && typeof turn.content === "string")
    .map((turn) => ({ role: turn.role, content: turn.content }));
}

async function fetchTools(bridgeUrl, token) {
  const res = await fetch(bridgeUrl, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.error || `Gagal mengambil daftar tool MK Connect (${res.status})`);
  }
  const data = await res.json();
  return (data.tools || []).map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.parametersSchema || { type: "object", properties: {} },
  }));
}

async function callTool(bridgeUrl, token, name, input) {
  const res = await fetch(bridgeUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ tool: name, input }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { error: data.error || `Tool ${name} gagal (${res.status})` };
  }
  return data.output;
}

async function converse(apiKey, tools, messages, bridgeUrl, token) {
  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const response = await callAnthropic(apiKey, tools, messages);

    if (response.stop_reason !== "tool_use") {
      return extractText(response) || "Maaf, aku tidak punya jawaban untuk itu.";
    }

    const toolUseBlocks = response.content.filter((block) => block.type === "tool_use");
    messages.push({ role: "assistant", content: response.content });

    const toolResults = await Promise.all(
      toolUseBlocks.map(async (block) => {
        const output = await callTool(bridgeUrl, token, block.name, block.input || {});
        return {
          type: "tool_result",
          tool_use_id: block.id,
          content: JSON.stringify(output ?? null),
        };
      }),
    );
    messages.push({ role: "user", content: toolResults });
  }

  return "Maaf, permintaan ini butuh terlalu banyak langkah. Coba dipersempit.";
}

async function callAnthropic(apiKey, tools, messages) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools,
      messages,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || `Anthropic API gagal (${res.status})`);
  }
  return data;
}

function extractText(response) {
  return (response.content || [])
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join(" ")
    .trim();
}
