// Logika respons Ultron. Sapaan/identitas/pengetahuan umum dijawab lokal
// (cepat, tanpa round trip, tanpa token Gemini -- lihat knowledge.js). Semua
// yang butuh data MK Connect sungguhan dikirim ke endpoint
// /api/ai/voice-assistant milik Mkhsistem (lihat mkhsistem.js untuk sesi
// login) -- otaknya (Gemini) dan API key-nya hidup di server Mkhsistem,
// bukan di Ultron.

import { HONORIFIC, MKHSISTEM_VOICE_ASSISTANT_URL } from "./config.js";
import { findLocalAnswer } from "./knowledge.js";
import { getAccessToken } from "./mkhsistem.js";

const GREETINGS = ["halo", "hai", "hey", "hi"];
const ONLINE_KEYWORDS = ["online", "aktif", "hidup"];

const MAX_HISTORY_TURNS = 12; // pasangan user+assistant, dipangkas dari yang terlama
let conversationHistory = [];

function timeOfDayGreeting() {
  const hour = new Date().getHours();
  if (hour >= 4 && hour < 11) return "pagi";
  if (hour >= 11 && hour < 15) return "siang";
  if (hour >= 15 && hour < 18) return "sore";
  return "malam";
}

function pushHistory(role, content) {
  conversationHistory.push({ role, content });
  const maxEntries = MAX_HISTORY_TURNS * 2;
  if (conversationHistory.length > maxEntries) {
    conversationHistory = conversationHistory.slice(-maxEntries);
  }
}

export function resetConversation() {
  conversationHistory = [];
}

/**
 * Mengembalikan { text, announceOnline }. announceOnline menandai
 * main.js untuk memutar chime "online" bersamaan dengan ucapan ini.
 */
export async function getResponse(userText) {
  const text = userText.toLowerCase().trim();

  const isGreeting = GREETINGS.some((g) => text.includes(g));
  const asksOnline = ONLINE_KEYWORDS.some((k) => text.includes(k));

  if (isGreeting || asksOnline) {
    return {
      text: `Selamat ${timeOfDayGreeting()}, ${HONORIFIC}. Saya online dan siap melayani.`,
      announceOnline: true,
    };
  }
  if (text.includes("nama")) {
    return { text: "Ultron. Ingat nama itu." };
  }
  if (!text) {
    return { text: "Aku tidak menangkap apa pun. Ulangi." };
  }

  const localAnswer = findLocalAnswer(text);
  if (localAnswer) {
    return { text: localAnswer };
  }

  if (!MKHSISTEM_VOICE_ASSISTANT_URL) {
    return { text: `Aku belum disambungkan ke MK Connect, ${HONORIFIC}. Set dulu VITE_MKHSISTEM_VOICE_ASSISTANT_URL.` };
  }

  let token = null;
  try {
    token = await getAccessToken();
  } catch (err) {
    console.error("Gagal mengambil sesi MK Connect:", err);
  }
  if (!token) {
    return { text: `Aku belum login ke MK Connect, ${HONORIFIC}. Aktifkan ulang untuk login.` };
  }

  try {
    const res = await fetch(MKHSISTEM_VOICE_ASSISTANT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ message: userText, history: conversationHistory }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Voice assistant gagal (${res.status})`);

    pushHistory("user", userText);
    pushHistory("assistant", data.text);
    return { text: data.text };
  } catch (err) {
    console.error("Voice assistant error:", err);
    return { text: `Maaf, ${HONORIFIC}. Aku gagal menghubungi otak utamaku barusan.` };
  }
}
