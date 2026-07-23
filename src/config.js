// Identitas pengguna & sebutan yang dipakai Ultron saat bicara.
// Ubah di sini saja -- tidak perlu ubah brain.js/main.js.
export const USER_NAME = "Avi";
export const HONORIFIC = "Sir";

// Jembatan ke MK Connect (Mkhsistem) -- lihat src/mkhsistem.js & src/brain.js.
// URL & anon key Supabase sama seperti NEXT_PUBLIC_SUPABASE_URL/ANON_KEY di
// project Mkhsistem (memang dimaksudkan publik, RLS yang menjaga data).
export const MKHSISTEM_SUPABASE_URL = import.meta.env.VITE_MKHSISTEM_SUPABASE_URL;
export const MKHSISTEM_SUPABASE_ANON_KEY = import.meta.env.VITE_MKHSISTEM_SUPABASE_ANON_KEY;

// URL endpoint percakapan suara Mkhsistem, mis.
// https://mkconnect.vercel.app/api/ai/voice-assistant -- otaknya (Gemini)
// hidup di server Mkhsistem, memakai GEMINI_API_KEY yang sudah ada di sana.
// Ultron tidak menyimpan API key LLM apa pun sendiri.
export const MKHSISTEM_VOICE_ASSISTANT_URL = import.meta.env.VITE_MKHSISTEM_VOICE_ASSISTANT_URL;
