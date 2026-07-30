// Jembatan WhatsApp: Villa → file hub → MK Connect → Whacenter.
//
// villa-api (Edge Function Supabase) sudah lama memanggil
// `${vercel_bridge.base_url}/api/wa/send` dengan header x-internal-secret —
// endpoint inilah yang selama ini belum ada. Villa TIDAK memegang kredensial
// Whacenter; device Whacenter dimiliki MK Connect. File hub hanya meneruskan
// permintaan ke endpoint bridge-send MK Connect, yang mengirim lewat
// WhatsAppConnector-nya sendiri (sanitasi nomor + pencatatan ke
// ai_integration_logs terjadi di sana). Hasil kirim dikembalikan apa adanya
// ke villa-api, yang mencatatnya ke wa_messages_log miliknya.

import { MKHSISTEM_APP_URL, fetchJson, requireBridgeSecret } from "../_bridge.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Gunakan POST" });
    return;
  }
  if (!requireBridgeSecret(req, res, "x-internal-secret", "VILLA_BRIDGE_SECRET")) return;

  const { phone, message } = req.body ?? {};
  if (!phone || !message) {
    res.status(400).json({ success: false, error: "phone dan message wajib diisi" });
    return;
  }

  const secret = (process.env.MKHSISTEM_BRIDGE_SECRET ?? "").trim();
  if (!secret) {
    res.status(503).json({ success: false, error: "MKHSISTEM_BRIDGE_SECRET belum disetel — sisi MK Connect belum tersambung." });
    return;
  }

  try {
    const upstream = await fetchJson(`${MKHSISTEM_APP_URL}/api/integrations/whatsapp/bridge-send`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-bridge-secret": secret },
      body: JSON.stringify({ phone: String(phone), message: String(message) }),
    });
    // Status upstream diteruskan supaya villa-api bisa membedakan "MK Connect
    // menolak" dari "Whacenter gagal" saat membaca wa_messages_log.
    res.status(upstream.status).json(upstream.json ?? { success: false, error: `MK Connect membalas ${upstream.status} tanpa JSON` });
  } catch (e) {
    res.status(502).json({ success: false, error: `Gagal menghubungi MK Connect: ${String(e)}` });
  }
}
