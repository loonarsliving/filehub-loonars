# Audio branding cues

File di `public/audio/` adalah identitas suara Ultron: `online.mp3`, `listening.mp3`,
`thinking.mp3`, `success.mp3`, `notification.mp3`, `error.mp3`, `shutdown.mp3`.

Harus di `public/` (bukan folder `/audio` di root) supaya Vite benar-benar
menyajikannya sebagai file statis di `/audio/*.mp3` -- di luar `public/`,
Vite tidak menyalinnya ke build output sama sekali.

Kalau file belum ada, generate sekali lewat:

```bash
ELEVENLABS_API_KEY=xxx node scripts/generate-audio-assets.mjs
```

Setelah berhasil, commit folder ini apa adanya -- aplikasi tidak akan
memanggil API generator lagi saat runtime, cukup memutar file statis ini.

Lihat `src/audio-manager.js` untuk cara aplikasi memutar cue-cue ini, dan
`scripts/generate-audio-assets.mjs` untuk prompt/fallback yang dipakai.
