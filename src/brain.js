// Logika respons Ultron. Sapaan/identitas/pengetahuan umum dijawab lokal
// (cepat, tanpa round trip, tanpa token Gemini -- lihat knowledge.js). Semua
// yang butuh data MK Connect sungguhan dikirim ke endpoint
// /api/ai/voice-assistant milik Mkhsistem (lihat mkhsistem.js untuk sesi
// login) -- otaknya (Gemini) dan API key-nya hidup di server Mkhsistem,
// bukan di Ultron.

import { HONORIFIC, MKHSISTEM_VOICE_ASSISTANT_URL } from "./config.js";
import { findLocalAnswer } from "./knowledge.js";
import { getAccessToken, getDailyDigest } from "./mkhsistem.js";

const GREETINGS = ["halo", "hai", "hey", "hi"];
const ONLINE_KEYWORDS = ["online", "aktif", "hidup"];
const DIGEST_KEYWORDS = [
  "ringkasan hari ini",
  "ringkasan harian",
  "briefing hari ini",
  "briefing harian",
  "rekap hari ini",
  "update hari ini",
  "kondisi hari ini",
  "apa yang terjadi hari ini",
  "gimana hari ini",
];

const MAX_HISTORY_TURNS = 12; // pasangan user+assistant, dipangkas dari yang terlama
let conversationHistory = [];

// Cache ringkasan harian di memori supaya tanya berkali-kali dalam satu
// sesi tidak berulang kali baca tabel -- digest sendiri cuma di-generate
// ulang sekali sehari (17:00 WITA) di server, jadi TTL cache di sini bisa
// longgar.
const DIGEST_CACHE_TTL_MS = 30 * 60 * 1000;
let digestCache = null; // { text, fetchedAt }

// Tanggal (lokal browser) terakhir kali laporan pagi dibacakan otomatis --
// disimpan di localStorage supaya "sekali per hari" bertahan lintas
// reload/tutup-buka tab, bukan cuma per sesi JS.
const MORNING_DIGEST_STORAGE_KEY = "ultron-morning-digest-date";

function todayLocalDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

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

  const asksDigest = DIGEST_KEYWORDS.some((k) => text.includes(k));
  if (asksDigest) {
    const digestAnswer = await getDigestAnswer(token);
    if (digestAnswer) return { text: digestAnswer };
    // Tidak ada digest tersimpan (mis. cron belum pernah jalan) -- lanjut
    // ke Gemini di bawah supaya tetap ada jawaban, bukan diam saja.
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

/**
 * Ringkasan harian dari cache di memori, atau baca ulang dari MK Connect
 * kalau cache kosong/kedaluwarsa -- baca tabel biasa, BUKAN panggilan
 * Gemini, jadi tidak menghabiskan token sama sekali.
 */
async function getDigestAnswer(token) {
  const now = Date.now();
  if (digestCache && now - digestCache.fetchedAt < DIGEST_CACHE_TTL_MS) {
    return digestCache.text;
  }
  try {
    const digest = await getDailyDigest(token);
    if (!digest?.digest_text) return null;
    digestCache = { text: digest.digest_text, fetchedAt: now };
    return digest.digest_text;
  } catch (err) {
    console.error("Gagal mengambil ringkasan harian:", err);
    return null;
  }
}

/**
 * Dipanggil dari main.js tiap kali Ultron pertama diaktifkan (boot
 * sequence). Kalau belum pernah lapor hari ini (per tanggal lokal
 * browser) dan digest tersedia, kembalikan teksnya supaya main.js bisa
 * membacakannya otomatis tanpa diminta -- termasuk hasil audit media
 * sosial harian yang sudah tercakup di dalam digest. Null kalau sudah
 * pernah lapor hari ini, belum login, atau digest belum ada.
 */
export async function getMorningDigestIfDue() {
  try {
    const today = todayLocalDateString();
    if (localStorage.getItem(MORNING_DIGEST_STORAGE_KEY) === today) return null;

    const token = await getAccessToken();
    if (!token) return null;

    const digest = await getDailyDigest(token);
    if (!digest?.digest_text) return null;

    localStorage.setItem(MORNING_DIGEST_STORAGE_KEY, today);
    digestCache = { text: digest.digest_text, fetchedAt: Date.now() };
    return digest.digest_text;
  } catch (err) {
    console.error("Gagal mengambil laporan pagi otomatis:", err);
    return null;
  }
}
