// Sisi klien dari jembatan holding. Lapisan Connector-nya sendiri hidup di
// api/holding.js (server) supaya token tiap dashboard bisnis tidak pernah
// menyeberang ke browser.
//
// File ini hanya melakukan dua hal: meminta snapshot grup, lalu mengubahnya
// jadi kalimat yang enak DIDENGAR. Itu kendala yang berbeda dari layar:
// pembaca boleh memindai tabel, pendengar tidak. Jadi ringkasan lisan di sini
// sengaja pendek dan berurut prioritas — unit yang bermasalah lebih dulu, unit
// yang sehat cukup disebut jumlahnya.
//
// Konteks lengkapnya (buildExecutiveContext) baru dikirim ke otak MK Connect
// kalau pengguna memang meminta analisa — supaya pertanyaan sederhana seperti
// "cek holding" dijawab instan tanpa membakar token sama sekali.

const HOLDING_ENDPOINT = "/api/holding";

/** Label status yang diucapkan. "belum_terhubung" dan "unreachable" sengaja dibedakan — lihat api/holding.js. */
const HEALTH_SPOKEN = {
  ok: "terbaca",
  degraded: "terbaca sebagian",
  belum_terhubung: "belum terhubung",
  unreachable: "tidak dapat dihubungi",
};

export async function fetchGroupSnapshot(token) {
  const res = await fetch(HOLDING_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  if (!res.ok) throw new Error(`Jembatan holding gagal (${res.status})`);
  return res.json();
}

function formatIdr(value) {
  if (value === null || value === undefined) return "tidak tersedia";
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1).replace(".", ",")} miliar rupiah`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(".", ",")} juta rupiah`;
  return `${Math.round(value).toLocaleString("id-ID")} rupiah`;
}

function formatMetric(metric) {
  if (metric.value === null) return `${metric.label} tidak tersedia`;
  if (metric.unit === "idr") return `${metric.label} ${formatIdr(metric.value)}`;
  if (metric.unit === "percent") return `${metric.label} ${String(metric.value).replace(".", ",")} persen`;
  if (metric.unit === "days") return `${metric.label} ${metric.value} hari`;
  return `${metric.label} ${metric.value}`;
}

/**
 * Ringkasan grup untuk diucapkan — tanpa panggilan AI sama sekali.
 *
 * Yang disebut lebih dulu adalah hal yang menuntut tindakan: unit yang tidak
 * terbaca dan temuan utama holding. Unit yang sehat cukup disebut jumlahnya,
 * karena menyebut satu per satu unit yang baik-baik saja adalah cara tercepat
 * membuat pendengar berhenti menyimak.
 */
export function formatGroupSummary(snapshot) {
  if (!snapshot?.businesses?.length) {
    return "Belum ada lini bisnis yang terdaftar di jembatan holding.";
  }

  const parts = [];
  const { total, terbaca, belumTerhubung, tidakTerhubungi } = snapshot;

  parts.push(`Grup punya ${total} lini bisnis terdaftar. ${terbaca} terbaca.`);
  if (belumTerhubung > 0) parts.push(`${belumTerhubung} belum terhubung ke jembatan.`);
  if (tidakTerhubungi > 0) parts.push(`${tidakTerhubungi} tidak dapat dihubungi saat ini.`);

  const holding = snapshot.businesses.find((b) => b.key === "mkconnect");
  if (holding?.health === "ok" && holding.headline) {
    parts.push(`Dari MK Connect: ${holding.headline}`);
    if (holding.severity) parts.push(`Status: ${holding.severity}.`);
  } else if (holding?.note) {
    parts.push(holding.note);
  }

  // Unit non-holding yang punya angka: sebut ringkas, maksimal dua metrik per
  // unit supaya tidak berubah jadi pembacaan laporan.
  for (const business of snapshot.businesses) {
    if (business.key === "mkconnect") continue;
    if (business.health === "ok" && business.metrics.length > 0) {
      const top = business.metrics.slice(0, 2).map(formatMetric).join(", ");
      parts.push(`${business.name}: ${top}.`);
    }
  }

  const belum = snapshot.businesses.filter((b) => b.health === "belum_terhubung").map((b) => b.name);
  if (belum.length > 0) {
    parts.push(
      `${belum.join(", ")} belum punya jembatan data. Itu bukan berarti bisnisnya sepi — datanya memang belum bisa saya baca.`,
    );
  }

  return parts.join(" ");
}

/**
 * Blok konteks yang dikirim ke otak MK Connect saat pengguna minta ANALISA.
 *
 * Dirender sebagai teks berlabel, bukan JSON mentah, supaya satuan dan makna
 * ikut menempel di tiap angka — itu yang mencegah model membaca rupiah sebagai
 * jumlah. Unit yang tidak terbaca ditulis apa adanya sebagai tidak terbaca,
 * TIDAK sebagai nol, karena "bisnis ini tidak berpendapatan" dan "sistem
 * bisnis ini tidak menjawab" menuntut keputusan yang berlawanan.
 */
export function buildExecutiveContext(snapshot) {
  const lines = [
    `SNAPSHOT LINTAS LINI BISNIS (dikumpulkan FRIDAY lewat Connector, ${new Date(snapshot.capturedAt).toLocaleString("id-ID")}):`,
    `Total unit terdaftar ${snapshot.total}, terbaca ${snapshot.terbaca}, belum terhubung ${snapshot.belumTerhubung}, tidak dapat dihubungi ${snapshot.tidakTerhubungi}.`,
    "",
  ];

  for (const business of snapshot.businesses) {
    lines.push(`=== ${business.name} [${business.key}] — jenis ${business.type} — status data: ${HEALTH_SPOKEN[business.health] ?? business.health} ===`);
    lines.push(`Sumber kebenaran data: ${business.sourceSystem}.`);
    if (business.note) lines.push(`Catatan: ${business.note}`);

    if (business.metrics?.length) {
      for (const m of business.metrics) {
        const stale = typeof m.freshnessDays === "number" && m.freshnessDays >= 3 ? ` (DATA BERUMUR ${m.freshnessDays} HARI — jangan dianggap kondisi hari ini)` : "";
        lines.push(`  - ${formatMetric(m)}${m.period ? ` — ${m.period}` : ""}${stale}`);
      }
    }
    if (business.narrative) lines.push(business.narrative);
    lines.push("");
  }

  lines.push(
    "ATURAN: unit berstatus 'belum terhubung' atau 'tidak dapat dihubungi' TIDAK BOLEH dinilai berkinerja buruk — datanya memang tidak tersedia. Kalau itu menghalangi analisa, jadikan perbaikan jembatan datanya sebagai temuan dan rekomendasi tersendiri. Jangan bandingkan unit yang skalanya jauh berbeda tanpa menyebut perbedaan itu.",
  );

  return lines.join("\n");
}

/** Daftar nama lini bisnis untuk pencocokan ucapan ("cek bisnis villa"). */
export function businessNamesFrom(snapshot) {
  return (snapshot?.businesses ?? []).map((b) => ({ key: b.key, name: b.name, type: b.type }));
}

export { HEALTH_SPOKEN };
