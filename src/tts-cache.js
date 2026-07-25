// Cache audio TTS FRIDAY -- lapisan yang membuat ElevenLabs jarang dipanggil.
// Kalimat yang sama persis (branding boot, sapaan, jawaban pengetahuan lokal,
// hasil skill yang berulang) cukup di-generate SEKALI seumur hidup perangkat,
// setelah itu diputar dari penyimpanan lokal -- gratis, instan, dan tetap jalan
// walau internet mati.
//
// Tiga lapis:
//   1. Memori (Map<string, AudioBuffer>) -- tercepat, selama tab terbuka.
//   2. IndexedDB (mp3 mentah) -- persisten lintas reload/tutup-buka, kuota
//      ratusan MB (jauh lebih besar dari localStorage ~5 MB), TANPA batas
//      panjang teks, jadi jawaban panjang (fakta, Loonars, digest) ikut tersimpan.
//   3. localStorage (base64, teks pendek saja) -- hanya fallback untuk browser
//      yang IndexedDB-nya diblokir; juga sumber migrasi cache lama.
//
// Eviction: LRU berbasis total byte (BUDGET_BYTES). Yang paling lama tidak
// dipakai dibuang lebih dulu saat penuh.

const DB_NAME = "friday-tts";
const DB_VERSION = 1;
const STORE = "clips";
const BUDGET_BYTES = 40 * 1024 * 1024; // 40 MB, jauh di bawah kuota IDB biasa

// Fallback lama (localStorage). Dipertahankan untuk browser tanpa IDB dan untuk
// memigrasi cache yang sudah tersimpan dari versi sebelumnya.
const STORAGE_PREFIX = "ultron-tts-cache:";
const PERSIST_MAX_TEXT_LENGTH = 300;

const memoryCache = new Map(); // text -> AudioBuffer

const stats = { hits: 0, misses: 0, entries: 0, bytes: 0 };

/** Statistik cache untuk panel telemetri (lihat main.js). */
export function getCacheStats() {
  return { ...stats, memory: memoryCache.size };
}

// --- IndexedDB helpers -----------------------------------------------------

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    try {
      if (!("indexedDB" in globalThis)) return resolve(null);
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: "text" });
          store.createIndex("usedAt", "usedAt");
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

function tx(db, mode) {
  return db.transaction(STORE, mode).objectStore(STORE);
}

function reqToPromise(request) {
  return new Promise((resolve) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
}

async function idbGet(text) {
  const db = await openDB();
  if (!db) return null;
  try {
    return await reqToPromise(tx(db, "readonly").get(text));
  } catch {
    return null;
  }
}

async function idbPut(record) {
  const db = await openDB();
  if (!db) return;
  try {
    tx(db, "readwrite").put(record);
  } catch (err) {
    console.warn("[tts-cache] gagal menulis IndexedDB:", err?.message);
  }
}

/** Perbarui stempel pemakaian (untuk LRU) tanpa menunggu selesai. */
async function idbTouch(text) {
  const rec = await idbGet(text);
  if (rec) idbPut({ ...rec, usedAt: Date.now(), hits: (rec.hits || 0) + 1 });
}

/** Hitung ulang total byte & entri, lalu buang yang paling lama tak dipakai bila melewati budget. */
async function enforceBudget() {
  const db = await openDB();
  if (!db) return;
  try {
    const all = (await reqToPromise(tx(db, "readonly").getAll())) || [];
    let total = all.reduce((sum, r) => sum + (r.bytes || 0), 0);
    stats.entries = all.length;
    stats.bytes = total;
    if (total <= BUDGET_BYTES) return;

    all.sort((a, b) => (a.usedAt || 0) - (b.usedAt || 0)); // terlama dulu
    const store = tx(db, "readwrite");
    for (const rec of all) {
      if (total <= BUDGET_BYTES * 0.9) break;
      store.delete(rec.text);
      total -= rec.bytes || 0;
      stats.entries--;
    }
    stats.bytes = total;
  } catch (err) {
    console.warn("[tts-cache] gagal merapikan cache:", err?.message);
  }
}

// --- localStorage fallback -------------------------------------------------

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

// --- API -------------------------------------------------------------------

/**
 * AudioBuffer dari cache (memori -> IndexedDB -> localStorage lama), atau null
 * bila belum pernah di-generate. decodeAudioData butuh salinan buffer karena
 * sebagian browser mengosongkan input setelah decode.
 */
export async function getCachedAudio(audioContext, text) {
  if (memoryCache.has(text)) {
    stats.hits++;
    idbTouch(text);
    return memoryCache.get(text);
  }

  const rec = await idbGet(text);
  if (rec?.mp3) {
    try {
      const buf = await audioContext.decodeAudioData(rec.mp3.slice(0));
      memoryCache.set(text, buf);
      stats.hits++;
      idbPut({ ...rec, usedAt: Date.now(), hits: (rec.hits || 0) + 1 });
      return buf;
    } catch (err) {
      console.warn("[tts-cache] gagal decode dari IndexedDB:", err?.message);
    }
  }

  // Cache lama di localStorage -- dipakai sekali lalu dipindah ke IndexedDB.
  try {
    const stored = localStorage.getItem(STORAGE_PREFIX + text);
    if (stored) {
      const arrayBuffer = base64ToArrayBuffer(stored);
      const buf = await audioContext.decodeAudioData(arrayBuffer.slice(0));
      memoryCache.set(text, buf);
      stats.hits++;
      idbPut({ text, mp3: arrayBuffer, bytes: arrayBuffer.byteLength, usedAt: Date.now(), hits: 1 });
      localStorage.removeItem(STORAGE_PREFIX + text); // sudah pindah, bebaskan kuota
      return buf;
    }
  } catch (err) {
    console.warn("[tts-cache] gagal membaca cache lama:", err?.message);
  }

  stats.misses++;
  return null;
}

/** Simpan hasil TTS baru: mp3 mentah ke IndexedDB, AudioBuffer ke memori. */
export function setCachedAudio(text, arrayBuffer, audioBuffer) {
  if (audioBuffer) memoryCache.set(text, audioBuffer);
  if (!arrayBuffer) return;

  idbPut({
    text,
    mp3: arrayBuffer,
    bytes: arrayBuffer.byteLength,
    usedAt: Date.now(),
    hits: 1,
  });
  stats.entries++;
  stats.bytes += arrayBuffer.byteLength;
  enforceBudget();

  // Browser tanpa IndexedDB: tetap simpan teks pendek di localStorage.
  openDB().then((db) => {
    if (db || text.length > PERSIST_MAX_TEXT_LENGTH) return;
    try {
      localStorage.setItem(STORAGE_PREFIX + text, arrayBufferToBase64(arrayBuffer));
    } catch {
      /* penuh/diblokir -- cache memori tetap jalan */
    }
  });
}

/** True bila teks sudah ada di cache (tanpa perlu decode) -- dipakai prewarm. */
export async function isCached(text) {
  if (memoryCache.has(text)) return true;
  const rec = await idbGet(text);
  if (rec?.mp3) return true;
  try {
    return localStorage.getItem(STORAGE_PREFIX + text) != null;
  } catch {
    return false;
  }
}

/** Hitung entri tersimpan saat aplikasi mulai, untuk telemetri. */
export async function refreshCacheStats() {
  const db = await openDB();
  if (!db) return stats;
  try {
    const all = (await reqToPromise(tx(db, "readonly").getAll())) || [];
    stats.entries = all.length;
    stats.bytes = all.reduce((sum, r) => sum + (r.bytes || 0), 0);
  } catch {
    /* abaikan */
  }
  return stats;
}
