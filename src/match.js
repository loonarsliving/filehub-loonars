// Normalisasi & pencocokan basis pengetahuan FRIDAY.
//
// Tiga tingkat pencocokan, dari yang paling yakin ke yang paling longgar:
//   1. Substring persis          -- keyword muncul utuh di ucapan.
//   2. Semua kata hadir          -- seluruh kata keyword ada (urutan bebas).
//   3. Skor kemiripan            -- sebagian besar kata PENTING keyword hadir.
//
// Tingkat ketiga inilah yang membuat FRIDAY terasa "tahu", bukan kaku: ucapan
// seperti "kecepatan cahaya berapa ya" atau "jupiter itu sebesar apa" tetap
// ketemu walau susunannya jauh dari kata kunci. Kata umum (apa, itu, berapa,
// sih, dong, ...) tidak dihitung supaya bukan kata itu yang bikin cocok.
//
// Penjaga presisi: bila ucapan mengandung penanda "minta data" (hari ini,
// kemarin, laporan, karyawan, tampilkan, ...), tingkat ketiga DILEWATI. Jadi
// "berapa okupansi villa kita hari ini" tidak dijawab dengan definisi okupansi,
// melainkan diarahkan ke gerbang "cek perusahaan".

const BRAND_VARIANTS = /\b(?:lunars|lonars|loonar|loners|luners|lunnars|lonnars|loonaris|lunaris)\b/g;

// Kata yang terlalu umum untuk dijadikan penentu kecocokan.
const STOPWORDS = new Set([
  "apa", "apakah", "itu", "ini", "yang", "adalah", "ialah", "berapa", "bagaimana", "gimana",
  "kenapa", "mengapa", "kapan", "siapa", "mana", "dimana", "di", "ke", "dari", "untuk", "buat",
  "dengan", "dan", "atau", "juga", "saja", "aja", "sih", "dong", "deh", "kok", "ya", "yah",
  "nih", "tuh", "kah", "lah", "pun", "tolong", "coba", "jelaskan", "sebutkan", "ceritakan",
  "kasih", "beri", "berikan", "tahu", "tau", "bisa", "boleh", "mau", "ingin", "pengen",
  "aku", "saya", "kamu", "anda", "kita", "kami", "nya", "sebenarnya", "maksudnya", "arti",
  "sebuah", "para", "pada", "dalam", "oleh", "akan", "sudah", "belum", "masih", "lagi",
  "seperti", "banget", "sekali", "paling", "lebih", "kurang", "punya", "ada", "jadi", "kalau",
]);

/** Huruf kecil, buang tanda baca/simbol, rapikan spasi, kanonkan ejaan brand. */
export function normalize(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(BRAND_VARIANTS, "loonars");
}

/** Kata-kata "berisi" (bukan stopword, minimal 3 huruf). */
function contentWords(text) {
  return normalize(text)
    .split(" ")
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w));
}

// Penanda bahwa pengguna meminta DATA nyata, bukan definisi. Bila muncul,
// pencocokan longgar dimatikan supaya tidak menjawab definisi untuk pertanyaan
// yang seharusnya lewat gerbang "cek perusahaan".
const DATA_INTENT =
  /\b(hari ini|kemarin|besok|minggu ini|bulan ini|tahun ini|barusan|terbaru|terakhir|kita|kami|perusahaan|karyawan|pegawai|absensi|absen|memo|pengumuman|notifikasi|penghuni|penyewa|tamu|omzet|penjualan|pendapatan kita|laporan|tampilkan|daftar|list|siapa saja|berapa banyak|status|jadwal|agenda|tugas|proyek|nunggak|tunggakan|pelanggan|klien|nasabah|macet|piutang|utang kita|stok|transaksi|invoice|tagihan)\b/;

// --- indeks kata khas dari isi jawaban ------------------------------------
// Nama diri sering hanya ada di JAWABAN, bukan di kata kunci ("Jupiter",
// "Everest", "Soekarno"). Indeks ini membuat ucapan seperti "everest tingginya
// berapa" tetap ketemu. Hanya kata KHAS yang dipakai -- kata yang muncul di
// banyak jawaban (harga, rumah, uang) tidak membuktikan apa-apa dan diabaikan.

const indexCache = new WeakMap();

function getIndex(entries) {
  let idx = indexCache.get(entries);
  if (idx) return idx;

  const answerWords = new Map(); // entry -> Set(kata)
  const docFreq = new Map(); // kata -> berapa entri memuatnya
  const properNouns = new Set(); // nama diri: Jupiter, Everest, Soekarno, ...

  for (const entry of entries) {
    const words = new Set(contentWords(entry.answer).filter((w) => w.length >= 4));
    for (const kw of entry.keywords) contentWords(kw).forEach((w) => words.add(w));
    answerWords.set(entry, words);
    for (const w of words) docFreq.set(w, (docFreq.get(w) || 0) + 1);

    // Kata berhuruf kapital di TENGAH kalimat = nama diri. Ini pembeda kuat
    // antara "Jupiter" (menunjuk topik) dan "sebesar" (kata pengisi biasa).
    for (const sentence of entry.answer.split(/[.!?]\s+/)) {
      const tokens = sentence.trim().split(/\s+/).slice(1); // lewati kata pertama
      for (const t of tokens) {
        const clean = t.replace(/[^A-Za-z]/g, "");
        if (clean.length >= 4 && /^[A-Z][a-z]/.test(clean)) properNouns.add(clean.toLowerCase());
      }
    }
  }

  idx = { answerWords, docFreq, properNouns, dfMax: Math.max(3, Math.ceil(entries.length * 0.06)) };
  indexCache.set(entries, idx);
  return idx;
}

/**
 * Cari jawaban dari daftar entri {keywords, answer}.
 * @returns {string|null} jawaban, atau null bila tak ada yang cukup mirip.
 */
export function findAnswer(entries, userText) {
  const norm = normalize(userText);
  if (!norm) return null;
  const words = new Set(norm.split(" "));
  // Dipakai untuk pencocokan frasa utuh: dengan spasi pengapit, kata kunci
  // pendek seperti "ev" tidak lagi ikut cocok di tengah kata ("everest").
  const padded = ` ${norm} `;

  // --- Tingkat 1 & 2: pencocokan yakin (frasa utuh / semua kata hadir) ---
  for (const entry of entries) {
    for (const kw of entry.keywords) {
      const nkw = normalize(kw);
      if (!nkw) continue;
      if (padded.includes(` ${nkw} `)) return entry.answer;
      const kwWords = nkw.split(" ");
      if (kwWords.every((w) => words.has(w))) return entry.answer;
    }
  }

  // --- Tingkat 3: skor kemiripan (dilewati bila pengguna meminta data) ---
  if (DATA_INTENT.test(norm)) return null;

  const queryContent = new Set(contentWords(userText));
  if (!queryContent.size) return null;

  const { answerWords, docFreq, properNouns, dfMax } = getIndex(entries);

  // Kata khas dalam ucapan: dikenal basis pengetahuan (df >= 1) tapi tidak
  // pasaran (df <= dfMax). Inilah yang benar-benar menunjuk sebuah topik.
  const distinctive = [...queryContent].filter((w) => {
    const df = docFreq.get(w) || 0;
    return df >= 1 && df <= dfMax;
  });

  let best = null;
  let bestScore = 0;

  for (const entry of entries) {
    let score = 0;

    // (a) kemiripan dengan kata kunci
    for (const kw of entry.keywords) {
      const kwContent = contentWords(kw);
      if (!kwContent.length) continue;
      const hit = kwContent.filter((w) => queryContent.has(w)).length;
      if (!hit) continue;
      score = Math.max(score, hit / kwContent.length + (hit >= 2 ? 0.05 : 0));
    }

    // (b) kata khas yang muncul di jawaban entri ini. Dua sudut pandang,
    // diambil yang terkuat: seberapa banyak kata khas ucapan tercakup entri
    // ini, dan seberapa langka kata yang cocok (nama diri yang cuma dimiliki
    // satu entri adalah bukti paling kuat).
    if (distinctive.length) {
      const words = answerWords.get(entry);
      const found = distinctive.filter((w) => words.has(w));
      if (found.length) {
        const coverage = 0.7 * (found.length / distinctive.length);
        // Nama diri yang cocok adalah bukti kuat topiknya, walau kata lain di
        // ucapan tidak nyambung ("everest tingginya berapa").
        const namedHit = found.some((w) => properNouns.has(w)) ? 0.7 : 0;
        score += Math.max(coverage, namedHit);
      }
    }

    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }

  return bestScore >= 0.65 ? best.answer : null;
}
