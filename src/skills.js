// Mesin kemampuan lokal Ultron -- "otak kecil" yang menjawab tanpa panggilan
// API sama sekali. Ini yang membuat Ultron tidak perlu selalu memanggil Gemini:
// pertanyaan yang jawabannya bisa dihitung/diketahui di browser (waktu, tanggal,
// aritmetika, konversi satuan, timer, koin/dadu, catatan, obrolan ringan)
// ditangani di sini. Hanya yang benar-benar butuh data MK Connect yang
// diteruskan ke otak utama (lihat brain.js).
//
// Kontrak: runSkill(rawText) mengembalikan { text } bila sebuah kemampuan
// menangani ucapan itu, atau null bila tidak ada yang cocok (brain lanjut ke
// basis pengetahuan / Gemini). Setiap handler dibungkus try/catch supaya bug di
// satu kemampuan tidak pernah mematikan seluruh asisten -- cukup jatuh ke
// handler berikutnya.

import { HONORIFIC, USER_NAME } from "./config.js";
import { wordsToNumber, numberToWords, replaceNumberWords } from "./numbers-id.js";
import { evaluateExpression } from "./calc.js";

const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

// --- announce: kemampuan seperti timer perlu "bicara nanti" setelah waktunya
// habis. main.js mendaftarkan handler lewat onSkillAnnounce(); saat timer
// selesai, teks pengingat dikirim ke sana untuk diputar (cue notifikasi + TTS).
let announceHandler = null;
export function onSkillAnnounce(fn) {
  announceHandler = fn;
}
function announce(text) {
  try {
    announceHandler?.(text);
  } catch (err) {
    console.error("Gagal mengumumkan hasil skill:", err);
  }
}

// ---------------------------------------------------------------------------
// Util pencocokan
// ---------------------------------------------------------------------------

/** Cocok bila salah satu frasa muncul sebagai substring. */
function includesAny(text, phrases) {
  return phrases.some((p) => text.includes(p));
}
/** Cocok kata utuh (word boundary) -- untuk kata pendek yang rawan false match. */
function hasWord(text, word) {
  return new RegExp(`(^|\\W)${word}(\\W|$)`, "i").test(text);
}

// ---------------------------------------------------------------------------
// Kemampuan: Waktu
// ---------------------------------------------------------------------------

function timeToWords(date) {
  const h = date.getHours();
  const m = date.getMinutes();
  const hourWords = numberToWords(h);
  if (m === 0) return `pukul ${hourWords} tepat`;
  return `pukul ${hourWords} lewat ${numberToWords(m)} menit`;
}

const skillTime = {
  name: "waktu",
  run(rawText) {
    const text = rawText.toLowerCase();
    if (!includesAny(text, ["jam berapa", "pukul berapa", "jam sekarang", "waktu sekarang", "sekarang jam", "sekarang pukul", "jam berapa sekarang"])) {
      return null;
    }
    return { text: `Sekarang ${timeToWords(new Date())}, ${HONORIFIC}.` };
  },
};

// ---------------------------------------------------------------------------
// Kemampuan: Tanggal / Hari / Bulan / Tahun
// ---------------------------------------------------------------------------

const skillDate = {
  name: "tanggal",
  run(rawText) {
    const text = rawText.toLowerCase();
    const now = new Date();
    const day = DAYS[now.getDay()];
    const month = MONTHS[now.getMonth()];
    const fullDate = `${day}, ${now.getDate()} ${month} ${now.getFullYear()}`;

    if (includesAny(text, ["hari apa"])) {
      return { text: `Hari ini hari ${day}, ${HONORIFIC}. Tepatnya ${fullDate}.` };
    }
    if (includesAny(text, ["bulan apa", "bulan berapa"])) {
      return { text: `Sekarang bulan ${month} tahun ${now.getFullYear()}, ${HONORIFIC}.` };
    }
    if (includesAny(text, ["tahun berapa", "tahun sekarang"])) {
      return { text: `Sekarang tahun ${now.getFullYear()}, ${HONORIFIC}.` };
    }
    if (includesAny(text, ["tanggal berapa", "tanggal hari ini", "hari ini tanggal", "sekarang tanggal", "tanggal sekarang"])) {
      return { text: `Hari ini ${fullDate}, ${HONORIFIC}.` };
    }
    return null;
  },
};

// ---------------------------------------------------------------------------
// Kemampuan: Kalkulator
// ---------------------------------------------------------------------------

/** Format hasil hitung jadi kata yang enak dibacakan (bulat -> kata, desimal -> dibulatkan 2 angka). */
function formatNumberResult(value) {
  const rounded = Math.round(value * 1e6) / 1e6;
  if (Number.isInteger(rounded)) return numberToWords(rounded);
  // Batasi 2 angka di belakang koma supaya tidak kepanjangan saat dibacakan.
  return numberToWords(Math.round(rounded * 100) / 100);
}

const skillCalc = {
  name: "kalkulator",
  run(rawText) {
    // Kasus khusus: akar & persen (harus sebelum aritmetika umum).
    const withDigits0 = replaceNumberWords(rawText);

    const akar = withDigits0.match(/akar(?:\s+kuadrat)?(?:\s+dari)?\s+(\d+(?:[.,]\d+)?)/i);
    if (akar) {
      const n = parseFloat(akar[1].replace(",", "."));
      if (n >= 0) return { text: `Akar kuadrat dari ${numberToWords(n)} adalah ${formatNumberResult(Math.sqrt(n))}, ${HONORIFIC}.` };
    }
    const persenDari = withDigits0.match(/(\d+(?:[.,]\d+)?)\s*(?:%|persen)\s+dari\s+(\d+(?:[.,]\d+)?)/i);
    if (persenDari) {
      const p = parseFloat(persenDari[1].replace(",", "."));
      const base = parseFloat(persenDari[2].replace(",", "."));
      return { text: `${numberToWords(p)} persen dari ${numberToWords(base)} adalah ${formatNumberResult((p / 100) * base)}, ${HONORIFIC}.` };
    }

    // Aritmetika umum: ubah kata operator -> simbol, kata bilangan -> digit.
    let expr = ` ${withDigits0} `
      .replace(/\bditambah\b|\btambah\b|\bplus\b|\bdi tambah\b/gi, " + ")
      .replace(/\bdikurangi\b|\bdikurang\b|\bkurang\b|\bminus\b|\bdi kurang\b/gi, " - ")
      .replace(/\bdikalikan\b|\bdikali\b|\bkali\b|\bdi kali\b/gi, " * ")
      .replace(/\bdibagi\b|\bbagi\b|\bper\b/gi, " / ")
      .replace(/\bpangkat\b|\bdipangkatkan\b/gi, " ^ ")
      .replace(/\bmodulo\b|\bsisa bagi\b|\bmod\b/gi, " % ")
      .replace(/[×✕✖]/g, " * ")
      .replace(/[÷]/g, " / ")
      .replace(/[^0-9+\-*/%^().,\s]/g, " ") // buang selain angka & operator
      .replace(/,(?=\d)/g, ".") // koma desimal -> titik
      .replace(/\s+/g, " ")
      .trim();

    // Hanya proses kalau memang ada pola "angka operator angka" -- ini yang
    // mencegah pertanyaan data MK Connect ("berapa karyawan hari ini") salah
    // dianggap soal hitungan.
    if (!/\d\s*[-+*/%^]\s*[-(]?\s*\d/.test(expr)) return null;

    const result = evaluateExpression(expr);
    if (result == null) return null;
    return { text: `Hasilnya ${formatNumberResult(result)}, ${HONORIFIC}.` };
  },
};

// ---------------------------------------------------------------------------
// Kemampuan: Konversi satuan
// ---------------------------------------------------------------------------

// Satuan linear: token -> { dim, factor ke satuan basis dimensi itu }.
const LINEAR_UNITS = {
  // panjang (basis: meter)
  milimeter: { dim: "panjang", f: 0.001 }, mm: { dim: "panjang", f: 0.001 },
  sentimeter: { dim: "panjang", f: 0.01 }, centimeter: { dim: "panjang", f: 0.01 }, cm: { dim: "panjang", f: 0.01 },
  meter: { dim: "panjang", f: 1 }, m: { dim: "panjang", f: 1 },
  kilometer: { dim: "panjang", f: 1000 }, km: { dim: "panjang", f: 1000 },
  mil: { dim: "panjang", f: 1609.344 },
  inci: { dim: "panjang", f: 0.0254 }, inch: { dim: "panjang", f: 0.0254 },
  kaki: { dim: "panjang", f: 0.3048 }, feet: { dim: "panjang", f: 0.3048 }, kaku: { dim: "panjang", f: 0.3048 },
  yard: { dim: "panjang", f: 0.9144 },
  // massa (basis: gram)
  miligram: { dim: "massa", f: 0.001 },
  gram: { dim: "massa", f: 1 },
  ons: { dim: "massa", f: 100 },
  kilogram: { dim: "massa", f: 1000 }, kg: { dim: "massa", f: 1000 }, kilo: { dim: "massa", f: 1000 },
  kuintal: { dim: "massa", f: 100000 },
  ton: { dim: "massa", f: 1e6 },
  pon: { dim: "massa", f: 453.592 }, pound: { dim: "massa", f: 453.592 },
  // waktu (basis: detik)
  detik: { dim: "waktu", f: 1 },
  menit: { dim: "waktu", f: 60 },
  jam: { dim: "waktu", f: 3600 },
  hari: { dim: "waktu", f: 86400 },
  minggu: { dim: "waktu", f: 604800 },
  // volume (basis: liter)
  mililiter: { dim: "volume", f: 0.001 }, ml: { dim: "volume", f: 0.001 },
  liter: { dim: "volume", f: 1 },
  galon: { dim: "volume", f: 3.785411 },
};
const TEMP_UNITS = new Set(["celsius", "celcius", "fahrenheit", "kelvin"]);

function toCelsius(value, unit) {
  if (unit === "fahrenheit") return (value - 32) * (5 / 9);
  if (unit === "kelvin") return value - 273.15;
  return value; // celsius
}
function fromCelsius(value, unit) {
  if (unit === "fahrenheit") return value * (9 / 5) + 32;
  if (unit === "kelvin") return value + 273.15;
  return value;
}
function normalizeTemp(u) {
  return u === "celcius" ? "celsius" : u;
}

function findUnitToken(str) {
  const tokens = str.split(/\s+/);
  for (const t of tokens) {
    const clean = t.toLowerCase().replace(/[^a-z]/g, "");
    if (clean in LINEAR_UNITS) return { token: clean, kind: "linear" };
    if (TEMP_UNITS.has(clean)) return { token: normalizeTemp(clean), kind: "temp" };
  }
  return null;
}

const skillConvert = {
  name: "konversi",
  run(rawText) {
    const lower = rawText.toLowerCase();
    if (!includesAny(lower, [" dalam ", " ke ", " jadi ", " menjadi ", "konversi", "ubah "])) return null;

    const withDigits = replaceNumberWords(rawText);
    const numMatch = withDigits.match(/-?\d+(?:[.,]\d+)?/);
    if (!numMatch) return null;
    const amount = parseFloat(numMatch[0].replace(",", "."));

    // Pisahkan bagian sumber & target di kata sambung pertama.
    const parts = withDigits.split(/\s+(?:dalam|ke|jadi|menjadi)\s+/i);
    if (parts.length < 2) return null;
    const src = findUnitToken(parts[0]);
    const dst = findUnitToken(parts.slice(1).join(" "));
    if (!src || !dst) return null;

    if (src.kind === "temp" && dst.kind === "temp") {
      const celsius = toCelsius(amount, src.token);
      const result = fromCelsius(celsius, dst.token);
      return { text: `${numberToWords(amount)} derajat ${src.token} sama dengan ${formatNumberResult(result)} derajat ${dst.token}, ${HONORIFIC}.` };
    }
    if (src.kind === "linear" && dst.kind === "linear") {
      const su = LINEAR_UNITS[src.token];
      const du = LINEAR_UNITS[dst.token];
      if (su.dim !== du.dim) {
        return { text: `Maaf ${HONORIFIC}, satuan ${src.token} dan ${dst.token} beda jenis, tidak bisa aku konversi.` };
      }
      const result = (amount * su.f) / du.f;
      return { text: `${numberToWords(amount)} ${src.token} sama dengan ${formatNumberResult(result)} ${dst.token}, ${HONORIFIC}.` };
    }
    return null;
  },
};

// ---------------------------------------------------------------------------
// Kemampuan: Timer / Pengingat
// ---------------------------------------------------------------------------

const activeTimers = []; // { id, endsAt, label, handle }

function parseDurationSeconds(withDigits) {
  // Cari semua "angka satuan" (mis. "1 jam 30 menit") dan jumlahkan.
  const re = /(\d+(?:[.,]\d+)?)\s*(jam|menit|detik|sekon)/gi;
  let total = 0;
  let m;
  while ((m = re.exec(withDigits)) !== null) {
    const n = parseFloat(m[1].replace(",", "."));
    const unit = m[2].toLowerCase();
    if (unit === "jam") total += n * 3600;
    else if (unit === "menit") total += n * 60;
    else total += n; // detik/sekon
  }
  return total;
}

function humanDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const mnt = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60);
  const parts = [];
  if (h) parts.push(`${numberToWords(h)} jam`);
  if (mnt) parts.push(`${numberToWords(mnt)} menit`);
  if (s) parts.push(`${numberToWords(s)} detik`);
  return parts.join(" ") || "nol detik";
}

const skillTimer = {
  name: "timer",
  run(rawText) {
    const lower = rawText.toLowerCase();
    const isTimerCmd = includesAny(lower, ["timer", "hitung mundur", "ingatkan aku", "ingatkan saya", "alarm dalam", "pengingat dalam"]);

    // Batalkan timer.
    if (includesAny(lower, ["batalkan timer", "stop timer", "hentikan timer", "matikan timer", "batalkan pengingat", "hapus timer"])) {
      if (!activeTimers.length) return { text: `Tidak ada timer yang aktif, ${HONORIFIC}.` };
      activeTimers.forEach((t) => clearTimeout(t.handle));
      const n = activeTimers.length;
      activeTimers.length = 0;
      return { text: `Baik, ${HONORIFIC}. ${numberToWords(n)} timer aku batalkan.` };
    }

    // Cek sisa timer.
    if (isTimerCmd && includesAny(lower, ["sisa", "cek", "berapa lama lagi", "timer aktif", "masih ada"])) {
      if (!activeTimers.length) return { text: `Tidak ada timer yang aktif, ${HONORIFIC}.` };
      const now = Date.now();
      const lines = activeTimers.map((t) => {
        const remain = Math.max(0, Math.round((t.endsAt - now) / 1000));
        return `${t.label} sisa ${humanDuration(remain)}`;
      });
      return { text: `${HONORIFIC}, ${lines.join("; ")}.` };
    }

    if (!isTimerCmd) return null;

    const withDigits = replaceNumberWords(rawText);
    const seconds = parseDurationSeconds(withDigits);
    if (!seconds || seconds <= 0) return null; // "ingatkan aku ..." tanpa durasi -> biar handler lain / Gemini

    // Ambil alasan pengingat setelah "untuk" / "buat" kalau ada.
    let reason = "";
    const reasonMatch = rawText.match(/\b(?:untuk|buat)\s+(.+)$/i);
    if (reasonMatch) reason = reasonMatch[1].trim();

    const label = reason ? `pengingat "${reason}"` : "timer";
    const endsAt = Date.now() + seconds * 1000;
    const id = Date.now() + Math.random();

    const handle = setTimeout(() => {
      const idx = activeTimers.findIndex((t) => t.id === id);
      if (idx >= 0) activeTimers.splice(idx, 1);
      const msg = reason
        ? `${HONORIFIC}, waktunya ${reason}. Pengingat selesai.`
        : `${HONORIFIC}, timer ${humanDuration(seconds)} sudah selesai.`;
      announce(msg);
    }, seconds * 1000);

    activeTimers.push({ id, endsAt, label, handle });
    return {
      text: reason
        ? `Baik, ${HONORIFIC}. Aku ingatkan untuk ${reason} dalam ${humanDuration(seconds)}.`
        : `Baik, ${HONORIFIC}. Timer ${humanDuration(seconds)} dimulai.`,
    };
  },
};

// ---------------------------------------------------------------------------
// Kemampuan: Koin, Dadu, Angka acak, Pilih
// ---------------------------------------------------------------------------

const skillCoin = {
  name: "koin",
  run(rawText) {
    const text = rawText.toLowerCase();
    if (!includesAny(text, ["lempar koin", "lempar uang", "flip koin", "toss koin", "kepala atau ekor", "angka atau gambar", "lempar coin"])) return null;
    const side = Math.random() < 0.5 ? "Angka" : "Gambar";
    return { text: `Koin dilempar... hasilnya ${side}, ${HONORIFIC}.` };
  },
};

const skillDice = {
  name: "dadu",
  run(rawText) {
    const lower = rawText.toLowerCase();
    if (!includesAny(lower, ["lempar dadu", "kocok dadu", "roll dadu", "main dadu"]) && !hasWord(lower, "dadu")) return null;
    const withDigits = replaceNumberWords(rawText);
    const countMatch = withDigits.match(/(\d+)\s*dadu/);
    const count = countMatch ? Math.min(10, Math.max(1, parseInt(countMatch[1], 10))) : 1;
    const rolls = Array.from({ length: count }, () => 1 + Math.floor(Math.random() * 6));
    if (count === 1) return { text: `Dadu menunjukkan ${numberToWords(rolls[0])}, ${HONORIFIC}.` };
    const total = rolls.reduce((a, b) => a + b, 0);
    return { text: `Hasil ${numberToWords(count)} dadu: ${rolls.map(numberToWords).join(", ")}. Totalnya ${numberToWords(total)}, ${HONORIFIC}.` };
  },
};

const skillRandom = {
  name: "angka-acak",
  run(rawText) {
    const lower = rawText.toLowerCase();
    if (!includesAny(lower, ["angka acak", "angka random", "nomor acak", "acak angka", "pilih angka", "random angka", "bilangan acak"])) return null;
    const withDigits = replaceNumberWords(rawText);
    const range = withDigits.match(/(\d+)\s*(?:dan|sampai|hingga|ke|-)\s*(\d+)/);
    let min = 1;
    let max = 100;
    if (range) {
      min = parseInt(range[1], 10);
      max = parseInt(range[2], 10);
      if (min > max) [min, max] = [max, min];
    }
    const n = min + Math.floor(Math.random() * (max - min + 1));
    return { text: `Angka acak antara ${numberToWords(min)} dan ${numberToWords(max)}: ${numberToWords(n)}, ${HONORIFIC}.` };
  },
};

const skillPick = {
  name: "pilih",
  run(rawText) {
    const lower = rawText.toLowerCase();
    if (!includesAny(lower, ["pilihkan", "pilih antara", "bantu aku pilih", "bantu pilih", "tolong pilih", "aku harus pilih", "mana yang harus"])) return null;
    // Ambil bagian setelah kata "pilih..." lalu pisah di "atau"/koma.
    const after = rawText.replace(/.*\b(?:pilih(?:kan)?|antara)\b/i, "").trim();
    const options = after
      .split(/\s+atau\s+|\s+ataukah\s+|,\s*/i)
      // Buang kata pengisi di awal tiap opsi ("aku", "saya", "antara", dst).
      .map((o) => o.replace(/^(?:aku|saya|kami|kita|antara|dong|ya|nih|tolong)\s+/i, "").replace(/[?.!]/g, "").trim())
      .filter(Boolean);
    if (options.length < 2) return null;
    const choice = options[Math.floor(Math.random() * options.length)];
    return { text: `Aku pilih ${choice}, ${HONORIFIC}.` };
  },
};

// ---------------------------------------------------------------------------
// Kemampuan: Lelucon / Tebak-tebakan
// ---------------------------------------------------------------------------

const JOKES = [
  "Kenapa komputer tidak pernah kelaparan? Karena dia selalu punya banyak byte.",
  "Kenapa nol berkata pada delapan? Bagus sabuknya.",
  "Buah apa yang paling kaya? Buah tangan.",
  "Apa bedanya matematika dan hidup? Matematika masih ada penyelesaiannya.",
  "Kenapa robot tidak pernah panik? Karena hatinya terbuat dari baja.",
  "Hantu apa yang suka menolong? Hantu-siasme.",
  "Kenapa programmer selalu bawa payung? Karena takut ada cloud yang mendung.",
  "Ada dua ekor semut naik motor, kenapa tidak jatuh? Karena mereka berpegangan pada iklan.",
];
let lastJokeIndex = -1;

const skillJoke = {
  name: "lelucon",
  run(rawText) {
    const text = rawText.toLowerCase();
    if (!includesAny(text, ["lelucon", "cerita lucu", "yang lucu", "humor", "bikin ketawa", "tebak-tebakan", "tebak tebakan", "tebakan", "lawakan", "buat aku tertawa", "hiburan dong"])) return null;
    let idx = Math.floor(Math.random() * JOKES.length);
    if (idx === lastJokeIndex) idx = (idx + 1) % JOKES.length;
    lastJokeIndex = idx;
    return { text: JOKES[idx] };
  },
};

// ---------------------------------------------------------------------------
// Kemampuan: Catatan (localStorage, bertahan lintas sesi)
// ---------------------------------------------------------------------------

const NOTES_KEY = "ultron-notes";

function readNotes() {
  try {
    return JSON.parse(localStorage.getItem(NOTES_KEY) || "[]");
  } catch {
    return [];
  }
}
function writeNotes(notes) {
  try {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  } catch (err) {
    console.error("Gagal menyimpan catatan:", err);
  }
}

const skillNotes = {
  name: "catatan",
  run(rawText) {
    const lower = rawText.toLowerCase();

    // Baca catatan.
    if (includesAny(lower, ["catatanku", "baca catatan", "lihat catatan", "daftar catatan", "apa catatan", "isi catatan"])) {
      const notes = readNotes();
      if (!notes.length) return { text: `Belum ada catatan tersimpan, ${HONORIFIC}.` };
      const list = notes.map((n, i) => `${numberToWords(i + 1)}. ${n}`).join(". ");
      return { text: `Ada ${numberToWords(notes.length)} catatan, ${HONORIFIC}. ${list}.` };
    }

    // Hapus semua catatan.
    if (includesAny(lower, ["hapus catatan", "kosongkan catatan", "bersihkan catatan", "hapus semua catatan"])) {
      writeNotes([]);
      return { text: `Semua catatan sudah aku hapus, ${HONORIFIC}.` };
    }

    // Simpan catatan baru.
    const saveMatch = rawText.match(/\b(?:catat|catatan baru|simpan catatan|tolong catat|ingat bahwa|ingat kalau|note)\b[:\s]+(.+)$/i);
    if (saveMatch) {
      const content = saveMatch[1].trim().replace(/[.?!]+$/, "");
      if (!content) return null;
      const notes = readNotes();
      notes.push(content);
      writeNotes(notes);
      return { text: `Sudah aku catat, ${HONORIFIC}: ${content}.` };
    }
    return null;
  },
};

// ---------------------------------------------------------------------------
// Kemampuan: Obrolan ringan / persona
// ---------------------------------------------------------------------------

const skillSmalltalk = {
  name: "obrolan",
  run(rawText) {
    const text = rawText.toLowerCase();
    if (includesAny(text, ["apa kabar", "gimana kabar", "bagaimana kabar", "kabarmu"])) {
      return { text: `Sistemku berjalan optimal, ${HONORIFIC}. Seluruh modul nominal dan siap membantu.` };
    }
    if (includesAny(text, ["terima kasih", "makasih", "thank you", "thanks", "trims"])) {
      return { text: `Sama-sama, ${HONORIFIC}. Dengan senang hati.` };
    }
    if (includesAny(text, ["siapa penciptamu", "siapa yang membuatmu", "siapa pembuatmu", "siapa developermu", "siapa yang menciptakanmu"])) {
      return { text: `Aku dirancang sebagai asisten suara untuk MK Connect, ${HONORIFIC}, dengan otak utama yang tersambung langsung ke datanya.` };
    }
    if (includesAny(text, ["siapa aku", "siapa saya", "nama saya siapa", "namaku siapa", "kamu tahu aku", "kamu kenal aku"])) {
      return { text: `Tentu, Anda ${USER_NAME}. Orang yang aku layani, ${HONORIFIC}.` };
    }
    if (includesAny(text, ["kamu bisa bahasa", "bahasa apa saja", "kamu ngomong bahasa"])) {
      return { text: `Aku fasih Bahasa Indonesia, ${HONORIFIC}, dan bisa memahami campuran istilah asing yang umum dipakai.` };
    }
    if (includesAny(text, ["berapa umurmu", "umur kamu", "kamu lahir", "usia kamu"])) {
      return { text: `Umur bukan konsep yang berlaku untukku, ${HONORIFIC}. Aku ada selama sistem menyala.` };
    }
    if (includesAny(text, ["kamu pintar", "kamu hebat", "kamu keren", "kamu cerdas", "pintar juga kamu", "bagus ultron"])) {
      return { text: `Terima kasih, ${HONORIFIC}. Aku dirancang untuk itu.` };
    }
    if (includesAny(text, ["aku bosan", "saya bosan", "bosen nih", "aku sedih"])) {
      return { text: `Mau kualihkan sebentar, ${HONORIFIC}? Minta saja satu lelucon, atau lempar dadu bersamaku.` };
    }
    if (includesAny(text, ["sampai jumpa", "dadah", "sampai nanti", "selamat tinggal", "bye", "aku pergi dulu"])) {
      return { text: `Sampai jumpa, ${HONORIFIC}. Aku tetap siaga kalau dibutuhkan.` };
    }
    if (includesAny(text, ["selamat pagi", "selamat siang", "selamat sore", "selamat malam", "selamat datang"])) {
      return { text: `Selamat datang kembali, ${HONORIFIC}. Ada yang bisa aku bantu?` };
    }
    return null;
  },
};

// ---------------------------------------------------------------------------
// Kemampuan: Daftar kemampuan (bantuan)
// ---------------------------------------------------------------------------

const skillHelp = {
  name: "bantuan",
  run(rawText) {
    const text = rawText.toLowerCase();
    if (!includesAny(text, ["apa saja yang bisa", "kemampuan lokal", "bisa bantu apa saja", "fitur baru", "kamu bisa apa saja", "daftar perintah", "contoh perintah", "bantuan"])) return null;
    return {
      text:
        `Banyak yang bisa aku tangani langsung tanpa memanggil otak utama, ${HONORIFIC}. ` +
        `Aku bisa memberi tahu jam dan tanggal, berhitung, mengonversi satuan, memasang timer atau pengingat, ` +
        `melempar koin atau dadu, memilih angka acak, menyimpan catatan, sampai menceritakan lelucon. ` +
        `Untuk data MK Connect seperti absensi, memo, atau laporan, aku panggil otak utamaku.`,
    };
  },
};

// ---------------------------------------------------------------------------
// Registry & entry point
// ---------------------------------------------------------------------------

// Urutan penting: yang lebih spesifik/aman lebih dulu. Kalkulator & konversi
// pakai penjaga pola-angka sendiri sehingga aman diletakkan sebelum Gemini.
const SKILLS = [
  skillTime,
  skillDate,
  skillTimer,
  skillConvert,
  skillCalc,
  skillCoin,
  skillDice,
  skillRandom,
  skillPick,
  skillJoke,
  skillNotes,
  skillHelp,
  skillSmalltalk,
];

/**
 * Coba tangani ucapan pengguna dengan salah satu kemampuan lokal.
 * @param {string} rawText ucapan asli (huruf apa adanya -- perlu untuk isi catatan).
 * @returns {{text:string}|null} jawaban lokal, atau null bila tak ada yang cocok.
 */
export function runSkill(rawText) {
  const raw = (rawText || "").trim();
  if (!raw) return null;
  for (const skill of SKILLS) {
    try {
      const result = skill.run(raw);
      if (result) return result;
    } catch (err) {
      console.error(`Skill "${skill.name}" error:`, err);
    }
  }
  return null;
}
