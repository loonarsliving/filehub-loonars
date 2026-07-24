// Logika respons FRIDAY. Secara default FRIDAY menjawab MURNI dari kemampuan &
// pengetahuan lokal (cepat, tanpa panggilan AI). Ia hanya menghubungi MK Connect
// (otak AI/Gemini di server Mkhsistem) bila ucapan memuat kata pembuka
// "cek perusahaan" -- itulah "pintu" ke MK Connect. Tanpa kata pembuka itu,
// pertanyaan yang tak dikenali dijawab dengan fallback lokal, bukan diteruskan
// ke AI.

import { ASSISTANT_NAME, HONORIFIC, MKHSISTEM_VOICE_ASSISTANT_URL } from "./config.js";
import { findLocalAnswer } from "./knowledge.js";
import { findFact } from "./facts.js";
import { findLoonars } from "./loonars.js";
import { runSkill } from "./skills.js";
import { getAccessToken, getDailyDigest } from "./mkhsistem.js";

// Kata pembuka gerbang MK Connect. Hanya bila salah satunya muncul, FRIDAY
// masuk ke MK Connect / AI. Sisa ucapan setelah kata pembuka dipakai sebagai
// pertanyaan sesungguhnya.
const COMPANY_GATE = [
  "cek perusahaan",
  "check perusahaan",
  "cek data perusahaan",
  "periksa perusahaan",
  "buka mk connect",
  "cek mk connect",
  "tanya perusahaan",
];

// Sapaan dicocokkan sebagai kata utuh (bukan substring) supaya "hi" tidak
// ikut kepicu oleh kata seperti "hitung"/"putih", dan "hai" tidak oleh "hari".
// Sapaan waktu ("selamat pagi", dst.) ditangani skillSmalltalk supaya tidak
// salah kepicu oleh "ada memo malam ini" dan sejenisnya.
const GREETINGS = ["halo", "hai", "hei", "hey", "hi", "hello", "helo", "assalamualaikum"];
// "hidup" sengaja TIDAK di sini -- "apakah kamu hidup" ditangani jawaban persona
// di facts.js yang lebih berkarakter, bukan sekadar konfirmasi status online.
const ONLINE_KEYWORDS = ["online", "aktif", "siap"];

function hasWord(text, word) {
  return new RegExp(`(^|\\W)${word}(\\W|$)`, "i").test(text);
}
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

  if (!text) {
    return { text: "Aku tidak menangkap apa pun. Ulangi." };
  }

  // GERBANG MK CONNECT: hanya bila ucapan memuat kata pembuka "cek perusahaan"
  // (dsb.) FRIDAY masuk ke MK Connect / AI. Pertanyaan sesungguhnya adalah sisa
  // ucapan setelah kata pembuka dibuang.
  const gate = matchCompanyGate(userText);
  if (gate) {
    return await askMkConnect(gate.query);
  }

  // ---- MULAI DI SINI: MURNI LOKAL, TIDAK PERNAH MEMANGGIL AI ----

  const isGreeting = GREETINGS.some((g) => hasWord(text, g));
  const asksOnline = ONLINE_KEYWORDS.some((k) => hasWord(text, k));

  if (isGreeting || asksOnline) {
    return {
      text: `Selamat ${timeOfDayGreeting()}, ${HONORIFIC}. Saya online dan siap melayani.`,
      announceOnline: true,
    };
  }
  if (hasWord(text, "nama") && !hasWord(text, "namaku") && !hasWord(text, "nama saya") && !text.includes("nama aku")) {
    return { text: `Namaku ${ASSISTANT_NAME}, ${HONORIFIC}. Siap membantu.` };
  }

  const localAnswer = findLocalAnswer(text);
  if (localAnswer) {
    return { text: localAnswer };
  }

  // Kemampuan lokal (jam, tanggal, hitung, konversi, timer, koin/dadu, catatan,
  // lelucon, kutipan, fakta unik, obrolan) -- dijawab langsung tanpa panggilan API.
  const skillAnswer = runSkill(userText);
  if (skillAnswer) {
    return skillAnswer;
  }

  // Basis pengetahuan umum yang "ditanamkan" (sains, antariksa, geografi,
  // Indonesia, teknologi, tubuh manusia, penemu, persona) -- juga lokal.
  const fact = findFact(text);
  if (fact) {
    return { text: fact };
  }

  // Pengetahuan bisnis Loonars (pengelolaan villa/kos/homestay/F&B, model
  // asset-light, jalan menuju IPO) -- juga lokal.
  const loonars = findLoonars(text);
  if (loonars) {
    return { text: loonars };
  }

  // Fallback lokal -- TIDAK memanggil AI. Arahkan ke gerbang perusahaan bila
  // pertanyaannya memang soal data MK Connect.
  return {
    text: `Maaf, ${HONORIFIC}, itu di luar pengetahuan lokalku. Kalau ini soal data perusahaan, awali dengan "cek perusahaan".`,
  };
}

/**
 * Cari kata pembuka gerbang perusahaan pada ucapan. Mengembalikan { query }
 * berisi sisa ucahan setelah kata pembuka dibuang (bisa string kosong bila
 * pengguna hanya bilang "cek perusahaan"), atau null bila tak ada kata pembuka.
 */
function matchCompanyGate(userText) {
  const lower = userText.toLowerCase();
  for (const phrase of COMPANY_GATE) {
    const idx = lower.indexOf(phrase);
    if (idx !== -1) {
      const query = (userText.slice(0, idx) + " " + userText.slice(idx + phrase.length))
        .replace(/\s+/g, " ")
        .replace(/^[\s,.:;\-]+|[\s,.:;\-]+$/g, "")
        .trim();
      return { query };
    }
  }
  return null;
}

/** True bila ucapan memicu gerbang MK Connect (dipakai main.js untuk memicu login). */
export function isCompanyGate(userText) {
  return matchCompanyGate(userText) !== null;
}

/**
 * Jalur MK Connect / AI. Hanya dipanggil setelah gerbang "cek perusahaan"
 * terpicu. `query` adalah pertanyaan sesungguhnya (tanpa kata pembuka).
 */
async function askMkConnect(query) {
  if (!query) {
    return { text: `Pintu MK Connect terbuka, ${HONORIFIC}. Apa yang ingin kamu cek?` };
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

  const asksDigest = DIGEST_KEYWORDS.some((k) => query.toLowerCase().includes(k));
  if (asksDigest) {
    const digestAnswer = await getDigestAnswer(token);
    if (digestAnswer) return { text: digestAnswer };
    // Tidak ada digest tersimpan -- lanjut ke Gemini supaya tetap ada jawaban.
  }

  try {
    const res = await fetch(MKHSISTEM_VOICE_ASSISTANT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ message: query, history: conversationHistory }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Voice assistant gagal (${res.status})`);

    pushHistory("user", query);
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
