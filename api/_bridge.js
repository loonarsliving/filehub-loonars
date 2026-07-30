// Helper bersama untuk endpoint jembatan Villa ↔ MK Connect. Berkas berawalan
// "_" tidak pernah menjadi endpoint di Vercel, jadi ini murni modul internal.
//
// Ada DUA rahasia terpisah, satu per pasangan sistem — supaya bocornya satu
// sisi tidak membuka sisi lain:
//   - VILLA_BRIDGE_SECRET      : dipakai villa-api ↔ file hub. Nilai yang sama
//     disimpan di aplikasi Villa sebagai integration_settings.vercel_bridge.secret.
//   - MKHSISTEM_BRIDGE_SECRET  : dipakai file hub ↔ MK Connect. Nilai yang sama
//     disetel di Vercel MK Connect sebagai FILEHUB_BRIDGE_SECRET.

import { timingSafeEqual } from "node:crypto";

// Perbandingan waktu-konstan. timingSafeEqual melempar error saat panjang
// berbeda — yang justru membocorkan panjang rahasia — jadi ketidaksamaan
// panjang dibayar dengan satu perbandingan dummy berbiaya sama.
export function secretsMatch(provided, expected) {
  const a = Buffer.from(String(provided ?? "").trim(), "utf8");
  const b = Buffer.from(String(expected ?? "").trim(), "utf8");
  if (a.length !== b.length) {
    timingSafeEqual(b, b);
    return false;
  }
  return timingSafeEqual(a, b);
}

// Gerbang auth untuk sebuah endpoint jembatan. Sengaja FAIL-CLOSED: rahasia
// yang belum disetel berarti jembatan belum diresmikan operator, bukan berarti
// terbuka untuk umum — endpoint ini bisa mengirim WhatsApp atas nama bisnis.
// Mengembalikan true bila lolos; bila tidak, respons error sudah dikirim.
export function requireBridgeSecret(req, res, headerName, envName) {
  const expected = (process.env[envName] ?? "").trim();
  if (!expected) {
    res.status(503).json({ error: `${envName} belum disetel di Vercel — jembatan belum aktif.` });
    return false;
  }
  if (!secretsMatch(req.headers[headerName], expected)) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}

export const MKHSISTEM_APP_URL = (process.env.MKHSISTEM_APP_URL || "https://mkh.haluoleo.id").replace(/\/+$/, "");
export const VILLA_API_URL = (process.env.VILLA_API_URL || "https://svcmybsziaelwwdrnzcv.supabase.co/functions/v1/villa-api").replace(/\/+$/, "");

export async function fetchJson(url, init, timeoutMs = 20_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const upstream = await fetch(url, { ...init, signal: controller.signal });
    const json = await upstream.json().catch(() => null);
    return { status: upstream.status, ok: upstream.ok, json };
  } finally {
    clearTimeout(timer);
  }
}
