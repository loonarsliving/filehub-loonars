# Ultron

Antarmuka suara bergaya Ultron (Iron Man) — bicara ke browser, browser bicara balik.


## Fitur
- Speech-to-text & text-to-speech lewat **ElevenLabs** (Scribe untuk STT, model turbo multilingual untuk TTS) — akurasi Bahasa Indonesia jauh lebih baik daripada Web Speech API bawaan browser
- API key ElevenLabs hanya hidup di server (Vercel env var) lewat proxy `api/tts.js` dan `api/stt.js` — tidak pernah terkirim ke browser
- **Kemampuan lokal tanpa AI** — jam/tanggal, kalkulator, konversi satuan, timer & pengingat, koin/dadu, angka acak, catatan, lelucon, dan obrolan ringan dijawab langsung di browser tanpa panggilan API sama sekali (lihat bagian "Kemampuan lokal" di bawah)
- Visual HUD sinematik: arc-reactor core, radar sweep, ring berputar, panel telemetri (mic, latensi, uptime — nyata), subtitle besar, dan waveform bereaksi ke suara
- State: siaga → mendengarkan (rekam) → memproses → merespons

## Kemampuan lokal (tanpa panggilan AI)

Ini yang membuat Ultron tidak perlu selalu memanggil otak utama. Pertanyaan yang
jawabannya bisa dihitung atau diketahui di perangkat ditangani langsung oleh
`src/skills.js` — instan, hemat, tanpa token Gemini. Contoh perintah:

| Kategori | Contoh ucapan |
| --- | --- |
| Waktu & tanggal | "jam berapa sekarang", "hari ini tanggal berapa", "hari apa sekarang" |
| Kalkulator | "hitung 128 kali 7", "berapa lima ratus tambah tiga puluh", "akar dari 144", "20 persen dari 150" |
| Konversi satuan | "10 kilometer ke mil", "2 jam ke menit", "100 celsius ke fahrenheit", "5 kilogram ke pon" |
| Timer & pengingat | "set timer 5 menit", "ingatkan aku dalam 10 menit untuk minum obat", "batalkan timer" |
| Acak | "lempar koin", "lempar dadu", "angka acak antara 1 dan 100", "pilihkan aku nasi atau mie" |
| Catatan | "catat beli kopi", "baca catatanku", "hapus catatan" (tersimpan di localStorage) |
| Lelucon, kutipan & fakta | "ceritakan lelucon", "beri kata motivasi", "tahukah kamu?" |
| Obrolan & persona | "apa kabar", "terima kasih", "siapa aku", "apakah kamu hidup", "status sistem" |
| **Pengetahuan umum** | "berapa kecepatan cahaya", "planet terbesar", "gunung tertinggi di dunia", "ibu kota Indonesia", "kapan Indonesia merdeka", "apa itu internet", "berapa jumlah tulang manusia" |

Kalkulator memahami kata bilangan Bahasa Indonesia (mis. "lima ratus dua puluh
tiga") lewat `src/numbers-id.js`, dan mengevaluasi ekspresi lewat evaluator aman
`src/calc.js` (tanpa `eval`).

**Pengetahuan yang ditanamkan** — seperti asisten ala JARVIS yang dibekali
pengetahuan luas, Ultron menyimpan puluhan fakta terkurasi di `src/facts.js`
(antariksa & astronomi, geografi dunia, Indonesia, teknologi & komputer, sains &
tubuh manusia, penemu, plus persona), semuanya dijawab lokal tanpa panggilan API.
Pertanyaan yang butuh data MK Connect yang bisa berubah (absensi, memo, karyawan,
dst.) tetap diteruskan ke otak utama.

## Struktur
- `src/voice.js` — abstraksi STT/TTS dengan provider `elevenlabs` (aktif) dan `webspeech` (fallback tanpa API key, tinggal ganti `ACTIVE_PROVIDER` kalau mau pakai itu lagi)
- `src/brain.js` — logika jawaban Ultron. Sapaan/identitas & basis pengetahuan dijawab lokal, kemampuan lokal (skills) dicoba berikutnya; selebihnya dikirim ke `/api/ai/voice-assistant` milik MK Connect
- `src/skills.js` — mesin kemampuan lokal (jam, kalkulator, konversi, timer, koin/dadu, catatan, lelucon, obrolan). Tambah kemampuan baru cukup dengan satu objek `{ name, run }` di daftar `SKILLS`
- `src/numbers-id.js` — parser & pembentuk kata bilangan Bahasa Indonesia (dipakai kalkulator/konversi/timer)
- `src/calc.js` — evaluator ekspresi aritmetika yang aman tanpa `eval`
- `src/knowledge.js` — basis pengetahuan konsep (asisten virtual, AI/ML, identitas Ultron) yang dijawab tanpa panggilan API
- `src/facts.js` — basis pengetahuan umum yang ditanamkan (sains, antariksa, geografi, Indonesia, teknologi, tubuh manusia, penemu, persona) + koleksi kutipan & fakta unik. Tambah pengetahuan baru cukup satu objek `{ keywords, answer }`
- `src/mkhsistem.js` — sesi login ke MK Connect lewat Supabase Auth-nya langsung (lihat bagian "Jembatan ke MK Connect" di bawah)
- `src/main.js` — state machine UI + visualizer, termasuk gerbang login MK Connect sebelum Ultron aktif
- `src/audio-manager.js` — Audio Experience Engine: pemutar cue branding (`online`, `listening`, `thinking`, `success`, `notification`, `error`, `shutdown`). Reusable — tambah cue baru lewat `AudioManager.registerCue(nama, path)`, tidak perlu ubah kode lain
- `public/audio/` — file mp3 cue branding (lihat `AUDIO.md` cara generate)
- `scripts/generate-audio-assets.mjs` — generator sekali-jalan cue branding lewat ElevenLabs Sound Effects API (fallback Freesound)
- `api/tts.js`, `api/stt.js` — Vercel Functions yang jadi proxy ke ElevenLabs

## Jembatan ke MK Connect (Mkhsistem)

Ultron bisa menjawab dan bertindak atas data MK Connect (absensi, memo, pengumuman, karyawan, notifikasi, CRM, dll) lewat suara — **tanpa API key LLM sendiri**. Otaknya (Gemini) hidup di server MK Connect, memakai `GEMINI_API_KEY` yang memang sudah dipakai modul AI MK Connect lainnya (HR/Markom/CRM/kontenai) — Ultron tidak menambah biaya LLM baru, cuma jadi client suara ke sana.

Alurnya:

1. Saat diaktifkan, Ultron meminta login (email/password akun Super Admin MK Connect) lewat `src/mkhsistem.js` — login langsung ke project Supabase yang sama dengan MK Connect, sesi tersimpan di browser sehingga login cukup sekali.
2. Setiap giliran bicara yang bukan sapaan dikirim langsung (dari browser) ke `POST /api/ai/voice-assistant` milik MK Connect, bersama token sesi tadi dan riwayat percakapan singkat.
3. Di server MK Connect, Gemini (lewat `lib/ai/voice-bridge/gemini-agent.ts`) memutuskan tool mana yang perlu dipanggil (absensi, memo, karyawan, dst — lihat `lib/ai/voice-bridge/tools.ts`), menjalankannya langsung terhadap database (RLS-scoped), lalu menyusun satu jawaban singkat untuk dibacakan.
4. MK Connect sendiri yang menegakkan otorisasi (endpoint dibatasi khusus Super Admin lewat RLS + pengecekan role) dan CORS (hanya origin Ultron yang diizinkan) — lihat `app/api/ai/voice-assistant/route.ts` di repo Mkhsistem.

### Env var tambahan (Vercel → Project Settings → Environment Variables)

- `VITE_MKHSISTEM_SUPABASE_URL`, `VITE_MKHSISTEM_SUPABASE_ANON_KEY` — sama seperti `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` di project Mkhsistem. Dipakai di browser, bukan rahasia (RLS yang menjaga data).
- `VITE_MKHSISTEM_VOICE_ASSISTANT_URL` — URL endpoint percakapan suara di deployment Mkhsistem, mis. `https://mkconnect.vercel.app/api/ai/voice-assistant`.

Di sisi Mkhsistem, set `VOICE_BRIDGE_ALLOWED_ORIGIN` ke origin deployment Ultron ini (mis. `https://ultron.vercel.app`) supaya CORS mengizinkannya, dan pastikan `GEMINI_API_KEY` sudah disetel (biasanya sudah, karena dipakai modul AI lain).

## Audio branding

7 cue di `public/audio/*.mp3` sudah tersedia. Kalau perlu regenerate/tambah cue baru, jalankan di mesin dengan akses internet normal (bukan sandbox terbatas):

```bash
ELEVENLABS_API_KEY=xxx npm run generate-audio
```

Lalu commit folder `public/audio/` — runtime tidak akan memanggil API generator lagi, cukup memutar file statis lewat `AudioManager`. Lihat `AUDIO.md` untuk detail.

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
