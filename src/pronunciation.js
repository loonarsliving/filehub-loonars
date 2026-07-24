// Override pengucapan TTS. HANYA memengaruhi audio yang diucapkan Ultron --
// teks yang ditampilkan di layar (subtitle & log) tetap apa adanya. Berguna
// untuk nama merek/istilah yang salah dibaca ElevenLabs.
//
// Cara kerja: sebelum teks dikirim ke mesin TTS (lihat voice.js), setiap pola
// di bawah diganti dengan ejaan fonetis yang lebih enak dibaca. Karena cache
// TTS (tts-cache.js) mem-key audio berdasarkan teks yang diucapkan, mengubah
// ejaan di sini otomatis membuat audio lama yang salah tidak terpakai lagi --
// audio baru di-generate ulang dengan pengucapan yang benar.
//
// Menambah override baru cukup satu baris: { pattern: /\bKata\b/gi, say: "..." }.

const PRONUNCIATIONS = [
  // "Loonars" dibaca ElevenLabs dengan pengucapan Inggris yang keliru. Ejaan
  // fonetis Indonesia "Lunars" ("u" = bunyi "oo") membuatnya terdengar
  // "luu-nars", sesuai nama mereknya.
  { pattern: /\bLoonars\b/gi, say: "Lunars" },
];

/** Kembalikan versi teks untuk DIUCAPKAN (bukan untuk ditampilkan). */
export function toSpeech(text) {
  if (!text) return text;
  let out = text;
  for (const { pattern, say } of PRONUNCIATIONS) {
    out = out.replace(pattern, say);
  }
  return out;
}
