# FRIDAY

Antarmuka suara bergaya FRIDAY (Iron Man) — bicara ke browser, browser bicara balik.


## Fitur
- Speech-to-text & text-to-speech lewat **ElevenLabs** (Scribe untuk STT, model turbo multilingual untuk TTS) — akurasi Bahasa Indonesia jauh lebih baik daripada Web Speech API bawaan browser
- API key ElevenLabs hanya hidup di server (Vercel env var) lewat proxy `api/tts.js` dan `api/stt.js` — tidak pernah terkirim ke browser
- **Kemampuan lokal tanpa AI** — jam/tanggal, kalkulator, konversi satuan, timer & pengingat, koin/dadu, angka acak, catatan, lelucon, dan obrolan ringan dijawab langsung di browser tanpa panggilan API sama sekali (lihat bagian "Kemampuan lokal" di bawah)
- Visual HUD sinematik: arc-reactor core, radar sweep, ring berputar, panel telemetri (mic, latensi, uptime — nyata), subtitle besar, dan waveform bereaksi ke suara
- State: siaga → mendengarkan (rekam) → memproses → merespons

## Kemampuan lokal (tanpa panggilan AI)

Ini yang membuat FRIDAY tidak perlu selalu memanggil otak utama. Pertanyaan yang
jawabannya bisa dihitung atau diketahui di perangkat ditangani langsung oleh
`src/skills.js` — instan, hemat, tanpa token Gemini. Contoh perintah:

| Kategori | Contoh ucapan |
| --- | --- |
| Waktu & tanggal | "jam berapa sekarang", "hari ini tanggal berapa", "hari apa sekarang" |
| Tanggal lanjutan | "tanggal berapa 30 hari lagi", "berapa hari lagi ke 25 Desember", "hari apa tanggal 17 Agustus 2026", "umur saya kalau lahir 17 Agustus 1990", "jam berapa di Tokyo" |
| Uang & bisnis | "diskon 30 persen dari 250 ribu", "PPN dari 5 juta", "cicilan 500 juta bunga 10 persen 15 tahun", "bagi tagihan 300 ribu untuk 4 orang", "naik berapa persen dari 100 ke 150" |
| Kesehatan & alat | "BMI berat 70 kg tinggi 170 cm", "berat badan ideal tinggi 170", "mulai stopwatch", "buatkan password 12 karakter", "eja Loonars", "2026 dalam angka Romawi" |
| Ulangi | "ulangi" — memutar jawaban terakhir dari cache, tanpa panggilan API |
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
pengetahuan luas, FRIDAY menyimpan lebih dari seratus fakta terkurasi di
`src/facts.js`: antariksa & astronomi, geografi dunia, Indonesia, teknologi &
komputer, sains & tubuh manusia, penemu, sejarah dunia, keuangan & investasi,
kekayaan & kebebasan finansial, pengembang properti, cara mempertahankan
kekayaan, dan cara kerja dunia perbankan — plus persona ala JARVIS. Semuanya
dijawab lokal tanpa panggilan API. Contoh: "apa itu bunga majemuk", "cara kerja
bank", "apa itu KPR", "cara mempertahankan kekayaan", "kapan Perang Dunia Kedua".
Pertanyaan yang butuh data MK Connect yang bisa berubah (absensi, memo, karyawan,
dst.) tetap diteruskan ke otak utama.

**Pengetahuan bisnis Loonars** (`src/loonars.js`) — FRIDAY paham bisnis tempatnya
bekerja: pengelolaan villa, rumah kos, homestay, dan F&B; model perusahaan
pengelola tanpa aset (asset-light) dan sumber pendapatannya; metrik hospitality
(okupansi, ADR, RevPAR, NOI, food cost, prime cost, menu engineering); serta
tata cara sampai Loonars bisa IPO sebagai perusahaan pengelola. Contoh: "apa itu
Loonars", "pengelolaan villa", "jasa manajemen kost", "apa itu Sapta Pesona",
"apa itu food cost", "cara Loonars IPO", "syarat go public". Semua dijawab lokal
tanpa panggilan API; angka bersifat rujukan industri, bukan data internal Loonars
yang berubah-ubah (yang itu tetap lewat otak utama).

## Hemat panggilan ElevenLabs

FRIDAY dirancang supaya satu kalimat cukup di-generate **sekali seumur hidup perangkat**:

- **Cache suara di IndexedDB** (`src/tts-cache.js`) — mp3 disimpan permanen dengan kuota ratusan MB (bukan lagi localStorage ~5 MB) dan **tanpa batas panjang teks**, jadi jawaban panjang (fakta, Loonars, ringkasan harian) ikut tersimpan. Budget 40 MB dengan pembuangan LRU. Cache lama otomatis dimigrasi.
- **Prewarm** — kalimat yang pasti diucapkan (boot, sapaan tiap waktu, jawaban fallback) di-generate sekali di latar belakang saat perangkat menganggur, lalu permanen.
- **"Ulangi"** — memutar jawaban terakhir dari cache, nol panggilan API.
- **Fallback suara bawaan** — kalau ElevenLabs gagal (offline/kuota habis), FRIDAY tetap menjawab memakai `speechSynthesis` perangkat, tidak bisu.
- Panel telemetri menampilkan `CACHE` = jumlah kalimat tersimpan / berapa kali dipakai ulang (tiap pemakaian ulang = satu panggilan ElevenLabs yang tidak jadi terkirim).

Terverifikasi: tiga ucapan identik berturut-turut hanya menghasilkan **satu** panggilan `/api/tts`.

## Memanggil FRIDAY saat layar mati

Halaman web **tidak bisa** mendengarkan terus-menerus saat layar mati atau terkunci — sistem operasi menghentikan mikrofon halaman yang di latar belakang, dan tidak ada API wake-word untuk web di iOS maupun Android. Yang tersedia dan sudah dipasang:

1. **Layar tidak mati sendiri saat FRIDAY aktif** — Screen Wake Lock API dipakai selama sesi hands-free, dan diambil ulang otomatis saat kembali ke tab.
2. **Bisa dipasang sebagai aplikasi (PWA)** — manifest + service worker + ikon. Tambahkan ke Layar Utama, buka layar penuh, dan tetap jalan offline untuk semua kemampuan lokalnya.
3. **Diluncurkan lewat suara** — buka `/?autostart=1` dan FRIDAY langsung menyala serta mendengarkan tanpa disentuh. Pasangkan dengan asisten bawaan ponsel:
   - **iPhone**: Pintasan (Shortcuts) → Tindakan "Buka URL" `https://<domain>/?autostart=1`, beri nama **FRIDAY**. Lalu cukup ucapkan *"Hey Siri, FRIDAY"* — bisa dari layar terkunci.
   - **Android**: pasang PWA-nya, lalu *"Ok Google, buka FRIDAY"*; atau buat Rutinitas Google Assistant yang membuka URL di atas.

Untuk wake-word sungguhan yang berjalan dengan layar mati (*"Hey FRIDAY"* tanpa menyentuh apa pun), perlu aplikasi native pembungkus (Capacitor/TWA) dengan foreground service — di luar cakupan aplikasi web ini.

## Struktur
- `src/voice.js` — abstraksi STT/TTS dengan provider `elevenlabs` (aktif) dan `webspeech` (fallback tanpa API key, tinggal ganti `ACTIVE_PROVIDER` kalau mau pakai itu lagi)
- `src/brain.js` — logika jawaban FRIDAY. Secara default **murni lokal** (sapaan, kemampuan/skills, pengetahuan, Loonars). FRIDAY hanya masuk ke MK Connect / AI bila ucapan memuat kata pembuka **"cek perusahaan"** — lihat bagian "Gerbang MK Connect" di bawah. Tanpa kata pembuka itu, pertanyaan yang tak dikenali dijawab fallback lokal, bukan diteruskan ke AI
- `src/skills.js` — mesin kemampuan lokal (jam, kalkulator, konversi, timer, koin/dadu, catatan, lelucon, obrolan). Tambah kemampuan baru cukup dengan satu objek `{ name, run }` di daftar `SKILLS`
- `src/numbers-id.js` — parser & pembentuk kata bilangan Bahasa Indonesia (dipakai kalkulator/konversi/timer)
- `src/calc.js` — evaluator ekspresi aritmetika yang aman tanpa `eval`
- `src/match.js` — pencocokan pengetahuan tiga tingkat: (1) frasa utuh, (2) semua kata hadir urutan bebas, (3) **skor kemiripan** memakai kata penting + indeks nama diri dari isi jawaban (sehingga "everest tingginya berapa" tetap ketemu). Kata umum diabaikan, ejaan brand "Loonars" dinormalkan, dan ucapan yang meminta DATA ("hari ini", "laporan", "karyawan", …) sengaja tidak dicocokkan longgar supaya diarahkan ke gerbang "cek perusahaan"
- `src/skills-more.js` — kemampuan hitung tambahan: hitung tanggal, umur, zona waktu, diskon/PPN, perubahan persen, cicilan anuitas, bagi tagihan, BMI, angka Romawi, ejaan, sandi acak, stopwatch
- `src/knowledge.js` — basis pengetahuan konsep (asisten virtual, AI/ML, identitas FRIDAY) yang dijawab tanpa panggilan API
- `src/facts.js` — basis pengetahuan umum yang ditanamkan (sains, antariksa, geografi, Indonesia, teknologi, tubuh manusia, penemu, sejarah, keuangan, kekayaan, properti, perbankan, persona) + koleksi kutipan & fakta unik. Tambah pengetahuan baru cukup satu objek `{ keywords, answer }`
- `src/loonars.js` — pengetahuan bisnis Loonars: pengelolaan villa, rumah kos, homestay, dan F&B; model perusahaan pengelola tanpa aset (asset-light); metrik hospitality (okupansi/ADR/RevPAR/NOI, food cost/prime cost); sampai jalan menuju IPO. Dijawab lokal tanpa panggilan API
- `src/mkhsistem.js` — sesi login ke MK Connect lewat Supabase Auth-nya langsung (lihat bagian "Jembatan ke MK Connect" di bawah)
- `src/main.js` — state machine UI + visualizer. FRIDAY aktif tanpa perlu login; login MK Connect baru diminta saat pengguna memakai gerbang "cek perusahaan"
- `src/audio-manager.js` — Audio Experience Engine: pemutar cue branding (`online`, `listening`, `thinking`, `success`, `notification`, `error`, `shutdown`). Reusable — tambah cue baru lewat `AudioManager.registerCue(nama, path)`, tidak perlu ubah kode lain
- `public/audio/` — file mp3 cue branding (lihat `AUDIO.md` cara generate)
- `scripts/generate-audio-assets.mjs` — generator sekali-jalan cue branding lewat ElevenLabs Sound Effects API (fallback Freesound)
- `api/tts.js`, `api/stt.js` — Vercel Functions yang jadi proxy ke ElevenLabs

## Jembatan ke MK Connect (Mkhsistem)

FRIDAY bisa menjawab dan bertindak atas data MK Connect (absensi, memo, pengumuman, karyawan, notifikasi, CRM, dll) lewat suara — **tanpa API key LLM sendiri**. Otaknya (Gemini) hidup di server MK Connect, memakai `GEMINI_API_KEY` yang memang sudah dipakai modul AI MK Connect lainnya (HR/Markom/CRM/kontenai) — FRIDAY tidak menambah biaya LLM baru, cuma jadi client suara ke sana.

### Gerbang MK Connect ("cek perusahaan")

FRIDAY **tidak** otomatis menghubungi MK Connect. Ia hanya masuk ke MK Connect / AI bila ucapan diawali/mengandung kata pembuka **"cek perusahaan"** (juga: "periksa perusahaan", "tanya perusahaan", "cek data perusahaan", "buka mk connect"). Sisa ucapan setelah kata pembuka itulah pertanyaan yang dikirim ke Gemini. Tanpa kata pembuka, FRIDAY menjawab murni lokal — hemat, cepat, dan tidak membebani otak utama. Contoh: *"cek perusahaan, berapa karyawan hadir hari ini"*.

Alurnya:

1. FRIDAY aktif langsung tanpa login. Login (email/password akun MK Connect) baru diminta saat pertama kali memakai gerbang "cek perusahaan" — login langsung ke project Supabase yang sama dengan MK Connect, sesi tersimpan di browser sehingga login cukup sekali.
2. Hanya giliran bicara yang memuat kata pembuka "cek perusahaan" yang dikirim (dari browser) ke `POST /api/ai/voice-assistant` milik MK Connect, bersama token sesi tadi dan riwayat percakapan singkat.
3. Di server MK Connect, Gemini (lewat `lib/ai/voice-bridge/gemini-agent.ts`) memutuskan tool mana yang perlu dipanggil (absensi, memo, karyawan, dst — lihat `lib/ai/voice-bridge/tools.ts`), menjalankannya langsung terhadap database (RLS-scoped), lalu menyusun satu jawaban singkat untuk dibacakan.
4. MK Connect sendiri yang menegakkan otorisasi (endpoint dibatasi khusus Super Admin lewat RLS + pengecekan role) dan CORS (hanya origin FRIDAY yang diizinkan) — lihat `app/api/ai/voice-assistant/route.ts` di repo Mkhsistem.

### Env var tambahan (Vercel → Project Settings → Environment Variables)

- `VITE_MKHSISTEM_SUPABASE_URL`, `VITE_MKHSISTEM_SUPABASE_ANON_KEY` — sama seperti `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` di project Mkhsistem. Dipakai di browser, bukan rahasia (RLS yang menjaga data).
- `VITE_MKHSISTEM_VOICE_ASSISTANT_URL` — URL endpoint percakapan suara di deployment Mkhsistem, mis. `https://mkconnect.vercel.app/api/ai/voice-assistant`.

Di sisi Mkhsistem, set `VOICE_BRIDGE_ALLOWED_ORIGIN` ke origin deployment FRIDAY ini (mis. `https://ultron.vercel.app`) supaya CORS mengizinkannya, dan pastikan `GEMINI_API_KEY` sudah disetel (biasanya sudah, karena dipakai modul AI lain).

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
