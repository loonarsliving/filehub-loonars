# Ultron

Antarmuka suara bergaya Ultron (Iron Man) — bicara ke browser, browser bicara balik.


## Fitur
- Speech-to-text & text-to-speech lewat **ElevenLabs** (Scribe untuk STT, model turbo multilingual untuk TTS) — akurasi Bahasa Indonesia jauh lebih baik daripada Web Speech API bawaan browser
- API key ElevenLabs hanya hidup di server (Vercel env var) lewat proxy `api/tts.js` dan `api/stt.js` — tidak pernah terkirim ke browser
- Visual HUD: core menyala, ring berputar, waveform bereaksi ke suara mic dan saat merespons
- State: siaga → mendengarkan (rekam) → memproses → merespons

## Struktur
- `src/voice.js` — abstraksi STT/TTS dengan provider `elevenlabs` (aktif) dan `webspeech` (fallback tanpa API key, tinggal ganti `ACTIVE_PROVIDER` kalau mau pakai itu lagi)
- `src/brain.js` — logika jawaban Ultron. Saat ini masih respons sederhana, gampang diganti panggilan ke LLM/backend sungguhan
- `src/main.js` — state machine UI + visualizer
- `src/audio-manager.js` — Audio Experience Engine: pemutar cue branding (`online`, `listening`, `thinking`, `success`, `notification`, `error`, `shutdown`). Reusable — tambah cue baru lewat `AudioManager.registerCue(nama, path)`, tidak perlu ubah kode lain
- `audio/` — file mp3 cue branding (lihat `audio/README.md` cara generate)
- `scripts/generate-audio-assets.mjs` — generator sekali-jalan cue branding lewat ElevenLabs Sound Effects API (fallback Freesound)
- `api/tts.js`, `api/stt.js` — Vercel Functions yang jadi proxy ke ElevenLabs

## Audio branding

`audio/*.mp3` belum ada secara default. Generate sekali di mesin dengan akses internet normal (bukan sandbox terbatas):

```bash
ELEVENLABS_API_KEY=xxx npm run generate-audio
```

Lalu commit folder `audio/` — runtime tidak akan memanggil API generator lagi, cukup memutar file statis lewat `AudioManager`. Lihat `audio/README.md` untuk detail.

## Setup ElevenLabs (wajib untuk provider aktif)

1. Di Vercel → Project Settings → Environment Variables, tambahkan:
   - `ELEVENLABS_API_KEY` — API key ElevenLabs kamu
   - `ELEVENLABS_VOICE_ID` — opsional, default pakai voice bawaan (`pNInz6obpgDQGcFmaJgB`)
2. Redeploy.

**Jangan taruh API key di file manapun di repo ini** — cukup di Vercel env var.

## Dev lokal

```bash
npm install
npx vercel dev
```

Pakai `vercel dev` (bukan `npm run dev`) supaya endpoint `/api/tts` dan `/api/stt` ikut jalan. Perlu login `vercel login` dan link project (`vercel link`) sekali di awal. Buka di Chrome/Edge dan izinkan akses mikrofon.

## Deploy ke Vercel
Connect repo ini ke Vercel — otomatis build & live.
