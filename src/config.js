// Identitas pengguna & sebutan yang dipakai Ultron saat bicara.
// Ubah di sini saja -- tidak perlu ubah brain.js/main.js.
export const USER_NAME = "Avi";
export const HONORIFIC = "Sir";

// Jembatan ke MK Connect (Mkhsistem) -- lihat src/mkhsistem.js & src/brain.js.
// Nilai default di bawah adalah project MK Connect produksi (mkh.haluoleo.id)
// -- sudah cukup untuk langsung jalan tanpa setting environment variable apa
// pun. URL & anon key Supabase sama seperti NEXT_PUBLIC_SUPABASE_URL/ANON_KEY
// di project Mkhsistem (memang dimaksudkan publik, RLS yang menjaga data).
// Set VITE_MKHSISTEM_SUPABASE_URL dkk di Vercel hanya kalau MK Connect
// pindah project Supabase/domain lain suatu saat nanti.
export const MKHSISTEM_SUPABASE_URL =
  import.meta.env.VITE_MKHSISTEM_SUPABASE_URL || "https://svcmybsziaelwwdrnzcv.supabase.co";
export const MKHSISTEM_SUPABASE_ANON_KEY =
  import.meta.env.VITE_MKHSISTEM_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2Y215YnN6aWFlbHd3ZHJuemN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyODExNzEsImV4cCI6MjA5Njg1NzE3MX0.Ds4cdAthZndisUoB4CRq1Ckc4F59TKE_n1QjxlfDEiA";

// URL endpoint percakapan suara Mkhsistem -- otaknya (Gemini) hidup di server
// Mkhsistem, memakai GEMINI_API_KEY yang sudah ada di sana. Ultron tidak
// menyimpan API key LLM apa pun sendiri.
export const MKHSISTEM_VOICE_ASSISTANT_URL =
  import.meta.env.VITE_MKHSISTEM_VOICE_ASSISTANT_URL || "https://mkh.haluoleo.id/api/ai/voice-assistant";

// Ringkasan harian MK Connect (dibuat sekali sehari jam 17:00 WITA oleh
// pg_cron di server, lihat supabase/migrations/0171 di repo Mkhsistem).
// Ultron membaca baris ini langsung -- tanpa panggil Gemini -- untuk
// menjawab pertanyaan "ringkasan hari ini" secara instan.
export const MKHSISTEM_DAILY_DIGEST_URL =
  import.meta.env.VITE_MKHSISTEM_DAILY_DIGEST_URL || "https://mkh.haluoleo.id/api/ai/voice-bridge/daily-digest";
