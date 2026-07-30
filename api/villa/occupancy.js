// Jembatan okupansi: MK Connect → file hub → villa-api.
//
// Halaman "Okupansi Kos" MK Connect menampilkan rangkuman okupansi harian
// Villa. Sesuai filosofi api/holding.js, MK Connect tidak diberi kredensial
// aplikasi Villa — ia hanya memanggil file hub dengan rahasia pasangannya
// sendiri, dan file hub-lah yang berbicara ke villa-api memakai rahasia
// pasangan Villa. Angka diteruskan apa adanya; tidak ada data operasional
// Villa yang mengendap di sini.

import { VILLA_API_URL, fetchJson, requireBridgeSecret } from "../_bridge.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Gunakan GET" });
    return;
  }
  if (!requireBridgeSecret(req, res, "x-bridge-secret", "MKHSISTEM_BRIDGE_SECRET")) return;

  const secret = (process.env.VILLA_BRIDGE_SECRET ?? "").trim();
  if (!secret) {
    res.status(503).json({ error: "VILLA_BRIDGE_SECRET belum disetel — sisi Villa belum tersambung." });
    return;
  }

  try {
    const upstream = await fetchJson(`${VILLA_API_URL}/bridge/occupancy`, {
      method: "GET",
      headers: { "x-internal-secret": secret },
    });
    if (!upstream.ok || !upstream.json) {
      res.status(502).json({ error: `villa-api membalas ${upstream.status}: ${upstream.json?.error ?? "tanpa JSON"}` });
      return;
    }
    res.status(200).json(upstream.json);
  } catch (e) {
    res.status(502).json({ error: `Gagal menghubungi villa-api: ${String(e)}` });
  }
}
