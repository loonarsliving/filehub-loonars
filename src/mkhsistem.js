// Sesi login ke MK Connect (Mkhsistem) lewat Supabase Auth-nya langsung --
// Ultron adalah client Supabase yang sama, bukan pemilik akun/API terpisah.
// Token akses hasil login inilah yang dikirim ke api/brain.js, yang lalu
// meneruskannya ke endpoint /api/ai/voice-bridge milik Mkhsistem. Supabase
// menyimpan sesi di localStorage sendiri, jadi login cukup sekali per browser.

import { createClient } from "@supabase/supabase-js";
import { MKHSISTEM_SUPABASE_URL, MKHSISTEM_SUPABASE_ANON_KEY } from "./config.js";

let client = null;

function getClient() {
  if (!MKHSISTEM_SUPABASE_URL || !MKHSISTEM_SUPABASE_ANON_KEY) {
    throw new Error(
      "MK Connect belum dikonfigurasi -- set VITE_MKHSISTEM_SUPABASE_URL dan VITE_MKHSISTEM_SUPABASE_ANON_KEY.",
    );
  }
  if (!client) {
    client = createClient(MKHSISTEM_SUPABASE_URL, MKHSISTEM_SUPABASE_ANON_KEY);
  }
  return client;
}

export function isConfigured() {
  return Boolean(MKHSISTEM_SUPABASE_URL && MKHSISTEM_SUPABASE_ANON_KEY);
}

export async function getSession() {
  const { data, error } = await getClient().auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function login(email, password) {
  const { data, error } = await getClient().auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session;
}

export async function logout() {
  await getClient().auth.signOut();
}

/** Token akses saat ini, me-refresh otomatis lewat SDK Supabase bila sudah kedaluwarsa. */
export async function getAccessToken() {
  const session = await getSession();
  return session?.access_token ?? null;
}
