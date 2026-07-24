// Utilitas angka Bahasa Indonesia -- dipakai kemampuan lokal (skills.js) untuk
// mengubah kata bilangan hasil transkrip suara ("lima ratus dua puluh tiga")
// jadi angka sungguhan, dan sebaliknya mengubah angka jadi kata yang enak
// dibacakan ("1234" -> "seribu dua ratus tiga puluh empat"). Semua murni lokal,
// tanpa panggilan API apa pun.

const UNITS = {
  nol: 0, kosong: 0,
  satu: 1,
  dua: 2, tiga: 3, empat: 4, lima: 5,
  enam: 6, tujuh: 7, delapan: 8, sembilan: 9,
};

// Skala dari yang terbesar supaya parser memproses "juta" sebelum "ribu" dst.
const SCALES = [
  { word: "triliun", value: 1e12 },
  { word: "miliar", value: 1e9 },
  { word: "milyar", value: 1e9 },
  { word: "juta", value: 1e6 },
  { word: "ribu", value: 1e3 },
  { word: "ratus", value: 100 },
];

const ONES_WORDS = [
  "nol", "satu", "dua", "tiga", "empat",
  "lima", "enam", "tujuh", "delapan", "sembilan",
];
const TEENS_WORDS = [
  "sepuluh", "sebelas", "dua belas", "tiga belas", "empat belas",
  "lima belas", "enam belas", "tujuh belas", "delapan belas", "sembilan belas",
];

/**
 * Ubah kata bilangan Indonesia (0..miliaran) jadi Number. Menerima juga angka
 * digit biasa. Null kalau tidak ada bilangan yang terbaca. Menangani "sepuluh",
 * "sebelas", belasan, "se-" (seratus/seribu), puluhan, ratusan, ribuan, dst.
 */
export function wordsToNumber(input) {
  if (input == null) return null;
  let text = String(input).toLowerCase().trim();
  if (!text) return null;

  // Angka digit langsung (mis. "523", "1.500", "2,5") -- normalkan pemisah.
  const digitOnly = text.replace(/[.\s](?=\d{3}\b)/g, "").replace(",", ".");
  if (/^-?\d+(\.\d+)?$/.test(digitOnly)) return parseFloat(digitOnly);

  // "seratus"/"seribu"/"sepuluh"/"sebelas" -> "satu ratus"/"satu ribu"/... .
  // Penanganannya lalu jatuh ke logika puluh/belas/ratus/ribu di bawah.
  const tokens = text
    .replace(/\bse(puluh|belas|ratus|ribu)\b/g, "satu $1")
    .split(/[\s-]+/)
    .filter(Boolean);

  // Algoritma "pending": satu digit satuan (1-9) ditahan sampai tahu apakah ada
  // pengali (puluh/ratus/belas) yang mengikutinya. group = akumulasi < 1000,
  // total = akumulasi lintas skala ribu/juta/dst.
  let total = 0;
  let group = 0;
  let pending = null;
  let matchedAny = false;

  const flushPending = () => {
    if (pending != null) { group += pending; pending = null; }
  };

  for (const tok of tokens) {
    if (tok === "belas") {
      pending = (pending ?? 0) + 10; // "dua belas" -> 12
      flushPending();
      matchedAny = true;
      continue;
    }
    if (tok === "puluh") {
      pending = (pending ?? 1) * 10; // "dua puluh" -> 20
      flushPending();
      matchedAny = true;
      continue;
    }
    if (tok === "ratus") {
      pending = (pending ?? 1) * 100; // "dua ratus" -> 200
      flushPending();
      matchedAny = true;
      continue;
    }

    const scale = SCALES.find((s) => s.word === tok);
    if (scale && scale.value >= 1000) {
      flushPending();
      if (group === 0) group = 1;
      total += group * scale.value;
      group = 0;
      matchedAny = true;
      continue;
    }

    if (tok in UNITS) {
      flushPending();
      pending = UNITS[tok];
      matchedAny = true;
      continue;
    }

    const asNum = parseFloat(tok.replace(",", "."));
    if (!Number.isNaN(asNum)) {
      if (Number.isInteger(asNum) && asNum >= 0 && asNum <= 9) {
        flushPending();
        pending = asNum; // digit satuan -> bisa dikali puluh/ratus berikutnya
      } else {
        flushPending();
        group += asNum;
      }
      matchedAny = true;
    }
  }

  flushPending();
  if (!matchedAny) return null;
  return total + group;
}

/** Ubah Number jadi kata Indonesia yang enak dibacakan TTS. Menangani desimal & minus. */
export function numberToWords(num) {
  if (num == null || Number.isNaN(num)) return "bukan angka";
  if (num === 0) return "nol";

  let sign = "";
  if (num < 0) { sign = "minus "; num = Math.abs(num); }

  const intPart = Math.floor(num);
  const frac = num - intPart;

  let words = sign + intToWords(intPart);

  if (frac > 0) {
    // Bacakan desimal digit per digit ("koma lima", "koma dua lima").
    const decimals = String(Math.round(frac * 1e6) / 1e6).split(".")[1] || "";
    if (decimals) {
      words += " koma " + decimals.split("").map((d) => ONES_WORDS[Number(d)]).join(" ");
    }
  }
  return words;
}

function intToWords(n) {
  if (n < 10) return ONES_WORDS[n];
  if (n < 20) return TEENS_WORDS[n - 10];
  if (n < 100) {
    const tens = Math.floor(n / 10);
    const rest = n % 10;
    return `${ONES_WORDS[tens]} puluh${rest ? " " + ONES_WORDS[rest] : ""}`;
  }
  if (n < 200) return `seratus${n % 100 ? " " + intToWords(n % 100) : ""}`;
  if (n < 1000) {
    const hundreds = Math.floor(n / 100);
    const rest = n % 100;
    return `${ONES_WORDS[hundreds]} ratus${rest ? " " + intToWords(rest) : ""}`;
  }
  if (n < 2000) return `seribu${n % 1000 ? " " + intToWords(n % 1000) : ""}`;

  const scales = [
    { value: 1e12, word: "triliun" },
    { value: 1e9, word: "miliar" },
    { value: 1e6, word: "juta" },
    { value: 1e3, word: "ribu" },
  ];
  for (const s of scales) {
    if (n >= s.value) {
      const count = Math.floor(n / s.value);
      const rest = n % s.value;
      return `${intToWords(count)} ${s.word}${rest ? " " + intToWords(rest) : ""}`;
    }
  }
  return String(n);
}

/**
 * Ganti semua kata bilangan berturut-turut di dalam sebuah kalimat jadi digit,
 * mempertahankan kata-kata lain. Dipakai kalkulator supaya "lima ratus tambah
 * tiga puluh" bisa diproses jadi "500 + 30". Deretan token bilangan yang
 * bersambung digabung jadi satu angka.
 */
export function replaceNumberWords(text) {
  const NUMBER_TOKENS = new Set([
    ...Object.keys(UNITS),
    ...SCALES.map((s) => s.word),
    "puluh", "belas", "sepuluh", "sebelas",
  ]);

  const tokens = text.split(/(\s+)/); // pertahankan spasi
  const out = [];
  let run = [];

  const flush = () => {
    if (!run.length) return;
    const joined = run.join(" ");
    const val = wordsToNumber(joined);
    out.push(val != null ? String(val) : joined);
    run = [];
  };

  for (const t of tokens) {
    if (/^\s+$/.test(t)) {
      if (run.length) continue; // serap spasi di tengah deretan bilangan
      out.push(t);
      continue;
    }
    if (NUMBER_TOKENS.has(t.toLowerCase())) run.push(t);
    else { flush(); out.push(t); }
  }
  flush();
  return out.join(" ").replace(/\s+/g, " ").trim();
}
