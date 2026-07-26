// Kata bangun — memanggil "FRIDAY" untuk mengaktifkan, tanpa menyentuh layar.
//
// ---------------------------------------------------------------------------
// KENAPA PAKAI SPEECH RECOGNITION BAWAAN BROWSER, BUKAN ELEVENLABS
// ---------------------------------------------------------------------------
// Mendeteksi kata bangun berarti MENDENGARKAN TERUS. Kalau tiap potongan audio
// dikirim ke ElevenLabs, biayanya berjalan sepanjang hari untuk mendengar
// keheningan. SpeechRecognition bawaan Chrome berjalan lokal dan gratis, dan
// untuk tugas ini akurasinya cukup: ia hanya perlu mengenali satu kata.
//
// Begitu kata bangun terdengar, giliran bicara yang sesungguhnya diserahkan ke
// pipeline ElevenLabs yang sudah ada — akurat di situ, murah di sini.
//
// ---------------------------------------------------------------------------
// TIGA HAL YANG MEMBUAT INI TIDAK MENYEBALKAN
// ---------------------------------------------------------------------------
// 1. FRIDAY tidak boleh mendengar dirinya sendiri. Saat ia bicara, namanya
//    sendiri kemungkinan besar terucap ("Namaku FRIDAY..."), dan tanpa jeda ia
//    akan membangunkan dirinya berulang-ulang. Karena itu pendengar ini
//    DIHENTIKAN selama FRIDAY berbicara atau sedang aktif.
// 2. Chrome menghentikan sesi pengenalan sendiri setiap beberapa menit. Tanpa
//    restart otomatis, kata bangun akan "mati" diam-diam setelah beberapa saat
//    dan pengguna tidak akan tahu kenapa.
// 3. Salah dengar itu wajar. "friday", "fraiday", "praidei", "fride" semuanya
//    diterima — biaya salah bangun cuma satu sapaan, sedangkan biaya tidak
//    bangun adalah fitur yang terasa rusak.

const WAKE_VARIANTS = [
  "friday",
  "fridey",
  "fraiday",
  "fraidey",
  "fride",
  "frayday",
  "praiday",
  "praidei",
  "fraidi",
  "friday.",
  "hey friday",
  "hai friday",
  "halo friday",
];

// Jeda setelah bangun sebelum mulai mendengar lagi, supaya satu ucapan panjang
// ("FRIDAY, cek holding") tidak memicu bangun dua kali.
const REARM_DELAY_MS = 1500;

let recognition = null;
let running = false;
let suspended = false;
let onWakeCallback = null;
let restartTimer = null;

function isSupported() {
  return typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

function heardWakeWord(transcript) {
  const text = transcript.toLowerCase().trim();
  if (!text) return false;
  return WAKE_VARIANTS.some((variant) => {
    // Cocokkan sebagai kata utuh supaya kata lain yang kebetulan memuat
    // potongan ini tidak ikut membangunkan.
    const pattern = new RegExp(`(^|[^a-z])${variant.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z]|$)`, "i");
    return pattern.test(text);
  });
}

function scheduleRestart(delay = 400) {
  clearTimeout(restartTimer);
  restartTimer = setTimeout(() => {
    if (running && !suspended) startRecognition();
  }, delay);
}

function startRecognition() {
  if (!isSupported() || suspended || !running) return;

  try {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SR();
    recognition.lang = "id-ID";
    recognition.continuous = true;
    // Hasil sementara dipakai supaya kata bangun terdeteksi begitu diucapkan,
    // bukan setelah pengguna berhenti bicara.
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        for (let alt = 0; alt < result.length; alt += 1) {
          if (heardWakeWord(result[alt].transcript)) {
            suspend();
            onWakeCallback?.();
            setTimeout(() => resume(), REARM_DELAY_MS);
            return;
          }
        }
      }
    };

    recognition.onerror = (event) => {
      // "not-allowed" berarti izin mikrofon ditolak -- percuma mencoba lagi,
      // dan mencoba terus hanya memunculkan prompt izin berulang.
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        running = false;
        return;
      }
      // "no-speech" / "aborted" / "network" adalah hal biasa saat menganggur.
      scheduleRestart(800);
    };

    recognition.onend = () => {
      // Chrome mengakhiri sesi sendiri secara berkala. Ini yang menjaga kata
      // bangun tetap hidup sepanjang hari.
      if (running && !suspended) scheduleRestart();
    };

    recognition.start();
  } catch {
    // start() melempar kalau sesi sebelumnya belum benar-benar berhenti.
    scheduleRestart(600);
  }
}

function stopRecognition() {
  clearTimeout(restartTimer);
  try {
    recognition?.stop?.();
  } catch {
    /* sesi sudah berhenti */
  }
  recognition = null;
}

/** Mulai mendengarkan kata bangun. Aman dipanggil berkali-kali. */
export function startWakeWord(onWake) {
  if (!isSupported()) return false;
  onWakeCallback = onWake;
  if (running) return true;
  running = true;
  suspended = false;
  startRecognition();
  return true;
}

export function stopWakeWord() {
  running = false;
  suspended = false;
  stopRecognition();
}

/** Hentikan sementara -- dipakai saat FRIDAY bicara atau sedang aktif, supaya ia tidak membangunkan dirinya sendiri. */
export function suspend() {
  if (suspended) return;
  suspended = true;
  stopRecognition();
}

export function resume() {
  if (!running || !suspended) return;
  suspended = false;
  startRecognition();
}

export function isWakeWordSupported() {
  return isSupported();
}

export function isWakeWordActive() {
  return running && !suspended;
}
