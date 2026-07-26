// FRIDAY sebagai JEMBATAN — lapisan Connector ke seluruh lini bisnis.
//
// Inilah inti visi FRIDAY: ia bukan ERP, bukan CRM, bukan PMS, bukan sistem
// keuangan. Ia adalah lapisan kecerdasan eksekutif DI ATAS seluruh sistem
// operasional, dan satu-satunya cara ia membaca sebuah bisnis adalah lewat
// Connector.
//
// Setiap bisnis berdiri sendiri: punya dashboard sendiri, database sendiri,
// automation sendiri, user sendiri, dan BERHAK memilih sistem operasionalnya
// sendiri. MK Connect dipakai holding/developer, Kos punya dashboard-nya
// sendiri, Villa boleh pakai PMS, Homestay boleh pakai apa pun. FRIDAY tidak
// pernah memaksa satu sistem untuk semua.
//
// Karena itu file ini hanya menyimpan CARA MENJANGKAU sebuah bisnis — tidak
// pernah isinya. Tidak ada data booking, tidak ada buku besar, tidak ada
// catatan pelanggan yang mengendap di sini. Begitu FRIDAY menyimpan catatan
// operasional sebuah unit, unit itu tidak bisa lagi pergi, dan kemandirian di
// atas berubah jadi slogan.
//
// ---------------------------------------------------------------------------
// KENAPA INI SERVERLESS, BUKAN DI BROWSER
// ---------------------------------------------------------------------------
// Token tiap dashboard bisnis hidup sebagai environment variable di Vercel dan
// tidak pernah menyeberang ke browser — pola yang sama dengan api/tts.js dan
// api/stt.js. Browser hanya menerima hasil yang sudah dinormalisasi.
//
// ---------------------------------------------------------------------------
// CONNECTOR HANYA PUNYA EMPAT KATA KERJA
// ---------------------------------------------------------------------------
// Ambil data, kirim data, jalankan automation, ambil status. Tidak ada logika
// bisnis. Begitu sebuah connector mulai memutuskan ARTI sebuah angka, sumber
// kebenaran diam-diam pindah ke FRIDAY — dan itu persis yang dilarang.
//
// Hari ini hanya "ambil data" dan "ambil status" yang dipakai; FRIDAY lewat
// suara sengaja READ-ONLY. Menjalankan automation lintas bisnis lewat perintah
// suara, tanpa layar konfirmasi, bukan sesuatu yang boleh dibangun diam-diam.

const MKHSISTEM_SUPABASE_URL = process.env.MKHSISTEM_SUPABASE_URL || "https://svcmybsziaelwwdrnzcv.supabase.co";
const MKHSISTEM_ANON_KEY =
  process.env.MKHSISTEM_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2Y215YnN6aWFlbHd3ZHJuemN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyODExNzEsImV4cCI6MjA5Njg1NzE3MX0.Ds4cdAthZndisUoB4CRq1Ckc4F59TKE_n1QjxlfDEiA";

const DEFAULT_TIMEOUT_MS = 12_000;

/**
 * REGISTRY LINI BISNIS.
 *
 * Menambah bisnis ke-10 atau ke-100 adalah menambah SATU ENTRI di sini plus
 * satu environment variable — bukan menulis connector baru, dan bukan mengubah
 * cara FRIDAY berpikir.
 *
 * `urlEnv` adalah NAMA environment variable, bukan URL-nya, dan `tokenEnv`
 * adalah NAMA env var token — bukan tokennya. Tidak ada kredensial yang
 * tertulis di file ini.
 *
 * Bisnis yang env var-nya belum diisi berstatus "belum_terhubung". Itu status
 * yang BERBEDA dari "tidak dapat dihubungi": yang pertama berarti kita memang
 * belum memasang jembatannya, yang kedua berarti jembatannya ada tapi putus.
 * Keduanya menuntut tindakan yang berbeda, jadi tidak boleh disamakan.
 */
const BUSINESS_REGISTRY = [
  {
    key: "mkconnect",
    name: "MK Connect — Holding & Developer",
    type: "holding",
    sourceSystem: "MK Connect (MKH System)",
    connector: "mkconnect",
  },
  { key: "kos", name: "Kos", type: "kos", sourceSystem: "Dashboard Kos", connector: "http", urlEnv: "HOLDING_KOS_URL", tokenEnv: "HOLDING_KOS_TOKEN" },
  { key: "villa", name: "Villa", type: "villa", sourceSystem: "PMS Villa", connector: "http", urlEnv: "HOLDING_VILLA_URL", tokenEnv: "HOLDING_VILLA_TOKEN" },
  {
    key: "homestay",
    name: "Homestay",
    type: "homestay",
    sourceSystem: "Dashboard Homestay",
    connector: "http",
    urlEnv: "HOLDING_HOMESTAY_URL",
    tokenEnv: "HOLDING_HOMESTAY_TOKEN",
  },
  { key: "hotel", name: "Hotel", type: "hotel", sourceSystem: "Hotel Management System", connector: "http", urlEnv: "HOLDING_HOTEL_URL", tokenEnv: "HOLDING_HOTEL_TOKEN" },
  {
    key: "coffee_shop",
    name: "Coffee Shop",
    type: "coffee_shop",
    sourceSystem: "POS Coffee Shop",
    connector: "http",
    urlEnv: "HOLDING_COFFEE_URL",
    tokenEnv: "HOLDING_COFFEE_TOKEN",
  },
];

function blockedHost(hostname) {
  const host = hostname.toLowerCase();
  return (
    ["localhost", "127.0.0.1", "0.0.0.0", "::1", "metadata.google.internal", "169.254.169.254"].includes(host) ||
    host.endsWith(".internal") ||
    host.startsWith("10.") ||
    host.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host)
  );
}

// URL bisnis datang dari environment variable yang disetel operator, lalu
// di-fetch oleh server ini. Tanpa pemeriksaan ini, salah setel satu env var
// bisa menjadikan FRIDAY perantara permintaan ke jaringan internal.
function safeUrl(raw) {
  const url = new URL(raw);
  if (url.protocol !== "https:") throw new Error("URL bisnis harus https");
  if (blockedHost(url.hostname)) throw new Error(`Host tidak diizinkan: ${url.hostname}`);
  return url;
}

function unreadable(business, health, note) {
  return {
    key: business.key,
    name: business.name,
    type: business.type,
    sourceSystem: business.sourceSystem,
    health,
    metrics: [],
    narrative: null,
    note,
  };
}

const VALID_UNITS = ["idr", "count", "percent", "days", "ratio"];

/**
 * Dashboard bisnis lain adalah kode tim lain. Diperlakukan sebagai input tidak
 * tepercaya: satuan tak dikenal dibuang (bukan ditebak), nilai non-numerik jadi
 * null (bukan NaN), metrik tanpa key dibuang. Satu metrik rusak hanya
 * menghilangkan satu baris, tidak pernah seluruh snapshot bisnis itu.
 */
function parseMetrics(raw) {
  if (!Array.isArray(raw)) return [];
  const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);

  return raw.flatMap((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return [];
    const key = typeof entry.key === "string" ? entry.key.trim() : "";
    const unit = typeof entry.unit === "string" ? entry.unit.trim() : "";
    if (!key || !VALID_UNITS.includes(unit)) return [];
    return [
      {
        key,
        label: typeof entry.label === "string" && entry.label.trim() ? entry.label.trim() : key,
        value: num(entry.value),
        unit,
        previousValue: num(entry.previousValue),
        period: typeof entry.period === "string" ? entry.period : null,
        freshnessDays: num(entry.freshnessDays),
        direction: ["higher_better", "lower_better", "neutral"].includes(entry.direction) ? entry.direction : null,
      },
    ];
  });
}

/** Connector generik untuk dashboard bisnis mana pun yang bisa menyajikan JSON. */
async function fetchHttpBusiness(business) {
  const baseUrl = business.urlEnv ? process.env[business.urlEnv] : null;
  if (!baseUrl) {
    return unreadable(
      business,
      "belum_terhubung",
      `Belum ada jembatan ke ${business.name}. Set ${business.urlEnv} di Vercel setelah dashboard-nya menyediakan endpoint snapshot.`,
    );
  }

  let url;
  try {
    url = safeUrl(`${baseUrl.replace(/\/+$/, "")}/api/friday/snapshot`);
  } catch (err) {
    return unreadable(business, "unreachable", `Konfigurasi ${business.urlEnv} tidak valid: ${err.message}`);
  }

  const headers = { Accept: "application/json" };
  const token = business.tokenEnv ? process.env[business.tokenEnv] : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS) });
    if (!res.ok) return unreadable(business, "unreachable", `Dashboard ${business.name} menjawab HTTP ${res.status}`);

    const payload = await res.json();
    const metrics = parseMetrics(payload.metrics);
    const narrative = typeof payload.narrative === "string" ? payload.narrative : null;
    if (metrics.length === 0 && !narrative) {
      return unreadable(business, "degraded", `${business.name} menjawab tapi tidak mengirim metrik maupun narasi yang bisa dibaca.`);
    }

    return {
      key: business.key,
      name: business.name,
      type: business.type,
      sourceSystem: business.sourceSystem,
      health: metrics.length === 0 ? "degraded" : "ok",
      metrics,
      narrative,
      note: metrics.length === 0 ? "Hanya narasi, tanpa metrik terbanding." : null,
    };
  } catch (err) {
    // Tidak pernah melempar dan tidak pernah nol: satu bisnis yang tak
    // terjangkau tidak boleh membatalkan pembacaan seluruh grup, dan tidak
    // boleh dibaca sebagai bisnis yang tidak beroperasi.
    return unreadable(business, "unreachable", `Dashboard ${business.name} tidak dapat dihubungi: ${err.message}`);
  }
}

/**
 * Connector MK Connect.
 *
 * Membaca briefing eksekutif yang SUDAH dihitung server MK Connect lewat
 * Supabase REST memakai token pengguna yang sedang login — RLS di sana
 * (friday.view) yang menentukan boleh atau tidaknya, bukan file ini. Tidak ada
 * panggilan Gemini di sini dan tidak ada kunci AI di repo ini.
 */
async function fetchMkConnect(business, token) {
  if (!token) {
    return unreadable(business, "belum_terhubung", "Belum login ke MK Connect, jadi data holding belum bisa dibaca.");
  }

  const query =
    "friday_briefings?select=headline,severity,situasi,analisa,risiko,rekomendasi,hasil_diharapkan,generated_at" +
    "&scope=eq.company&status=eq.ready&order=created_at.desc&limit=1";

  try {
    const res = await fetch(`${MKHSISTEM_SUPABASE_URL}/rest/v1/${query}`, {
      headers: { apikey: MKHSISTEM_ANON_KEY, Authorization: `Bearer ${token}`, Accept: "application/json" },
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
    });
    if (!res.ok) return unreadable(business, "unreachable", `MK Connect menjawab HTTP ${res.status}`);

    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      return unreadable(
        business,
        "degraded",
        "Belum ada briefing eksekutif MK Connect yang siap, atau akun ini tidak punya izin membacanya.",
      );
    }

    const b = rows[0];
    const narrative = [
      `Severity: ${b.severity ?? "tidak disebutkan"}`,
      `Situasi: ${b.situasi ?? "-"}`,
      `Analisa: ${b.analisa ?? "-"}`,
      `Risiko: ${b.risiko ?? "-"}`,
      `Rekomendasi: ${b.rekomendasi ?? "-"}`,
    ].join("\n");

    return {
      key: business.key,
      name: business.name,
      type: business.type,
      sourceSystem: business.sourceSystem,
      health: "ok",
      headline: b.headline ?? null,
      severity: b.severity ?? null,
      generatedAt: b.generated_at ?? null,
      metrics: [],
      narrative,
      note: null,
    };
  } catch (err) {
    return unreadable(business, "unreachable", `MK Connect tidak dapat dihubungi: ${err.message}`);
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Gunakan POST." });
    return;
  }

  const token = req.body?.token || null;

  // Seluruh bisnis dibaca paralel, dan kegagalan tiap bisnis dikurung di
  // dalam bisnis itu sendiri.
  const businesses = await Promise.all(
    BUSINESS_REGISTRY.map((business) =>
      business.connector === "mkconnect" ? fetchMkConnect(business, token) : fetchHttpBusiness(business),
    ),
  );

  const terbaca = businesses.filter((b) => b.health === "ok" || b.health === "degraded").length;
  const belumTerhubung = businesses.filter((b) => b.health === "belum_terhubung").length;

  res.status(200).json({
    capturedAt: new Date().toISOString(),
    total: businesses.length,
    terbaca,
    belumTerhubung,
    tidakTerhubungi: businesses.length - terbaca - belumTerhubung,
    businesses,
  });
}
