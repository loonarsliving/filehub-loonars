// Normalisasi & pencocokan basis pengetahuan yang toleran terhadap variasi
// ucapan. Hasil speech-to-text sering berbeda susunan kata, ada kata sisipan,
// tanda baca, atau ejaan brand yang meleset -- pencocokan substring frasa
// persis membuat banyak pertanyaan pengetahuan luput lalu jatuh ke otak utama
// MK Connect yang lambat. Modul ini dipakai knowledge.js, facts.js, dan
// loonars.js supaya pertanyaan pengetahuan lebih andal dijawab lokal (instan).

// Ejaan brand "Loonars" yang sering salah ditranskrip STT -> dikanonkan jadi
// "loonars" agar cocok dengan kata kunci.
const BRAND_VARIANTS = /\b(?:lunars|lonars|loonar|loners|luners|lunnars|lonnars|loonaris|lunaris)\b/g;

/** Huruf kecil, buang tanda baca/simbol, rapikan spasi, kanonkan ejaan brand. */
export function normalize(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(BRAND_VARIANTS, "loonars");
}

/**
 * Cari jawaban dari daftar entri {keywords, answer}. Sebuah entri cocok bila,
 * untuk salah satu keyword-nya:
 *   (a) keyword muncul sebagai substring di teks (perilaku lama, dipertahankan), ATAU
 *   (b) SEMUA kata dalam keyword muncul sebagai kata utuh di teks (urutan bebas).
 * Cara (b) jauh lebih toleran terhadap variasi ucapan, tapi tetap presisi:
 * menuntut seluruh kata kunci hadir. Pertanyaan data MK Connect yang tidak
 * memuat seluruh kata kunci sebuah entri tetap null -> diteruskan ke otak utama.
 * Entri pertama yang cocok yang dipakai (urutan entri = prioritas).
 */
export function findAnswer(entries, userText) {
  const norm = normalize(userText);
  if (!norm) return null;
  const words = new Set(norm.split(" "));

  for (const entry of entries) {
    for (const kw of entry.keywords) {
      const nkw = normalize(kw);
      if (!nkw) continue;
      if (norm.includes(nkw)) return entry.answer;
      const kwWords = nkw.split(" ");
      if (kwWords.every((w) => words.has(w))) return entry.answer;
    }
  }
  return null;
}
