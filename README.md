# Ultron

Antarmuka suara bergaya Ultron (Iron Man) — bicara ke browser, browser bicara balik.

## Fitur
- Speech-to-text & text-to-speech lewat Web Speech API (bawaan browser, tanpa API key)
- Visual HUD: core menyala, ring berputar, waveform bereaksi ke suara mic dan saat merespons
- State: siaga → mendengarkan → memproses → merespons

## Struktur
- `src/voice.js` — abstraksi STT/TTS. Provider aktif: `webspeech`. Ada slot `elevenlabs` yang tinggal dilengkapi kalau mau pindah ke ElevenLabs.
- `src/brain.js` — logika jawaban Ultron. Saat ini masih respons sederhana, gampang diganti panggilan ke LLM/backend sungguhan.
- `src/main.js` — state machine UI + visualizer.

## Rencana selanjutnya
Integrasi [ElevenLabs](https://elevenlabs.io) untuk suara TTS yang lebih realistis (dan opsional STT). Isi provider `elevenlabs` di `src/voice.js`, tambahkan API key lewat env var, lalu ganti `ACTIVE_PROVIDER`.

## Setup

```bash
npm install
npm run dev
```

Buka di Chrome/Edge (Web Speech API paling stabil di sana) dan izinkan akses mikrofon.

## Deploy ke Vercel
Connect repo ini ke Vercel — otomatis build & live.
