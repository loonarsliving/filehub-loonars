// Cache audio TTS supaya kalimat yang persis sama (branding boot, sapaan,
// jawaban basis pengetahuan lokal, ringkasan harian yang ditanya ulang)
// tidak memanggil ElevenLabs berkali-kali. Dua lapis:
// - memori (Map<string, AudioBuffer>) -- berlaku sepanjang tab terbuka.
// - localStorage (base64 mp3) -- bertahan lintas reload/tutup-buka tab,
//   tapi hanya untuk teks pendek (mis. sapaan/branding) supaya tidak
//   membengkakkan storage dengan jawaban panjang yang jarang terulang
//   persis sama (ringkasan harian/jawaban Gemini).

const STORAGE_PREFIX = "ultron-tts-cache:";
const PERSIST_MAX_TEXT_LENGTH = 300;

const memoryCache = new Map(); // text -> AudioBuffer

function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

/** AudioBuffer kalau ada di cache (memori atau localStorage), null kalau tidak ada. */
export async function getCachedAudio(audioContext, text) {
  if (memoryCache.has(text)) {
    return memoryCache.get(text);
  }
  if (text.length > PERSIST_MAX_TEXT_LENGTH) return null;

  try {
    const stored = localStorage.getItem(STORAGE_PREFIX + text);
    if (!stored) return null;
    const arrayBuffer = base64ToArrayBuffer(stored);
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    memoryCache.set(text, audioBuffer);
    return audioBuffer;
  } catch (err) {
    console.error("Gagal membaca cache TTS:", err);
    return null;
  }
}

/** Simpan hasil TTS baru ke cache -- arrayBuffer mp3 mentah (buat localStorage) + audioBuffer yang sudah di-decode (buat pemakaian langsung). */
export function setCachedAudio(text, arrayBuffer, audioBuffer) {
  memoryCache.set(text, audioBuffer);
  if (text.length > PERSIST_MAX_TEXT_LENGTH) return;
  try {
    localStorage.setItem(STORAGE_PREFIX + text, arrayBufferToBase64(arrayBuffer));
  } catch (err) {
    // localStorage penuh atau dinonaktifkan -- tidak fatal, cache memori tetap jalan.
    console.error("Gagal menyimpan cache TTS ke localStorage:", err);
  }
}
