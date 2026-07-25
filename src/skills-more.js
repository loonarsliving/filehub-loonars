// Kemampuan tambahan FRIDAY -- semuanya dihitung di perangkat, tanpa AI.
// Berbeda dari basis fakta yang jawabannya tetap, kemampuan di sini menjawab
// pertanyaan yang tak terbatas variasinya (tanggal apa pun, angka apa pun).
//
// Setiap skill: { name, run(rawText) -> {text} | null }. Didaftarkan di
// skills.js pada array SKILLS.

import { HONORIFIC } from "./config.js";
import { numberToWords, replaceNumberWords } from "./numbers-id.js";

const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
const MONTH_INDEX = MONTHS.reduce((m, name, i) => ((m[name.toLowerCase()] = i), m), {});

function includesAny(text, phrases) {
  return phrases.some((p) => text.includes(p));
}

/** Format angka jadi kata; bulatkan 2 desimal supaya enak dibacakan. */
function say(n) {
  const r = Math.round(n * 100) / 100;
  return numberToWords(Number.isInteger(r) ? r : r);
}

/** Format rupiah dalam satuan yang wajar dibacakan (juta/miliar). */
function sayRupiah(n) {
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${say(Math.round((n / 1e9) * 100) / 100)} miliar rupiah`;
  if (abs >= 1e6) return `${say(Math.round((n / 1e6) * 100) / 100)} juta rupiah`;
  if (abs >= 1e3) return `${say(Math.round(n / 1e3))} ribu rupiah`;
  return `${say(Math.round(n))} rupiah`;
}

function formatDate(d) {
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Cari tanggal dalam teks: "17 agustus 2026" / "17 agustus" / "17/8/2026". */
function parseDate(text) {
  const t = text.toLowerCase();

  const named = t.match(/(\d{1,2})\s+([a-z]+)(?:\s+(\d{4}))?/);
  if (named && MONTH_INDEX[named[2]] !== undefined) {
    const day = parseInt(named[1], 10);
    const month = MONTH_INDEX[named[2]];
    const year = named[3] ? parseInt(named[3], 10) : new Date().getFullYear();
    const d = new Date(year, month, day);
    if (d.getDate() === day) return d;
  }

  const slash = t.match(/(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{4}))?/);
  if (slash) {
    const day = parseInt(slash[1], 10);
    const month = parseInt(slash[2], 10) - 1;
    const year = slash[3] ? parseInt(slash[3], 10) : new Date().getFullYear();
    const d = new Date(year, month, day);
    if (d.getDate() === day && month >= 0 && month <= 11) return d;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Tanggal & waktu lanjutan
// ---------------------------------------------------------------------------

const skillDateMath = {
  name: "hitung-tanggal",
  run(rawText) {
    const t = rawText.toLowerCase();
    const withDigits = replaceNumberWords(rawText).toLowerCase();

    // "tanggal berapa 30 hari lagi" / "10 hari lagi tanggal berapa"
    const ahead = withDigits.match(/(\d+)\s*(hari|minggu|bulan|tahun)\s*(?:lagi|ke depan|kedepan|dari sekarang)/);
    if (ahead && includesAny(t, ["tanggal", "hari apa", "kapan"])) {
      const n = parseInt(ahead[1], 10);
      const d = new Date();
      if (ahead[2] === "hari") d.setDate(d.getDate() + n);
      else if (ahead[2] === "minggu") d.setDate(d.getDate() + n * 7);
      else if (ahead[2] === "bulan") d.setMonth(d.getMonth() + n);
      else d.setFullYear(d.getFullYear() + n);
      return { text: `${say(n)} ${ahead[2]} lagi jatuh pada ${formatDate(d)}, ${HONORIFIC}.` };
    }

    // "berapa hari lagi ke 17 agustus" / "berapa hari menuju 25 desember"
    if (includesAny(t, ["berapa hari lagi", "berapa hari menuju", "berapa lama lagi ke", "hitung mundur ke", "berapa hari sampai"])) {
      const target = parseDate(rawText);
      if (target) {
        const today = startOfDay(new Date());
        let d = startOfDay(target);
        if (d < today) d = new Date(d.getFullYear() + 1, d.getMonth(), d.getDate()); // sudah lewat -> tahun depan
        const days = Math.round((d - today) / 86400000);
        if (days === 0) return { text: `Itu hari ini, ${HONORIFIC}.` };
        return { text: `Tinggal ${say(days)} hari lagi menuju ${formatDate(d)}, ${HONORIFIC}.` };
      }
    }

    // "hari apa tanggal 17 agustus 2026"
    if (includesAny(t, ["hari apa"])) {
      const target = parseDate(rawText);
      if (target) {
        return { text: `${target.getDate()} ${MONTHS[target.getMonth()]} ${target.getFullYear()} jatuh pada hari ${DAYS[target.getDay()]}, ${HONORIFIC}.` };
      }
    }
    return null;
  },
};

const skillAge = {
  name: "umur",
  run(rawText) {
    const t = rawText.toLowerCase();
    if (!includesAny(t, ["umur", "usia", "berapa tahun saya", "berapa tahun aku"])) return null;
    if (includesAny(t, ["umurmu", "umur kamu", "usia kamu"])) return null; // itu persona, bukan hitungan

    const born = parseDate(rawText);
    const withDigits = replaceNumberWords(rawText);
    const yearOnly = withDigits.match(/\b(19\d{2}|20\d{2})\b/);
    if (!born && !yearOnly) return null;

    const now = new Date();
    if (born) {
      let age = now.getFullYear() - born.getFullYear();
      const beforeBirthday =
        now.getMonth() < born.getMonth() ||
        (now.getMonth() === born.getMonth() && now.getDate() < born.getDate());
      if (beforeBirthday) age--;
      const next = new Date(now.getFullYear(), born.getMonth(), born.getDate());
      if (next < startOfDay(now)) next.setFullYear(next.getFullYear() + 1);
      const toGo = Math.round((startOfDay(next) - startOfDay(now)) / 86400000);
      return {
        text: `Usiamu ${say(age)} tahun, ${HONORIFIC}. Ulang tahun berikutnya ${toGo === 0 ? "hari ini" : `${say(toGo)} hari lagi`}.`,
      };
    }
    const age = now.getFullYear() - parseInt(yearOnly[1], 10);
    return { text: `Kalau lahir tahun ${yearOnly[1]}, usiamu sekitar ${say(age)} tahun, ${HONORIFIC}.` };
  },
};

// Zona waktu Indonesia + beberapa kota dunia (offset UTC tetap).
const ZONES = {
  wib: { label: "WIB", offset: 7 }, jakarta: { label: "WIB", offset: 7 },
  wita: { label: "WITA", offset: 8 }, makassar: { label: "WITA", offset: 8 }, bali: { label: "WITA", offset: 8 },
  denpasar: { label: "WITA", offset: 8 }, kendari: { label: "WITA", offset: 8 },
  wit: { label: "WIT", offset: 9 }, jayapura: { label: "WIT", offset: 9 },
  utc: { label: "UTC", offset: 0 }, gmt: { label: "GMT", offset: 0 },
  london: { label: "London", offset: 1 }, tokyo: { label: "Tokyo", offset: 9 },
  singapura: { label: "Singapura", offset: 8 }, singapore: { label: "Singapura", offset: 8 },
  dubai: { label: "Dubai", offset: 4 }, mekah: { label: "Mekah", offset: 3 }, mekkah: { label: "Mekah", offset: 3 },
  "new york": { label: "New York", offset: -4 }, sydney: { label: "Sydney", offset: 10 },
  seoul: { label: "Seoul", offset: 9 }, beijing: { label: "Beijing", offset: 8 },
};

const skillTimezone = {
  name: "zona-waktu",
  run(rawText) {
    const t = rawText.toLowerCase();
    if (!includesAny(t, ["jam berapa di", "pukul berapa di", "waktu di", "jam di"])) return null;
    const key = Object.keys(ZONES).find((z) => t.includes(z));
    if (!key) return null;
    const { label, offset } = ZONES[key];
    const now = new Date();
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    const there = new Date(utcMs + offset * 3600000);
    const h = there.getHours();
    const m = there.getMinutes();
    return {
      text: `Di ${label} sekarang pukul ${numberToWords(h)}${m ? ` lewat ${numberToWords(m)} menit` : " tepat"}, ${HONORIFIC}.`,
    };
  },
};

// ---------------------------------------------------------------------------
// Hitungan uang & bisnis
// ---------------------------------------------------------------------------

/** Ambil nominal rupiah dari teks, paham "juta"/"miliar"/"ribu". */
function parseAmount(text) {
  const w = replaceNumberWords(text).toLowerCase();
  const m = w.match(/(\d+(?:[.,]\d+)?)\s*(miliar|milyar|juta|ribu|rb|jt|m)?/);
  if (!m) return null;
  let n = parseFloat(m[1].replace(",", "."));
  const unit = m[2];
  if (unit === "miliar" || unit === "milyar") n *= 1e9;
  else if (unit === "juta" || unit === "jt") n *= 1e6;
  else if (unit === "ribu" || unit === "rb") n *= 1e3;
  return n;
}

const skillDiscount = {
  name: "diskon-pajak",
  run(rawText) {
    const t = rawText.toLowerCase();
    const w = replaceNumberWords(rawText).toLowerCase();

    // "diskon 30 persen dari 250 ribu"
    if (includesAny(t, ["diskon", "potongan harga", "korting"])) {
      const pct = w.match(/(\d+(?:[.,]\d+)?)\s*(?:%|persen)/);
      const priceText = w.replace(/(\d+(?:[.,]\d+)?)\s*(?:%|persen)/, " ");
      const price = parseAmount(priceText);
      if (pct && price) {
        const p = parseFloat(pct[1].replace(",", "."));
        const cut = (p / 100) * price;
        return {
          text: `Diskon ${say(p)} persen dari ${sayRupiah(price)} adalah ${sayRupiah(cut)}. Harga setelah diskon ${sayRupiah(price - cut)}, ${HONORIFIC}.`,
        };
      }
    }

    // "ppn 11 persen dari 5 juta" (default 11% bila tak disebut)
    if (includesAny(t, ["ppn", "pajak pertambahan", "pajak 11", "pajak sebelas"])) {
      const pct = w.match(/(\d+(?:[.,]\d+)?)\s*(?:%|persen)/);
      const priceText = w.replace(/(\d+(?:[.,]\d+)?)\s*(?:%|persen)/, " ").replace(/\bppn\b/, " ");
      const price = parseAmount(priceText);
      if (price) {
        const p = pct ? parseFloat(pct[1].replace(",", ".")) : 11;
        const tax = (p / 100) * price;
        return {
          text: `PPN ${say(p)} persen dari ${sayRupiah(price)} adalah ${sayRupiah(tax)}. Totalnya menjadi ${sayRupiah(price + tax)}, ${HONORIFIC}.`,
        };
      }
    }
    return null;
  },
};

const skillPercentChange = {
  name: "perubahan-persen",
  run(rawText) {
    const t = rawText.toLowerCase();
    if (!includesAny(t, ["naik berapa persen", "turun berapa persen", "berapa persen kenaikan", "berapa persen penurunan", "persen perubahan"])) return null;
    const w = replaceNumberWords(rawText);
    const nums = w.match(/\d+(?:[.,]\d+)?/g);
    if (!nums || nums.length < 2) return null;
    const a = parseFloat(nums[0].replace(",", "."));
    const b = parseFloat(nums[1].replace(",", "."));
    if (!a) return null;
    const change = ((b - a) / a) * 100;
    const arah = change >= 0 ? "naik" : "turun";
    return { text: `Dari ${say(a)} ke ${say(b)} berarti ${arah} ${say(Math.abs(change))} persen, ${HONORIFIC}.` };
  },
};

const skillLoan = {
  name: "cicilan",
  run(rawText) {
    const t = rawText.toLowerCase();
    if (!includesAny(t, ["cicilan", "angsuran", "kpr berapa", "kredit berapa", "hitung kpr"])) return null;

    const w = replaceNumberWords(rawText).toLowerCase();
    const principal = parseAmount(w);
    const rate = w.match(/(\d+(?:[.,]\d+)?)\s*(?:%|persen)/);
    const years = w.match(/(\d+)\s*tahun/);
    const months = w.match(/(\d+)\s*bulan/);
    if (!principal || !rate || (!years && !months)) return null;

    const annual = parseFloat(rate[1].replace(",", ".")) / 100;
    const n = years ? parseInt(years[1], 10) * 12 : parseInt(months[1], 10);
    const i = annual / 12;
    // Anuitas: A = P * i / (1 - (1+i)^-n)
    const monthly = i === 0 ? principal / n : (principal * i) / (1 - Math.pow(1 + i, -n));
    const total = monthly * n;
    return {
      text: `Pinjaman ${sayRupiah(principal)} dengan bunga ${say(annual * 100)} persen per tahun selama ${say(n)} bulan: cicilan sekitar ${sayRupiah(monthly)} per bulan, total ${sayRupiah(total)}, ${HONORIFIC}. Itu perkiraan anuitas, angka bank bisa sedikit berbeda.`,
    };
  },
};

const skillSplitBill = {
  name: "bagi-tagihan",
  run(rawText) {
    const t = rawText.toLowerCase();
    if (!includesAny(t, ["bagi tagihan", "patungan", "split bill", "bagi rata", "bagi berapa orang"])) return null;
    const w = replaceNumberWords(rawText).toLowerCase();
    const people = w.match(/(\d+)\s*orang/);
    const amount = parseAmount(w.replace(/(\d+)\s*orang/, " "));
    if (!people || !amount) return null;
    const n = parseInt(people[1], 10);
    if (!n) return null;
    return { text: `${sayRupiah(amount)} dibagi ${say(n)} orang menjadi ${sayRupiah(amount / n)} per orang, ${HONORIFIC}.` };
  },
};

// ---------------------------------------------------------------------------
// Kesehatan
// ---------------------------------------------------------------------------

const skillBMI = {
  name: "bmi",
  run(rawText) {
    const t = rawText.toLowerCase();
    if (!includesAny(t, ["bmi", "indeks massa tubuh", "berat badan ideal", "berat ideal"])) return null;
    const w = replaceNumberWords(rawText).toLowerCase();
    const kg = w.match(/(\d+(?:[.,]\d+)?)\s*(?:kg|kilo|kilogram)/);
    const cm = w.match(/(\d+(?:[.,]\d+)?)\s*(?:cm|sentimeter|centimeter)/);

    if (!kg || !cm) {
      // "berat badan ideal tinggi 170"
      if (cm) {
        const h = parseFloat(cm[1].replace(",", "."));
        const min = 18.5 * Math.pow(h / 100, 2);
        const max = 24.9 * Math.pow(h / 100, 2);
        return { text: `Untuk tinggi ${say(h)} sentimeter, berat ideal berkisar ${say(min)} sampai ${say(max)} kilogram, ${HONORIFIC}.` };
      }
      return null;
    }

    const weight = parseFloat(kg[1].replace(",", "."));
    const height = parseFloat(cm[1].replace(",", ".")) / 100;
    if (!height) return null;
    const bmi = weight / (height * height);
    let cat = "normal";
    if (bmi < 18.5) cat = "kurang berat badan";
    else if (bmi < 25) cat = "normal alias ideal";
    else if (bmi < 30) cat = "kelebihan berat badan";
    else cat = "obesitas";
    return { text: `Indeks massa tubuhmu ${say(bmi)}, termasuk kategori ${cat}, ${HONORIFIC}.` };
  },
};

// ---------------------------------------------------------------------------
// Utilitas
// ---------------------------------------------------------------------------

const ROMAN = [
  [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"],
  [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
];

const skillRoman = {
  name: "angka-romawi",
  run(rawText) {
    const t = rawText.toLowerCase();
    if (!includesAny(t, ["angka romawi", "romawi"])) return null;
    const w = replaceNumberWords(rawText);
    const num = w.match(/\d+/);
    if (num) {
      let n = parseInt(num[0], 10);
      if (n <= 0 || n > 3999) return { text: `Angka Romawi hanya untuk satu sampai tiga ribu sembilan ratus sembilan puluh sembilan, ${HONORIFIC}.` };
      let out = "";
      for (const [val, sym] of ROMAN) while (n >= val) { out += sym; n -= val; }
      return { text: `${say(parseInt(num[0], 10))} dalam angka Romawi ditulis ${out.split("").join(" ")}, ${HONORIFIC}.` };
    }
    return null;
  },
};

const NATO = {
  a: "Ambon", b: "Bandung", c: "Cirebon", d: "Demak", e: "Ende", f: "Flores",
  g: "Garut", h: "Halong", i: "Irian", j: "Jepara", k: "Kendari", l: "Lombok",
  m: "Medan", n: "Namlea", o: "Opak", p: "Pati", q: "Quibec", r: "Rembang",
  s: "Solo", t: "Timor", u: "Ubud", v: "Viktor", w: "Wonosobo", x: "Ekstra",
  y: "Yogya", z: "Zainal",
};

const skillSpell = {
  name: "eja",
  run(rawText) {
    const m = rawText.match(/\b(?:eja|ejakan|spell)\s+(.+)$/i);
    if (!m) return null;
    const word = m[1].replace(/[^a-zA-Z]/g, "");
    if (!word) return null;
    const spelled = word
      .toLowerCase()
      .split("")
      .map((c) => NATO[c] || c)
      .join(", ");
    return { text: `${word.toUpperCase()} dieja: ${spelled}, ${HONORIFIC}.` };
  },
};

const skillPassword = {
  name: "sandi",
  run(rawText) {
    const t = rawText.toLowerCase();
    if (!includesAny(t, ["buatkan password", "buat password", "generate password", "kata sandi baru", "buatkan sandi", "password acak", "sandi acak"])) return null;
    const w = replaceNumberWords(rawText);
    const lenMatch = w.match(/(\d+)\s*(?:karakter|huruf|digit)/);
    const len = Math.min(32, Math.max(8, lenMatch ? parseInt(lenMatch[1], 10) : 14));
    const chars = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%*?";
    const bytes = new Uint32Array(len);
    (globalThis.crypto || {}).getRandomValues?.(bytes);
    let out = "";
    for (let i = 0; i < len; i++) {
      const r = bytes[i] || Math.floor(Math.random() * 0xffffffff);
      out += chars[r % chars.length];
    }
    return {
      text: `Ini sandi acak sepanjang ${say(len)} karakter, ${HONORIFIC}: ${out.split("").join(" ")}. Lihat layar untuk menyalinnya.`,
    };
  },
};

// Stopwatch sederhana (mulai / lihat / berhenti).
let stopwatchStart = null;

const skillStopwatch = {
  name: "stopwatch",
  run(rawText) {
    const t = rawText.toLowerCase();
    if (!includesAny(t, ["stopwatch", "catat waktu", "mulai hitung waktu"])) return null;

    const elapsed = () => {
      const s = Math.round((Date.now() - stopwatchStart) / 1000);
      const m = Math.floor(s / 60);
      const sec = s % 60;
      return m ? `${say(m)} menit ${say(sec)} detik` : `${say(sec)} detik`;
    };

    // Buang kata "stopwatch" dulu -- kata itu sendiri memuat "stop", yang tanpa
    // ini membuat perintah "stopwatch" dikira "hentikan stopwatch".
    const cmd = t.replace(/stopwatch/g, " ");

    if (includesAny(cmd, ["mulai", "start", "jalan"])) {
      stopwatchStart = Date.now();
      return { text: `Stopwatch dimulai, ${HONORIFIC}.` };
    }
    if (includesAny(cmd, ["stop", "berhenti", "hentikan", "selesai"])) {
      if (!stopwatchStart) return { text: `Stopwatch belum berjalan, ${HONORIFIC}.` };
      const text = `Stopwatch berhenti di ${elapsed()}, ${HONORIFIC}.`;
      stopwatchStart = null;
      return { text };
    }
    if (!stopwatchStart) return { text: `Stopwatch belum berjalan, ${HONORIFIC}. Bilang mulai stopwatch untuk menjalankannya.` };
    return { text: `Stopwatch sudah berjalan ${elapsed()}, ${HONORIFIC}.` };
  },
};

export const EXTRA_SKILLS = [
  skillDateMath,
  skillAge,
  skillTimezone,
  skillDiscount,
  skillPercentChange,
  skillLoan,
  skillSplitBill,
  skillBMI,
  skillRoman,
  skillSpell,
  skillPassword,
  skillStopwatch,
];
