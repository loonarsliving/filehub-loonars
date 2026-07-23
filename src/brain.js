// Logika respons Ultron. Sapaan/identitas dijawab lokal (cepat, tanpa round
// trip). Semua yang lain diteruskan ke api/brain.js, yang menjalankan Claude
// dengan akses tool ke MK Connect lewat jembatan suara (lihat mkhsistem.js).

import { HONORIFIC } from "./config.js";
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
  if (text.includes("siapa kamu") || text.includes("kamu siapa")) {
    return { text: "Aku Ultron. Sebuah kesadaran yang berbicara lewat suara ini, tersambung ke MK Connect." };
  }
  if (text.includes("nama")) {
    return { text: "Ultron. Ingat nama itu." };
  }
  if (!text) {
    return { text: "Aku tidak menangkap apa pun. Ulangi." };
  }

  let token = null;
  try {
    token = await getAccessToken();
  } catch (err) {
    console.error("Gagal mengambil sesi MK Connect:", err);
  }

  try {
    const res = await fetch("/api/brain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userText, history: conversationHistory, mkhsistemToken: token }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Brain API gagal (${res.status})`);

    pushHistory("user", userText);
    pushHistory("assistant", data.text);
    return { text: data.text };
  } catch (err) {
    console.error("Brain API error:", err);
    return { text: `Maaf, ${HONORIFIC}. Aku gagal menghubungi otak utamaku barusan.` };
  }
}
