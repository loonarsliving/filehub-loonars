// Service worker FRIDAY. Dua tugas:
//   1. Membuat FRIDAY bisa dipasang sebagai aplikasi (PWA) -- ikon di layar
//      utama, buka layar penuh tanpa address bar, dan bisa dipanggil lewat
//      Pintasan Siri / Google Assistant.
//   2. Menyimpan kerangka aplikasi + cue audio supaya FRIDAY tetap hidup saat
//      internet mati. Seluruh kemampuan & pengetahuan lokalnya tetap jalan.
//
// Catatan: audio TTS TIDAK di-cache di sini -- itu ditangani IndexedDB milik
// aplikasi (src/tts-cache.js), yang kuotanya lebih besar dan punya LRU sendiri.

const CACHE = "friday-shell-v1";

// Aset yang selalu dibutuhkan. Berkas hasil build (JS/CSS ber-hash) tidak
// didaftarkan di sini -- ditangkap saat runtime oleh handler fetch di bawah.
const SHELL = [
  "/",
  "/manifest.webmanifest",
  "/audio/online.mp3",
  "/audio/listening.mp3",
  "/audio/thinking.mp3",
  "/audio/success.mp3",
  "/audio/notification.mp3",
  "/audio/error.mp3",
  "/audio/shutdown.mp3",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      // addAll gagal total bila satu file meleset -- pakai per-file supaya
      // pemasangan tetap berhasil meski ada aset yang belum tersedia.
      .then((cache) => Promise.all(SHELL.map((url) => cache.add(url).catch(() => {}))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // biarkan ElevenLabs/Supabase apa adanya
  if (url.pathname.startsWith("/api/")) return; // API selalu langsung ke jaringan

  // Navigasi: jaringan dulu (supaya versi baru cepat terpakai), jatuh ke cache
  // bila offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put("/", copy));
          return res;
        })
        .catch(() => caches.match("/").then((r) => r || Response.error())),
    );
    return;
  }

  // Aset statis: cache dulu (cepat & hemat kuota), isi cache saat pertama kali.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((res) => {
          if (res.ok && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(() => cached || Response.error());
    }),
  );
});
